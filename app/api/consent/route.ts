import { db, newCode, newToken, sha256, json } from '@/lib/db';

const REQUIRED = ['participation', 'recording', 'cloning', 'research_use', 'deletion_after_project'];

// POST { inviteCode, consent: {<flag>: true,...}, profile?: {accent_region, native_language, age_range, gender} }
export async function POST(req: Request) {
  const { inviteCode, consent, profile } = await req.json().catch(() => ({}));
  const invites = (process.env.INVITE_CODES ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!invites.includes(inviteCode)) return json({ error: 'Invalid invite code' }, 403);
  if (!consent || !REQUIRED.every((k) => consent[k] === true)) return json({ error: 'All consent items are required' }, 400);

  const code = newCode();
  const token = newToken(); // shown to the client once; only its hash is stored
  const { error } = await db.from('participants').insert({
    code,
    token_hash: sha256(token),
    accent_region: profile?.accent_region ?? null,
    native_language: profile?.native_language ?? null,
    age_range: profile?.age_range ?? null,
    gender: profile?.gender ?? null,
    consent_version: process.env.CONSENT_VERSION ?? 'v1',
    consent_flags: consent,
  });
  if (error) return json({ error: 'Could not register participant' }, 500);
  return json({ code, token });
}
