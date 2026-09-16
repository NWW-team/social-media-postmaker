-- =====================================================================
-- Social Media Opmaaktool — het huisstijllettertype achter de allowlist
--
-- Plak dit hele bestand in Supabase: Dashboard -> SQL Editor -> New query
-- -> plakken -> Run. Het is idempotent: opnieuw draaien is veilig.
--
-- RijksSansVF is licentieplichtig. Hij hoort dus niet in de publieke repo,
-- waar iedereen met de link het bestand kan binnenhalen. Hij staat hier, in
-- een besloten opslagbak, achter precies dezelfde toets als de huisstijl
-- zelf: private.is_toegestaan() uit 01_schema.sql.
--
-- Wat dit wel doet: de letter uit de openbare ruimte houden. Wie geen
-- toegestaan account heeft, krijgt het bestand niet — de opslag-API weigert
-- het, net als de tabellen.
--
-- Wat dit niet doet: de letter afschermen voor wie hem wél mag gebruiken.
-- Een ingelogde redacteur heeft het bestand per definitie in zijn browser
-- staan en kan het daaruit opdiepen. Dat is bij de huisstijl niet anders.
-- De grens ligt bij het account, niet bij het bestandsformaat.
--
-- Draai hierna 03_controle.sql; sectie 6 en 7 gaan over deze bak.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. De opslagbak
--
-- public = false is het hele punt: bij een publieke bak werkt
-- /storage/v1/object/public/... zonder token, en dan staat de letter alsnog
-- open op het internet. Bij een besloten bak loopt élk verzoek langs de
-- policies hieronder.
--
-- De maat- en typegrens zijn geen beveiliging maar een vangnet tegen een
-- verkeerd bestand: hier hoort een woff2 van een paar tientallen kB in, niet
-- een zip of een installer. application/octet-stream staat erbij omdat niet
-- elke browser een woff2 herkent bij het uploaden.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'huisstijl-font',
  'huisstijl-font',
  false,
  2097152,                       -- 2 MB
  array['font/woff2', 'application/font-woff2', 'application/octet-stream']
)
on conflict (id) do update
  set public             = false,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- ---------------------------------------------------------------------
-- 2. Wie mag de letter ophalen
--
-- Eén policy, en alleen voor select. Er is met opzet geen policy voor
-- insert, update of delete: vanuit de browser kan niemand een lettertype
-- toevoegen, vervangen of weggooien — ook een toegelaten redacteur niet.
-- Uploaden doe je in het dashboard, net als het vullen van de huisstijl.
--
-- anon komt hier niet voor en krijgt dus niets: op storage.objects staat RLS
-- aan, en zonder policy is het antwoord nee.
-- ---------------------------------------------------------------------

drop policy if exists "huisstijlletter lezen door toegestane gebruikers" on storage.objects;
create policy "huisstijlletter lezen door toegestane gebruikers"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'huisstijl-font' and (select private.is_toegestaan()));
