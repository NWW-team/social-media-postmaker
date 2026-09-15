-- =====================================================================
-- Beproef de toegangsregels vanuit de database zelf.
--
-- Plak in Supabase -> SQL Editor -> Run. Schrijft niets blijvends weg:
-- de schrijfpogingen horen allemaal geweigerd te worden.
--
-- WAAROM DIT NODIG IS: in de SQL Editor ben je een rol die RLS OMZEILT.
-- Gewoon `select * from huisstijl` bewijst dus niets. Hieronder schakelen
-- we expliciet naar de rollen `anon` en `authenticated` en zetten we een
-- nagebootst JWT, zodat de policies wel gelden.
--
-- Dit toetst de policies zoals Postgres ze evalueert. De laatste schakel —
-- of PostgREST een publishable key correct op de rol `anon` afbeeldt en een
-- ingelogd token op `authenticated` — toets je met test 6 uit TESTEN.md,
-- vanuit de browser.
--
-- Elke regel in de uitslag hoort in de kolom `goed` een `ja` te geven.
-- =====================================================================

create temp table if not exists uitslag (nr serial, test text, verwacht text, gezien text);
delete from uitslag;

do $$
declare
  n int;
  toegelaten text := '{"sub":"11111111-1111-1111-1111-111111111111","email":"redacteur@example.org","role":"authenticated"}';
  buiten     text := '{"sub":"22222222-2222-2222-2222-222222222222","email":"buitenstaander@example.org","role":"authenticated"}';
begin

-- Pas deze twee adressen aan als je andere testaccounts gebruikt. Het eerste
-- moet op de allowlist staan, het tweede niet.

-- --- De uitgelogde bezoeker (rol anon) ------------------------------------
begin
  execute 'set local role anon';
  execute 'select count(*) from public.huisstijl' into n;
  execute 'reset role';
  insert into uitslag(test,verwacht,gezien) values ('anon leest huisstijl','geweigerd', n||' rijen');
exception when others then
  insert into uitslag(test,verwacht,gezien) values ('anon leest huisstijl','geweigerd','geweigerd');
end;

begin
  execute 'set local role anon';
  execute 'select count(*) from public.concepten' into n;
  execute 'reset role';
  insert into uitslag(test,verwacht,gezien) values ('anon leest concepten','geweigerd', n||' rijen');
exception when others then
  insert into uitslag(test,verwacht,gezien) values ('anon leest concepten','geweigerd','geweigerd');
end;

begin
  execute 'set local role anon';
  execute 'select count(*) from public.toegestane_gebruikers' into n;
  execute 'reset role';
  insert into uitslag(test,verwacht,gezien) values ('anon leest allowlist','geweigerd', n||' rijen');
exception when others then
  insert into uitslag(test,verwacht,gezien) values ('anon leest allowlist','geweigerd','geweigerd');
end;

-- --- Het toegelaten account ----------------------------------------------
begin
  execute format('set local request.jwt.claims = %L', toegelaten);
  execute 'set local role authenticated';
  execute 'select count(*) from public.huisstijl' into n;
  execute 'reset role';
  insert into uitslag(test,verwacht,gezien) values ('toegelaten account leest huisstijl','11 rijen', n||' rijen');
exception when others then
  insert into uitslag(test,verwacht,gezien) values ('toegelaten account leest huisstijl','11 rijen','geweigerd');
end;

begin
  execute format('set local request.jwt.claims = %L', toegelaten);
  execute 'set local role authenticated';
  execute 'select count(*) from public.toegestane_gebruikers' into n;
  execute 'reset role';
  insert into uitslag(test,verwacht,gezien) values ('toegelaten account leest allowlist','1 rijen', n||' rijen');
exception when others then
  insert into uitslag(test,verwacht,gezien) values ('toegelaten account leest allowlist','1 rijen','geweigerd');
end;

-- --- Het account dat NIET op de allowlist staat --------------------------
begin
  execute format('set local request.jwt.claims = %L', buiten);
  execute 'set local role authenticated';
  execute 'select count(*) from public.huisstijl' into n;
  execute 'reset role';
  insert into uitslag(test,verwacht,gezien) values ('niet-toegelaten account leest huisstijl','0 rijen', n||' rijen');
exception when others then
  insert into uitslag(test,verwacht,gezien) values ('niet-toegelaten account leest huisstijl','0 rijen','geweigerd');
end;

begin
  execute format('set local request.jwt.claims = %L', buiten);
  execute 'set local role authenticated';
  execute 'select count(*) from public.concepten' into n;
  execute 'reset role';
  insert into uitslag(test,verwacht,gezien) values ('niet-toegelaten account leest concepten','0 rijen', n||' rijen');
exception when others then
  insert into uitslag(test,verwacht,gezien) values ('niet-toegelaten account leest concepten','0 rijen','geweigerd');
end;

begin
  execute format('set local request.jwt.claims = %L', buiten);
  execute 'set local role authenticated';
  execute 'select count(*) from public.toegestane_gebruikers' into n;
  execute 'reset role';
  insert into uitslag(test,verwacht,gezien) values ('niet-toegelaten account leest allowlist','0 rijen', n||' rijen');
exception when others then
  insert into uitslag(test,verwacht,gezien) values ('niet-toegelaten account leest allowlist','0 rijen','geweigerd');
end;

-- --- Schrijfpogingen die allemaal moeten stuklopen -----------------------
begin
  execute format('set local request.jwt.claims = %L', toegelaten);
  execute 'set local role authenticated';
  execute 'insert into public.toegestane_gebruikers(email) values (''indringer@example.org'')';
  execute 'reset role';
  insert into uitslag(test,verwacht,gezien) values ('toegelaten account vult allowlist aan','geweigerd','GELUKT');
exception when others then
  insert into uitslag(test,verwacht,gezien) values ('toegelaten account vult allowlist aan','geweigerd','geweigerd');
end;

begin
  execute format('set local request.jwt.claims = %L', toegelaten);
  execute 'set local role authenticated';
  execute 'insert into public.huisstijl(sleutel,waarde) values (''gekaapt'',''1''::jsonb)';
  execute 'reset role';
  insert into uitslag(test,verwacht,gezien) values ('toegelaten account schrijft huisstijl','geweigerd','GELUKT');
exception when others then
  insert into uitslag(test,verwacht,gezien) values ('toegelaten account schrijft huisstijl','geweigerd','geweigerd');
end;

begin
  execute format('set local request.jwt.claims = %L', toegelaten);
  execute 'set local role authenticated';
  execute 'update public.huisstijl set waarde = ''"#FF0000"''::jsonb where sleutel = ''papier''';
  get diagnostics n = row_count;
  execute 'reset role';
  insert into uitslag(test,verwacht,gezien) values ('toegelaten account overschrijft huisstijl','0 rijen', n||' rijen');
exception when others then
  insert into uitslag(test,verwacht,gezien) values ('toegelaten account overschrijft huisstijl','0 rijen','geweigerd');
end;

begin
  execute format('set local request.jwt.claims = %L', buiten);
  execute 'set local role authenticated';
  execute 'insert into public.concepten(titel,inhoud) values (''Proef'',''{}''::jsonb)';
  execute 'reset role';
  insert into uitslag(test,verwacht,gezien) values ('niet-toegelaten account bewaart concept','geweigerd','GELUKT');
exception when others then
  insert into uitslag(test,verwacht,gezien) values ('niet-toegelaten account bewaart concept','geweigerd','geweigerd');
end;

end $$;

select nr, test, verwacht, gezien,
       case when verwacht = gezien then 'ja' else 'NEE - ONDERZOEKEN' end as goed
from uitslag order by nr;
