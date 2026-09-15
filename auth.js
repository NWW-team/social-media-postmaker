/*
 * auth.js — inloggen, uitloggen en het ophalen van de afgeschermde gegevens.
 *
 * Wat dit bestand WEL doet: het scherm in de juiste stand zetten en de
 * Supabase-client aanroepen.
 *
 * Wat dit bestand NIET doet: toegang verlenen. Elke regel hieronder draait in
 * de browser van de bezoeker en is dus door die bezoeker te veranderen. Wie
 * `document.getElementById('werkblad').hidden = false` in de console typt,
 * krijgt het scherm te zien — en een leeg canvas, want de huisstijl komt uit
 * Supabase en daar beslissen de RLS-policies uit supabase/01_schema.sql.
 *
 * De volgorde is daarom: eerst vragen, dan tonen. Niet: tonen en hopen.
 */

'use strict';

let sb = null;                 // de Supabase-client
let concepten = [];

/*
 * Het gebruikers-id waarvoor het scherm nu staat ingesteld. De beginwaarde is
 * bewust GEEN null: null is een geldige stand ("niemand ingelogd"), en met null
 * als beginwaarde zou de eerste melding van onAuthStateChange voor een
 * uitgelogde bezoeker als "er verandert niets" worden weggefilterd. Die zag dan
 * noch het inlogscherm, noch de app.
 */
const NOG_GEEN_STAND = Symbol('nog geen scherm getoond');
let actieveGebruiker = NOG_GEEN_STAND;

/* ------------------------------------------------------------- opstarten */

document.addEventListener('DOMContentLoaded', () => {
  const poort = document.getElementById('poort');
  const startfout = document.getElementById('startfout');

  if (!configIsIngevuld()) {
    poort.hidden = true;
    toon(startfout,
      'config.js is nog niet ingevuld. Zet de Project URL en de publishable key ' +
      'erin; zie supabase/LEESMIJ.md stap 6.');
    return;
  }

  if (typeof window.supabase === 'undefined') {
    poort.hidden = true;
    toon(startfout,
      'De Supabase-client kon niet geladen worden. Controleer je ' +
      'internetverbinding en of cdn.jsdelivr.net bereikbaar is.');
    return;
  }

  sb = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.publishableKey
  );

  koppelInlogformulier();
  koppelUitloggen();
  koppelConcepten();

  /*
   * onAuthStateChange vuurt zelf meteen met de opgeslagen sessie (INITIAL_SESSION),
   * dus een aparte getSession() is niet nodig. Hij vuurt ook bij het stilletjes
   * vernieuwen van het token; daarom kijken we naar het gebruikers-id en doen we
   * niets als dat hetzelfde blijft.
   */
  sb.auth.onAuthStateChange((gebeurtenis, sessie) => {
    const id = sessie ? sessie.user.id : null;
    if (id === actieveGebruiker && gebeurtenis !== 'SIGNED_OUT') return;
    actieveGebruiker = id;
    if (sessie) {
      naBinnenkomst(sessie);
    } else {
      toonPoort();
    }
  });
});

/* -------------------------------------------------------------- inloggen */

function koppelInlogformulier() {
  const formulier = document.getElementById('inlogformulier');
  const knop = document.getElementById('inlogknop');
  const melding = document.getElementById('inlogmelding');

  formulier.addEventListener('submit', async (e) => {
    e.preventDefault();
    verberg(melding);
    knop.disabled = true;
    knop.textContent = 'Bezig…';

    /*
     * signInWithPassword laat het wachtwoord door de officiële client
     * afhandelen. We slaan zelf niets op, hashen zelf niets en bouwen zelf
     * geen token: dat is precies de reden om Supabase Auth te gebruiken.
     */
    const { error } = await sb.auth.signInWithPassword({
      email: document.getElementById('inlogEmail').value.trim(),
      password: document.getElementById('inlogWachtwoord').value,
    });

    knop.disabled = false;
    knop.textContent = 'Inloggen';

    if (error) {
      // Bewust één algemene tekst: onderscheid tussen "dit adres bestaat niet"
      // en "het wachtwoord klopt niet" vertelt een buitenstaander welke
      // adressen accounts hebben.
      toon(melding, 'Inloggen is niet gelukt. Controleer je e-mailadres en wachtwoord.');
      console.warn('Inloggen mislukt:', error.message);
      return;
    }

    document.getElementById('inlogWachtwoord').value = '';
    // onAuthStateChange pakt het vanaf hier op.
  });
}

