import { db, BUCKET, authParticipant, json } from '@/lib/db';

// POST { promptId, deviceInfo, audioSettings } -> signed upload target (file goes straight to storage,
// so Vercel's ~4.5 MB function body limit never applies).
export async function POST(req: Request) {
  const p = await authParticipant(req);
  if (!p) return json({ error: 'Unauthorised' }, 401);
  const { promptId, deviceInfo, audioSettings } = await req.json().catch(() => ({}));

  const { data: prompt } = await db.from('prompts').select('id').eq('id', promptId).maybeSingle();
  if (!prompt) return json({ error: 'Unknown prompt' }, 400);

  const path = `${p.code}/${promptId}.wav`;
  const { data: rec, error } = await db
    .from('recordings')
    .upsert(
      { participant_id: p.id, prompt_id: promptId, storage_path: path, status: 'pending', sha256: null,
        reject_reason: null, verified_at: null, device_info: deviceInfo ?? null, audio_settings: audioSettings ?? null },
      { onConflict: 'participant_id,prompt_id' },
    )
    .select('id')
    .single();
  if (error || !rec) return json({ error: 'Could not start recording' }, 500);

  // upsert: true lets a volunteer re-record the same prompt
  const { data: up, error: upErr } = await db.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
  if (upErr || !up) return json({ error: 'Could not create upload URL' }, 500);
  return json({ recordingId: rec.id, path: up.path, token: up.token });
}
