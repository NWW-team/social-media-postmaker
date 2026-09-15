/*
 * config.js — de publieke projectconfiguratie.
 *
 * Deze twee waarden mogen in een openbare repo staan. Ze zijn daarvoor
 * gemaakt: de publishable key zegt alleen WELK Supabase-project je
 * aanspreekt, niet WIE je bent. Wat een bezoeker vervolgens mag zien of
 * doen, bepalen de RLS-policies in supabase/01_schema.sql — in de database,
 * waar de browser niet bij kan.
 *
 * Hier hoort dus NOOIT in:
 *   - de service_role key of secret key (sb_secret_...)  — die negeert alle
 *     policies en geeft volledige toegang tot de database;
 *   - het databasewachtwoord;
 *   - het JWT-secret.
 *
 * Invullen: zie supabase/LEESMIJ.md, stap 6.
 */

'use strict';

const SUPABASE_CONFIG = {
  // Project Settings -> Data API -> Project URL
  url: 'VUL_IN_https://xxxxxxxxxxxx.supabase.co',

  // Project Settings -> API Keys -> Publishable key (sb_publishable_...)
  // Heeft je project die nog niet: de legacy "anon public" key.
  publishableKey: 'VUL_IN_sb_publishable_xxxxxxxxxxxxxxxxxxxx',
};

/* Kleine hulp zodat een niet-ingevulde config een duidelijke melding geeft
   in plaats van een vage netwerkfout. */
function configIsIngevuld() {
  return !SUPABASE_CONFIG.url.startsWith('VUL_IN_') &&
         !SUPABASE_CONFIG.publishableKey.startsWith('VUL_IN_');
}
