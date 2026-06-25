-- Étape 1.5 — Auth + RLS (exécuter après schema.sql et policies.sql de base)
-- Prérequis : activer Email (magic link) dans Supabase → Authentication → Providers

-- Retirer les lectures publiques temporaires
drop policy if exists "watches_public_read" on public.watches;
drop policy if exists "checks_public_read" on public.checks;

-- Lier chaque watch à un compte
alter table public.watches
  add column if not exists owner_id uuid references auth.users (id);

-- Lecture : uniquement ses watches
create policy "watches_select_own"
  on public.watches for select
  to authenticated
  using (auth.uid() = owner_id);

-- Réclamation initiale (première connexion, watch sans propriétaire)
create policy "watches_claim_unowned"
  on public.watches for update
  to authenticated
  using (owner_id is null)
  with check (auth.uid() = owner_id);

-- Pause / reprise par le propriétaire
create policy "watches_update_own"
  on public.watches for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Checks : uniquement ceux de ses watches
create policy "checks_select_own"
  on public.checks for select
  to authenticated
  using (
    exists (
      select 1 from public.watches w
      where w.id = checks.watch_id and w.owner_id = auth.uid()
    )
  );
