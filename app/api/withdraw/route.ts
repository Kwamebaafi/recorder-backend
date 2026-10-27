import { db, BUCKET, authParticipant, json } from '@/lib/db';

// POST (Bearer token) -> hard-deletes the participant's audio and all rows (consent withdrawal).
export async function POST(req: Request) {
  const p = await authParticipant(req);
  if (!p) return json({ error: 'Unauthorised' }, 401);
  const { data: recs } = await db.from('recordings').select('storage_path').eq('participant_id', p.id);
  const paths = (recs ?? []).map((r) => r.storage_path);
  if (paths.length) await db.storage.from(BUCKET).remove(paths);
  await db.from('participants').delete().eq('id', p.id); // recordings cascade
  return json({ deleted: true });
}
