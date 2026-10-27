import { db, BUCKET, authParticipant, sha256, json } from '@/lib/db';
import { parseWav } from '@/lib/wav';

// POST { recordingId, sha256 } -> re-downloads the stored file, proves it is lossless PCM WAV,
// and checks it matches the hash the browser computed before upload.
export async function POST(req: Request) {
  const p = await authParticipant(req);
  if (!p) return json({ error: 'Unauthorised' }, 401);
  const { recordingId, sha256: clientHash } = await req.json().catch(() => ({}));

  const { data: rec } = await db.from('recordings').select('*').eq('id', recordingId).eq('participant_id', p.id).maybeSingle();
  if (!rec) return json({ error: 'Recording not found' }, 404);

  const reject = async (reason: string) => {
    await db.from('recordings').update({ status: 'rejected', reject_reason: reason }).eq('id', rec.id);
    return json({ status: 'rejected', reason }, 422);
  };

  const { data: blob, error } = await db.storage.from(BUCKET).download(rec.storage_path);
  if (error || !blob) return reject('File missing in storage');
  const buf = Buffer.from(await blob.arrayBuffer());

  const serverHash = sha256(buf);
  if (serverHash !== clientHash) return reject('Hash mismatch: file changed in transit');

  let w;
  try { w = parseWav(buf); } catch (e) { return reject((e as Error).message); }
  if (w.format !== 1) return reject('Not uncompressed PCM');
  if (w.bits !== 16) return reject('Expected 16-bit samples');
  if (w.channels !== 1) return reject('Expected mono');
  if (w.sampleRate < 16000) return reject('Sample rate too low');
  if (w.durationS < 1 || w.durationS > 90) return reject('Duration out of range');

  await db.from('recordings').update({
    status: 'verified', sha256: serverHash, sample_rate: w.sampleRate, channels: w.channels,
    bits: w.bits, duration_s: w.durationS, verified_at: new Date().toISOString(),
  }).eq('id', rec.id);
  return json({ status: 'verified', durationS: w.durationS, sampleRate: w.sampleRate });
}
