-- Run once in the Supabase SQL editor.
create extension if not exists pgcrypto;

create table participants (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,              -- pseudonymous ID, e.g. GH-7K2Q9X
  token_hash text not null,               -- sha256 of the secret session token
  accent_region text, native_language text, age_range text, gender text,  -- optional self-report
  consent_version text not null,
  consent_flags jsonb not null,
  consented_at timestamptz not null default now()
);

create table prompts (
  id text primary key,
  kind text not null check (kind in ('read','scam_roleplay','benign')),
  text text not null,
  position int not null
);

create table recordings (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  prompt_id text not null references prompts(id),
  storage_path text not null,
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  sha256 text, sample_rate int, channels int, bits int, duration_s real,
  device_info jsonb, audio_settings jsonb, reject_reason text,
  created_at timestamptz not null default now(), verified_at timestamptz,
  unique (participant_id, prompt_id)
);

-- RLS on, no policies: only the server's service-role key can touch these tables.
alter table participants enable row level security;
alter table prompts enable row level security;
alter table recordings enable row level security;

-- Private bucket, 15 MB cap per file.
insert into storage.buckets (id, name, public, file_size_limit)
values ('recordings', 'recordings', false, 15000000) on conflict (id) do nothing;

-- Placeholder prompts: replace with your real script (all fictional).
insert into prompts (id, kind, text, position) values
 ('r01','read','The quick brown fox jumps over the lazy dog near the old market.',1),
 ('r02','read','Please send the money before the shop closes this evening.',2),
 ('s01','scam_roleplay','Hello, this is MTN support. Your account is blocked, please read me the code we just sent you.',31),
 ('b01','benign','Hi, I am running late, please keep my seat and I will pay when I arrive.',37)
on conflict do nothing;
