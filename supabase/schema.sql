-- Veille Créneau — schéma étape 1 (cocon + cuisine)
-- À exécuter dans Supabase : SQL Editor → New query → Run

-- Catalogue des cabinets (landing)
create table if not exists public.cabinets (
  id text primary key,
  name text not null,
  city text,
  department text,
  sector text,
  booking_url text not null unique,
  status text not null default 'active',
  interventions jsonb not null default '[]',
  calendars jsonb not null default '[]',
  note text,
  created_at timestamptz not null default now()
);

-- Surveillance(s) — une watch = une veille active ou passée
create table if not exists public.watches (
  id uuid primary key default gen_random_uuid(),
  cabinet_id text not null references public.cabinets (id),
  status text not null default 'paused'
    check (status in ('active', 'paused', 'completed')),
  group_id integer not null,
  api_key text not null,
  intervention_id integer not null,
  calendar_ids integer[] not null,
  calendar_names jsonb not null default '{}',
  ntfy_topic text,
  check_interval_minutes integer not null default 15,
  scan_days integer not null default 90,
  alerts_remaining integer,
  label text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

-- Historique des scans
create table if not exists public.checks (
  id bigserial primary key,
  watch_id uuid not null references public.watches (id) on delete cascade,
  checked_at timestamptz not null default now(),
  slot_count integer not null default 0,
  slots jsonb not null default '[]',
  notified boolean not null default false,
  error text
);

create index if not exists checks_watch_id_checked_at_idx
  on public.checks (watch_id, checked_at desc);

-- Créneaux déjà vus (évite les doublons d'alerte)
create table if not exists public.known_slots (
  watch_id uuid not null references public.watches (id) on delete cascade,
  slot_key text not null,
  first_seen_at timestamptz not null default now(),
  primary key (watch_id, slot_key)
);

-- Demandes via formulaire landing (optionnel)
create table if not exists public.cabinet_requests (
  id bigserial primary key,
  cabinet_name text not null,
  city text not null,
  motif text not null,
  department text default '',
  details text default '',
  email text default '',
  created_at timestamptz not null default now()
);

-- RLS activé — policies à affiner quand l'auth sera branchée (bloc 5)
alter table public.cabinets enable row level security;
alter table public.watches enable row level security;
alter table public.checks enable row level security;
alter table public.known_slots enable row level security;
alter table public.cabinet_requests enable row level security;

-- Lecture publique du catalogue (landing sans login)
create policy "catalog_public_read"
  on public.cabinets for select
  using (true);

-- Écriture formulaire (anon) — à restreindre plus tard si spam
create policy "cabinet_requests_insert"
  on public.cabinet_requests for insert
  with check (true);

-- Watches / checks : policies temporaires pour le dev (à remplacer par auth.uid())
-- Le worker VPS utilisera la service_role key (jamais côté navigateur).