function koppelUitloggen() {
  document.getElementById('uitlogknop').addEventListener('click', async () => {
    await sb.auth.signOut();
    /*
     * Herladen na uitloggen. Dat is geen opsmuk: de opgehaalde huisstijl en de
     * concepten staan op dat moment nog in het geheugen van het tabblad. Een
     * verse pagina is de enige manier om zeker te weten dat er niets van de
     * vorige gebruiker achterblijft voor de volgende.
     */
    window.location.reload();
  });
}

/* ------------------------------------------- na inloggen: mag je ook iets? */

/*
 * Inloggen is niet hetzelfde als toegang hebben. Een account kan bestaan en
 * kunnen inloggen, en toch op geen enkele allowlist staan. Dat merken we hier:
 * de database geeft dan nul huisstijlregels terug.
 *
 * Merk op dat we dit niet zelf beslissen. We vrágen om de huisstijl; de
 * policies in Postgres bepalen of we die krijgen. Deze functie leest alleen
 * het antwoord af.
 */
async function naBinnenkomst(sessie) {
  const adres = sessie.user.email || '';
  document.getElementById('poort').hidden = true;
  verberg(document.getElementById('startfout'));

  const { data, error } = await sb
    .from('huisstijl')
    .select('sleutel, waarde');

  if (error) {
    toonGeenToegang(adres);
    console.warn('Huisstijl ophalen mislukt:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    // Geen fout, wel nul rijen: precies wat RLS doet bij een account dat niet
    // op de allowlist staat. Postgres weigert niet luidruchtig — het filtert.
    toonGeenToegang(adres);
    return;
  }

  const config = {};
  data.forEach((rij) => { config[rij.sleutel] = rij.waarde; });

  const verwacht = ['kleuren', 'lettertype', 'decoratie', 'iconen', 'platforms',
                    'formats', 'stramien', 'korps', 'regelhoogte', 'stijlen', 'papier'];
  const ontbreekt = verwacht.filter((s) => !(s in config));
  if (ontbreekt.length) {
    document.getElementById('werkblad').hidden = true;
    toon(document.getElementById('startfout'),
      'De huisstijl in Supabase is onvolledig; deze sleutels ontbreken: ' +
      ontbreekt.join(', ') + '. Draai supabase/02_huisstijl_vullen.sql opnieuw.');
    return;
  }

  // Sleutel aanwezig maar leeg is net zo onbruikbaar als sleutel afwezig.
  const leeg = ['stijlen', 'platforms', 'formats', 'iconen']
    .filter((s) => !config[s] || Object.keys(config[s]).length === 0);
  if (leeg.length) {
    document.getElementById('werkblad').hidden = true;
    toon(document.getElementById('startfout'),
      'De huisstijl in Supabase is leeg voor: ' + leeg.join(', ') +
      '. Draai supabase/02_huisstijl_vullen.sql opnieuw.');
    return;
  }

  TEMPLATES = config;
  toonApp(adres);
  startApp();
  await laadConcepten();
}

/* ------------------------------------------------------------- concepten */

function koppelConcepten() {
  document.getElementById('conceptBewaren').addEventListener('click', bewaarConcept);
  document.getElementById('conceptOpenen').addEventListener('click', openConcept);
  document.getElementById('conceptVerwijderen').addEventListener('click', verwijderConcept);
}

async function laadConcepten() {
  const { data, error } = await sb
    .from('concepten')
    .select('id, titel, inhoud, bijgewerkt_op')
    .order('bijgewerkt_op', { ascending: false });

  if (error) {
    conceptMelding('Concepten ophalen is niet gelukt.', 'fout');
    console.warn('Concepten ophalen mislukt:', error.message);
    return;
  }

  concepten = data || [];
  const lijst = document.getElementById('conceptlijst');
  lijst.innerHTML = '';

  if (concepten.length === 0) {
    const leeg = document.createElement('option');
    leeg.textContent = 'Nog geen concepten bewaard';
    leeg.value = '';
    lijst.appendChild(leeg);
    return;
  }

  concepten.forEach((c) => {
    const optie = document.createElement('option');
    optie.value = c.id;
    const datum = new Date(c.bijgewerkt_op).toLocaleDateString('nl-NL',
      { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    optie.textContent = c.titel + ' — ' + datum;
    lijst.appendChild(optie);
  });
}

async function bewaarConcept() {
  const veld = document.getElementById('conceptTitel');
  const titel = veld.value.trim();
  if (!titel) {
    conceptMelding('Geef het concept eerst een naam.', 'fout');
    veld.focus();
    return;
  }

  /*
   * gebruiker_id zetten we hier niet. De kolom heeft `default auth.uid()` en
   * de insert-policy eist dat die waarde gelijk is aan de ingelogde gebruiker.
   * Zo kan niemand een concept op naam van een ander wegschrijven, ook niet
   * door hier een ander id mee te sturen.
   */
  const { error } = await sb
    .from('concepten')
    .insert({ titel: titel, inhoud: leesConcept() });

  if (error) {
    conceptMelding('Bewaren is niet gelukt.', 'fout');
    console.warn('Bewaren mislukt:', error.message);
    return;
  }

  veld.value = '';
  conceptMelding('Concept "' + titel + '" bewaard.', 'goed');
  await laadConcepten();
}

function openConcept() {
  const id = document.getElementById('conceptlijst').value;
  const concept = concepten.find((c) => c.id === id);
  if (!concept) {
    conceptMelding('Kies eerst een concept.', 'fout');
    return;
  }
  pasConceptToe(concept.inhoud);
  conceptMelding('Concept "' + concept.titel +
    '" geopend. Sleep je foto er opnieuw in — die wordt niet bewaard.', 'goed');
}

async function verwijderConcept() {
  const id = document.getElementById('conceptlijst').value;
  const concept = concepten.find((c) => c.id === id);
  if (!concept) {
    conceptMelding('Kies eerst een concept.', 'fout');
    return;
  }
  if (!window.confirm('Concept "' + concept.titel + '" verwijderen?')) return;

  const { error } = await sb.from('concepten').delete().eq('id', id);
  if (error) {
    conceptMelding('Verwijderen is niet gelukt.', 'fout');
    console.warn('Verwijderen mislukt:', error.message);
    return;
  }
  conceptMelding('Concept verwijderd.', 'goed');
  await laadConcepten();
}

function conceptMelding(tekst, soort) {
  const melding = document.getElementById('conceptmelding');
  melding.textContent = tekst;
  melding.className = 'melding' + (soort ? ' ' + soort : '');
  melding.hidden = !tekst;
}

/* ----------------------------------------------------------- schermstanden */

function toonPoort() {
  document.getElementById('werkblad').hidden = true;
  document.getElementById('geentoegang').hidden = true;
  document.getElementById('sessiebalk').hidden = true;
  document.getElementById('poort').hidden = false;
}

function toonGeenToegang(adres) {
  document.getElementById('werkblad').hidden = true;
  document.getElementById('poort').hidden = true;
  document.getElementById('geentoegangAdres').textContent = adres;
  document.getElementById('geentoegang').hidden = false;
  // Uitlogknop blijft staan, anders zit je vast in dit scherm.
  document.getElementById('sessieadres').textContent = adres;
  document.getElementById('sessiebalk').hidden = false;
}

function toonApp(adres) {
  document.getElementById('poort').hidden = true;
  document.getElementById('geentoegang').hidden = true;
  document.getElementById('sessieadres').textContent = adres;
  document.getElementById('sessiebalk').hidden = false;
  document.getElementById('werkblad').hidden = false;
}

function toon(element, tekst) {
  element.textContent = tekst;
  element.hidden = false;
}

function verberg(element) {
  element.hidden = true;
}
