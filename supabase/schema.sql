-- Run once in Supabase > SQL Editor. Visitors may insert a row; they cannot read, change or delete anything.

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contact_method text not null check (contact_method in ('whatsapp_call', 'email')),
  name text check (name is null or char_length(name) between 1 and 100),
  whatsapp text check (whatsapp is null or whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  email text check (email is null or (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  message text check (message is null or char_length(message) between 1 and 1000),
  consent boolean not null check (consent),
  consent_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  -- Exactly one way to reach the person: WhatsApp or email, never both.
  constraint one_contact_only check (
    (contact_method = 'whatsapp_call' and whatsapp is not null and name is not null and email is null and message is null)
    or
    (contact_method = 'email' and email is not null and message is not null and whatsapp is null)
  )
);

alter table public.registrations enable row level security;

revoke all on public.registrations from anon, authenticated;

-- Column-level grant: visitors can never set id, created_at, consent_at or status.
grant insert (contact_method, name, whatsapp, email, message, consent)
  on public.registrations to anon;

drop policy if exists "public can register" on public.registrations;
create policy "public can register"
  on public.registrations
  for insert
  to anon
  with check (consent is true);
