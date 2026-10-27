import { db, authParticipant, json } from '@/lib/db';

// GET (Bearer token) -> ordered script plus which prompts are already verified.
export async function GET(req: Request) {
  const p = await authParticipant(req);
  if (!p) return json({ error: 'Unauthorised' }, 401);
  const [{ data: prompts }, { data: done }] = await Promise.all([
    db.from('prompts').select('id,kind,text,position').order('position'),
    db.from('recordings').select('prompt_id').eq('participant_id', p.id).eq('status', 'verified'),
  ]);
  return json({ code: p.code, prompts, completed: (done ?? []).map((r) => r.prompt_id) });
}
