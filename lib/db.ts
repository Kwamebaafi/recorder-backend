import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';

export const BUCKET = 'recordings';
export const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

export const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');

export function newCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alike characters
  const bytes = randomBytes(6);
  return 'GH-' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

// Bearer token -> participant row (null if missing/invalid).
export async function authParticipant(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!token) return null;
  const { data } = await db.from('participants').select('*').eq('token_hash', sha256(token)).maybeSingle();
  return data;
}

export const json = (body: unknown, status = 200) => Response.json(body, { status });
