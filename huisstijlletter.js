/*
 * huisstijlletter.js — RijksSansVF ophalen uit de besloten opslag.
 *
 * Het huisstijllettertype is licentieplichtig en staat daarom niet in deze
 * publieke repo. Het staat in Supabase Storage, in de besloten bak
 * `huisstijl-font`, achter dezelfde toets als de huisstijl zelf: alleen een
 * account op de allowlist krijgt de bestanden. Zie supabase/05_huisstijlletter.sql.
 *
 * Net als bij de huisstijl beslissen wij dat hier niet. We vrágen om het
 * bestand; de policy in Postgres bepaalt of we het krijgen. Krijgen we het
 * niet — geen toegang, nog niet geüpload, netwerk eruit — dan draait de tool
 * door op Fira Sans, de open terugvalletter uit vendor/. De regelval wijkt dan
 * iets af, maar de redacteur staat niet voor een stukgelopen scherm.
 *
 * De letter komt binnen als bestand en wordt met FontFace geregistreerd, niet
 * met een @font-face-regel in CSS. Dat moet ook: een CSS-url zou onbevoegd
 * opgehaald worden, zonder het token van de ingelogde gebruiker, en dat
 * weigert de opslag terecht.
 */

'use strict';

const LETTERBAK = 'huisstijl-font';

/*
 * De familienaam staat vast op RijksSansVF. Dat is niet willekeurig: zo heet
 * de familie in het bestand zelf, én zo noemen de design tokens hem als eerste
 * keuze in --rhc-text-font-family-sans. Daardoor hoeft er verder niets aan de
 * opmaak te veranderen — zodra deze letter geregistreerd is, pakt zowel het
 * scherm als het canvas hem vanzelf op, en anders staat Fira Sans erachter.
 */
const LETTERFAMILIE = 'RijksSansVF';

/*
 * Twee bestanden: één rechte en één schuine snede. Allebei variabel over het
 * gewicht (wght 200–800), dus 400, 550 en 700 komen uit hetzelfde bestand.
 * De namen zijn die van de officiële levering; upload ze onveranderd.
 */
const LETTERSNEDEN = [
  { bestand: 'RijksSansWeb-Regular.woff2', snede: 'normal' },
  { bestand: 'RijksSansWeb-Italic.woff2',  snede: 'italic' },
];

const GEWICHTBEREIK = '200 800';

/*
 * Hoe lang het opstarten op de letter wacht. Twee kwaden tegen elkaar: wie
 * doorstart voordat de letter er is, laat het canvas zichtbaar van letter
 * wisselen; wie blijft wachten, laat de redacteur naar een leeg scherm kijken.
 * Twee bestanden van samen zo'n 150 kB zijn ruim binnen deze tijd binnen, dus
 * in de praktijk gebeurt geen van beide. Duurt het tóch langer, dan wint het
 * scherm: de app start op de terugvalletter en tekent opnieuw zodra de letter
 * alsnog binnen is.
 */
const WACHTTIJD_MS = 2500;

let letterGeladen = false;

/* Eén snede: ophalen, inlezen, registreren. */
async function haalSnede(sb, snede) {
  const { data, error } = await sb.storage.from(LETTERBAK).download(snede.bestand);
  if (error) throw new Error(snede.bestand + ' — ' + error.message);
  if (!data) throw new Error(snede.bestand + ' — leeg antwoord');

  /*
   * display: 'swap' — tekst blijft leesbaar in de terugvalletter zolang deze
   * nog niet klaar is. Bij een bestand dat al binnen is duurt dat een oogwenk,
   * maar het scheelt een onzichtbare kop als het tegenzit.
   */
  const letter = new FontFace(LETTERFAMILIE, await data.arrayBuffer(), {
    weight: GEWICHTBEREIK,
    style: snede.snede,
    display: 'swap',
  });

  await letter.load();
  document.fonts.add(letter);
}

/*
 * Beide sneden ophalen. Levert true zodra er ten minste één binnen is: met
 * alleen de rechte snede is de tool nog steeds in de huisstijl opgemaakt, en
 * maakt de browser van schuin zelf een schuine — dezelfde terugval als
 * voorheen. Een halve levering is beter dan geen.
 *
 * Deze functie gooit met opzet niets door. Geen huisstijlletter is een
 * schoonheidsprobleem, geen storing; de aanroeper hoeft er niets mee te doen
 * behalve opnieuw tekenen.
 */
async function laadHuisstijlletter(sb) {
  if (letterGeladen) return true;
  if (!sb || !sb.storage || typeof window.FontFace !== 'function' || !document.fonts) {
    return false;
  }

  const uitkomsten = await Promise.allSettled(
    LETTERSNEDEN.map((snede) => haalSnede(sb, snede))
  );

  uitkomsten.forEach((uitkomst) => {
    if (uitkomst.status === 'rejected') {
      console.warn('Huisstijlletter niet geladen:', uitkomst.reason && uitkomst.reason.message);
    }
  });

  letterGeladen = uitkomsten.some((uitkomst) => uitkomst.status === 'fulfilled');
  if (!letterGeladen) {
    console.warn('De tool gebruikt de terugvalletter Fira Sans.');
  }
  return letterGeladen;
}

/*
 * Wachten op de letter voordat de app start — maar niet langer dan
 * WACHTTIJD_MS. Duurt het langer, dan start de app op de terugvalletter en
 * tekent app.js opnieuw zodra de letter er alsnog is. Zonder dat hertekenen
 * zou het canvas op Fira Sans blijven staan terwijl het scherm eromheen al in
 * de huisstijlletter staat: de export zou dan afwijken van wat je ziet.
 */
const TRAAG = Symbol('de letter laat op zich wachten');

async function wachtOpHuisstijlletter(sb) {
  const laden = laadHuisstijlletter(sb);
  const klok = new Promise((klaar) => { setTimeout(() => klaar(TRAAG), WACHTTIJD_MS); });

  if (await Promise.race([laden, klok]) !== TRAAG) return;

  laden.then((gelukt) => {
    if (gelukt && typeof tekenOpnieuw === 'function') tekenOpnieuw();
  });
}
