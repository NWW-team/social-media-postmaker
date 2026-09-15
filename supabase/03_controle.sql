-- =====================================================================
-- Controle: staan de toegangsregels er echt op?
--
-- Plak in Supabase -> SQL Editor -> Run. Verandert niets; leest alleen.
-- Draai dit na 01_schema.sql en na elke wijziging aan de policies.
-- =====================================================================

-- 1. Elke tabel in public MOET rls_aan = true hebben.
--    Een tabel zonder RLS is met de publieke sleutel volledig leesbaar.
select
  c.relname                        as tabel,
  c.relrowsecurity                 as rls_aan,
  count(p.polname)                 as aantal_policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public' and c.relkind = 'r'
group by c.relname, c.relrowsecurity
order by c.relname;

-- 2. Alle policies uitgeschreven, zodat je kunt nalezen wat er getoetst wordt.
select
  tablename   as tabel,
  policyname  as policy,
  cmd         as operatie,
  roles       as voor_rol,
  qual        as leesvoorwaarde,
  with_check  as schrijfvoorwaarde
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- 3. Alarm: tabellen met RLS aan maar zonder enkele policy zijn onbruikbaar,
--    tabellen met RLS uit zijn onbeschermd. Beide moeten leeg blijven.
select c.relname as probleemtabel,
       case when not c.relrowsecurity then 'RLS STAAT UIT'
            else 'RLS aan maar geen enkele policy' end as wat
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public' and c.relkind = 'r'
group by c.relname, c.relrowsecurity
having not c.relrowsecurity or count(p.polname) = 0;

-- 4. Wie staat er op de allowlist, en heeft dat adres ook echt een account?
select
  t.email,
  t.notitie,
  (u.id is not null) as heeft_account,
  (u.email_confirmed_at is not null) as bevestigd
from public.toegestane_gebruikers t
left join auth.users u on lower(u.email) = t.email
order by t.email;

-- 5. Accounts die WEL bestaan maar NIET op de allowlist staan.
--    Die horen te kunnen inloggen en vervolgens nul rijen te zien.
select u.email, u.created_at
from auth.users u
left join public.toegestane_gebruikers t on t.email = lower(u.email)
where t.email is null
order by u.created_at;
