-- =====================================================================
-- Social Media Opmaaktool — toegangsregels
--
-- Plak dit hele bestand in Supabase: Dashboard -> SQL Editor -> New query
-- -> plakken -> Run. Het is idempotent: opnieuw draaien is veilig.
--
-- Hier ligt de toegangscontrole. Niet in de frontend. Een bezoeker die de
-- pagina opslaat, het inlogscherm weghaalt en zelf een Supabase-client
-- bouwt, komt alsnog niet langs deze policies — die draaien in Postgres.
--
-- Twee dingen samen bepalen toegang:
--   1. AUTHENTICATIE — wie ben je? Supabase Auth, tabel auth.users.
--   2. AUTORISATIE   — mag je iets? public.toegestane_gebruikers + RLS.
--
-- Een account kan dus bestaan en kunnen inloggen, en toch nul rijen zien.
-- Dat is expres: het is de enige manier om "niet-toegestaan account" te
-- kunnen testen zonder het account te verwijderen.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. De lijst met toegestane gebruikers
--
-- Deze tabel is de allowlist. Hij wordt ALLEEN gevuld via het dashboard of
-- de SQL Editor: hieronder staan bewust geen insert/update/delete-policies,
-- dus via de publieke API kan niemand zichzelf toevoegen. Ook geen
-- ingelogde gebruiker.
-- ---------------------------------------------------------------------

create table if not exists public.toegestane_gebruikers (
  email          text primary key check (email = lower(email) and email like '%@%'),
  notitie        text,
  aangemaakt_op  timestamptz not null default now()
);

comment on table public.toegestane_gebruikers is
  'Allowlist. Alleen e-mailadressen hierin krijgen toegang tot huisstijl en concepten. Vullen via SQL Editor, niet via de API.';

alter table public.toegestane_gebruikers enable row level security;

-- anon = de niet-ingelogde bezoeker. Die heeft hier niets te zoeken.
revoke all on public.toegestane_gebruikers from anon;
grant select on public.toegestane_gebruikers to authenticated;

-- Een ingelogde gebruiker mag precies één rij zien: die van zichzelf.
-- Zo kan de app netjes "je hebt geen toegang" tonen zonder dat iemand de
-- hele lijst met collega's kan uitlezen.
drop policy if exists "eigen allowlist-rij lezen" on public.toegestane_gebruikers;
create policy "eigen allowlist-rij lezen"
  on public.toegestane_gebruikers
  for select
  to authenticated
  using (email = lower(auth.jwt() ->> 'email'));


-- ---------------------------------------------------------------------
-- 2. De toets die alle andere policies gebruiken
--
-- security definer, zodat de functie de allowlist mag lezen zonder dat de
-- aanroeper daar rechten op nodig heeft. search_path is leeggezet en alles
-- staat volledig gekwalificeerd: anders zou iemand met rechten op een eigen
-- schema een nep-tabel voor kunnen schuiven.
-- ---------------------------------------------------------------------

create or replace function public.is_toegestaan()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.toegestane_gebruikers t
    where t.email = lower(auth.jwt() ->> 'email')
  );
$$;

comment on function public.is_toegestaan() is
  'True als het e-mailadres in het huidige JWT op de allowlist staat.';

revoke all on function public.is_toegestaan() from public, anon;
grant execute on function public.is_toegestaan() to authenticated;


-- ---------------------------------------------------------------------
-- 3. De huisstijl-config
--
-- Stond eerst als templates.js in de publieke repo. Staat nu hier, achter
-- de allowlist. Zonder toegestaan account laadt de tool geen enkele stijl,
-- kleur of maat en kan hij dus niets opmaken.
-- ---------------------------------------------------------------------

create table if not exists public.huisstijl (
  sleutel        text primary key,
  waarde         jsonb not null,
  bijgewerkt_op  timestamptz not null default now()
);

comment on table public.huisstijl is
  'De huisstijl uit de PowerPoint-toolkit: kleuren, stramien, stijlen, iconen, exportmaten.';

alter table public.huisstijl enable row level security;

revoke all on public.huisstijl from anon;
grant select on public.huisstijl to authenticated;

-- Lezen mag; schrijven niet. Er is expres geen insert/update/delete-policy:
-- de huisstijl wijzigen doe je in de SQL Editor, niet vanuit de browser.
drop policy if exists "huisstijl lezen door toegestane gebruikers" on public.huisstijl;
create policy "huisstijl lezen door toegestane gebruikers"
  on public.huisstijl
  for select
  to authenticated
  using ((select public.is_toegestaan()));


-- ---------------------------------------------------------------------
-- 4. Opgeslagen concepten
--
-- Per gebruiker afgeschermd. Let op wat hier NIET in staat: de foto. Die
-- blijft in de browser, zoals de README belooft. Alleen de instellingen en
-- de getypte tekst gaan mee. De grootte-check hieronder houdt dat zo: een
-- base64-foto past er niet in.
-- ---------------------------------------------------------------------

create table if not exists public.concepten (
  id             uuid primary key default gen_random_uuid(),
  gebruiker_id   uuid not null default auth.uid()
                   references auth.users(id) on delete cascade,
  titel          text not null check (length(btrim(titel)) between 1 and 120),
  inhoud         jsonb not null check (pg_column_size(inhoud) <= 16384),
  aangemaakt_op  timestamptz not null default now(),
  bijgewerkt_op  timestamptz not null default now()
);

comment on table public.concepten is
  'Opgeslagen posts per redacteur: platform, formaat, stijl, kop, subtekst, iconen. Geen fotos.';

create index if not exists concepten_gebruiker_idx
  on public.concepten (gebruiker_id, bijgewerkt_op desc);

alter table public.concepten enable row level security;

revoke all on public.concepten from anon;
grant select, insert, update, delete on public.concepten to authenticated;

-- Vier policies, één per operatie. Elke policy toetst twee dingen:
-- is dit jouw rij (auth.uid), en sta je op de allowlist (is_toegestaan).
-- Alleen het eerste zou betekenen dat een verwijderd teamlid zijn eigen
-- concepten blijft zien zolang zijn account bestaat.

drop policy if exists "eigen concepten lezen" on public.concepten;
create policy "eigen concepten lezen"
  on public.concepten for select to authenticated
  using (gebruiker_id = (select auth.uid()) and (select public.is_toegestaan()));

drop policy if exists "eigen concepten toevoegen" on public.concepten;
create policy "eigen concepten toevoegen"
  on public.concepten for insert to authenticated
  with check (gebruiker_id = (select auth.uid()) and (select public.is_toegestaan()));

drop policy if exists "eigen concepten bijwerken" on public.concepten;
create policy "eigen concepten bijwerken"
  on public.concepten for update to authenticated
  using (gebruiker_id = (select auth.uid()) and (select public.is_toegestaan()))
  with check (gebruiker_id = (select auth.uid()) and (select public.is_toegestaan()));

drop policy if exists "eigen concepten verwijderen" on public.concepten;
create policy "eigen concepten verwijderen"
  on public.concepten for delete to authenticated
  using (gebruiker_id = (select auth.uid()) and (select public.is_toegestaan()));

-- bijgewerkt_op bijhouden, zodat de lijst op volgorde van bewerken staat.
create or replace function public.zet_bijgewerkt_op()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.bijgewerkt_op := now();
  new.gebruiker_id  := old.gebruiker_id;  -- eigenaar ligt vast
  return new;
end;
$$;

drop trigger if exists concepten_bijgewerkt on public.concepten;
create trigger concepten_bijgewerkt
  before update on public.concepten
  for each row execute function public.zet_bijgewerkt_op();
