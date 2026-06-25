-- Policies lecture cocon (étape 1 — une seule user, à restreindre avec auth plus tard)
-- Exécuter dans Supabase SQL Editor après schema.sql

create policy "watches_public_read"
  on public.watches for select
  using (true);

create policy "checks_public_read"
  on public.checks for select
  using (true);
