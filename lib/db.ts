import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

export const BUCKET = 'recordings';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://placeholder.supabase.co';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder-key';

export const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

export function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function sha256(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function newCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export function newToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function authParticipant(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return { error: 'Missing bearer token', status: 401, participant: null };
  }

  const hashed = sha256(token);
  const { data, error } = await db
    .from('participants')
    .select('*')
    .eq('token_hash', hashed)
    .single();

  if (error || !data) {
    return { error: 'Invalid or revoked token', status: 401, participant: null };
  }

  return { error: null, status: 200, participant: data };
}