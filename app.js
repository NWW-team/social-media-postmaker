/*
 * app.js — foto inpassen, huisstijl eroverheen, PNG eruit.
 *
 * De foto wordt nooit verstuurd, niet opgeslagen en niet gelogd. Alle
 * beeldbewerking gebeurt in de browser van de redacteur; er gaat geen enkele
 * pixel naar Supabase. Een bewaard concept bevat alleen instellingen en tekst.
 *
 * De opmaak zelf staat niet hier, maar in Supabase (tabel public.huisstijl).
 * auth.js haalt hem op zodra vaststaat dat de gebruiker toegang heeft, en zet
 * hem in TEMPLATES. Dit bestand tekent alleen wat daar beschreven staat.
 *
 * Zonder toegestaan account blijft TEMPLATES leeg en start deze app niet: de
 * database geeft dan geen enkele regel vrij.
 *
 * De toolkit schrijft voor: hou je aan de korpsgrootte en aan het maximum
 * aantal regels per tekstvak. Daarom verkleint de tekst hier niet stiekem —
 * hij wordt afgekapt en je krijgt een waarschuwing te zien.
 */

'use strict';

const state = {
  platform: 'instagram',
  format: 'staand',
  stijl: 'fotoBovenVlak',
  foto: null,                     // HTMLImageElement
  fotonaam: '',
  zoom: 1,                        // 1 = precies vullend
  brandpunt: { x: 0.5, y: 0.5 },  // welk punt van de foto in het midden staat
  kop: [],                        // reeks stukken, zie hieronder
  sub: [],
  decoratie: true,
  decoratiepositie: 'linksonder',
  iconen: ['Wereld (toolkit)', 'Gesprek (toolkit)'],
};

/*
 * Tekst is geen string maar een reeks STUKKEN.
 *
 * Een stuk is een aaneengesloten lap tekst met dezelfde opmaak:
 *
 *     { tekst: 'nieuw paspoort', korps: 'pt66', gewicht: 700, schuin: false }
 *
 * korps en gewicht zijn null als het stuk de stijl volgt; dat is iets anders
 * dan "toevallig dezelfde maat als de stijl". Wissel je van stijl, dan schuift
 * een stuk met null mee en een stuk met pt66 niet.
 *
 * Waarom niet gewoon een string met opmaak ernaast: omdat de redacteur één
 * woord moet kunnen uitlichten. Zodra opmaak per stuk kan, kan één regel
 * meerdere korpsgroottes bevatten, en dan moet de regelval, de regelhoogte en
 * het tekenen daar allemaal rekening mee houden. Dat loopt door dit hele
 * bestand heen — vandaar dat het model hier bovenaan staat en niet verstopt
 * zit in het tekstveld.
 */
const KAAL = { korps: null, gewicht: null, schuin: false };

/* De gewichten die de letter werkelijk heeft: Fira Sans staat in vendor/ met
   400, 600 en 700, RijksSansVF heeft ze ook. */
const NORMAAL = 400;
const VET = 700;

function stukkenUit(tekst) {
  return tekst ? [Object.assign({ tekst }, KAAL)] : [];
}

function platteTekst(stukken) {
  return stukken.map((stuk) => stuk.tekst).join('');
}

function zelfdeOpmaak(a, b) {
  return a.korps === b.korps && a.gewicht === b.gewicht && a.schuin === b.schuin;
}

/* Lege stukken eruit, buren met dezelfde opmaak samen. Zonder dit groeit de
   reeks bij elke klik: los klikken en weer terugzetten zou tien stukken
   opleveren waar er één hoort te staan. */
function normaliseer(stukken) {
  const uit = [];
  stukken.forEach((stuk) => {
    if (!stuk.tekst) return;
    const vorige = uit[uit.length - 1];
    if (vorige && zelfdeOpmaak(vorige, stuk)) vorige.tekst += stuk.tekst;
    else uit.push(Object.assign({}, stuk));
  });
  return uit;
}

function kopieerStukken(stukken) {
  return stukken.map((stuk) => Object.assign({}, stuk));
}

/* De stukjes tekst in het bereik [start, eind), met hun opmaak. */
function stukjesIn(stukken, start, eind) {
  const uit = [];
  let plek = 0;
  stukken.forEach((stuk) => {
    const begin = plek;
    const einde = plek + stuk.tekst.length;
    plek = einde;
    const van = Math.max(begin, start);
    const tot = Math.min(einde, eind);
    if (tot > van) {
      uit.push(Object.assign({}, stuk, { tekst: stuk.tekst.slice(van - begin, tot - begin) }));
    }
  });
  return uit;
}

/*
 * Opmaak op een bereik zetten. Stukken die het bereik doorsnijden worden
 * gesplitst; wat erbuiten valt blijft letterlijk wat het was.
 */
function zetOpmaak(stukken, start, eind, wijziging) {
  if (eind <= start) return stukken;
  const uit = [];
  let plek = 0;
  stukken.forEach((stuk) => {
    const begin = plek;
    const einde = plek + stuk.tekst.length;
    plek = einde;
    const a = Math.min(Math.max(start, begin), einde);
    const b = Math.min(Math.max(eind, begin), einde);
    const deel = (van, tot, raak) => {
      if (tot <= van) return;
      const nieuw = Object.assign({}, stuk, { tekst: stuk.tekst.slice(van - begin, tot - begin) });
      uit.push(raak ? Object.assign(nieuw, wijziging) : nieuw);
    };
    deel(begin, a, false);
    deel(a, b, true);
    deel(b, einde, false);
  });
  return normaliseer(uit);
}

/*
 * Waar de cirkels en de badges staan.
 *
 * De huisstijl beschrijft er maar één: de groep zoals hij op de
 * toolkitpagina's staat, gerekend vanaf de linkeronderhoek van de foto. Op het
 * account staat diezelfde groep ook rechtsonder, bovenin en onderaan het
 * midden — zie de posts over het paspoort in Brazilië en over alleen reizen
 * met kinderen. Dat zijn geen andere tekeningen maar dezelfde, gespiegeld of
 * verschoven.
 *
 * Daarom staan de vijf andere plekken hier als bewerking van die ene groep, en
 * niet als vijf extra coördinatenlijsten in Supabase. Verandert de huisstijl de
 * cirkels, dan verschuiven alle zes de plekken mee.
 *
 * 'links' en 'onder' samen zijn precies de huisstijl zoals hij was: dat is de
 * standaard en die tekent tot op de pixel hetzelfde als voorheen.
 */
const DECORATIEPOSITIES = {
  linksonder:  { label: 'Linksonder',  zij: 'links',  hoogte: 'onder' },
  middenonder: { label: 'Middenonder', zij: 'midden', hoogte: 'onder' },
  rechtsonder: { label: 'Rechtsonder', zij: 'rechts', hoogte: 'onder' },
  linksboven:  { label: 'Linksboven',  zij: 'links',  hoogte: 'boven' },
  middenboven: { label: 'Middenboven', zij: 'midden', hoogte: 'boven' },
  rechtsboven: { label: 'Rechtsboven', zij: 'rechts', hoogte: 'boven' },
};

const el = {};
const icoonCache = {};
const stijlkaartjes = [];
let laatsteWaarschuwingen = [];

/*
 * Een losse context om alleen mee te MÉTEN, nooit om op te tekenen.
 *
 * tekstMeting() heeft een canvascontext nodig om measureText te kunnen doen.
 * Daarvoor het echte exportcanvas gebruiken koppelt twee dingen die niets met
 * elkaar te maken hebben: het meten van een stijlkaartje zou dan de font-stand
 * van de export aanpassen. Deze context tekent niets en wordt nooit getoond.
 */
const meetCtx = document.createElement('canvas').getContext('2d');

/*
 * Een "opdracht" is alles wat je moet weten om één post te tekenen: welke
 * stijl, welk formaat, welke foto, welke tekst. `state` is de opdracht van het
 * grote canvas. De stijlkaartjes en het miniatuur in de kop geven een kopie mee
 * met één veld anders, en komen zo langs exact dezelfde tekencode uit als de
 * export. Wat je op een kaartje ziet, is dus geen indruk van die stijl maar die
 * stijl, met jouw foto en jouw tekst.
 */
function opdrachtMet(wijziging) {
  return Object.assign({}, state, {
    brandpunt: { x: state.brandpunt.x, y: state.brandpunt.y },
    iconen: state.iconen.slice(),
    kop: kopieerStukken(state.kop),
    sub: kopieerStukken(state.sub),
  }, wijziging || {});
}

/*
 * De huisstijl uit Supabase. Blijft null tot auth.js hem heeft opgehaald —
 * en dat lukt alleen met een account dat op de allowlist staat.
 */
let TEMPLATES = null;
let appGestart = false;

/* ---------------------------------------------------------------- opstarten */

/*
 * Wordt door auth.js aangeroepen, en alleen daar: pas als er een geldige
 * sessie is én de database daadwerkelijk huisstijlregels heeft teruggegeven.
 * Er hangt met opzet geen DOMContentLoaded aan: de app hoort niet te starten
 * omdat de pagina geladen is, maar omdat er toegang is.
 */
function startApp() {
  if (appGestart) return;
  if (!TEMPLATES) throw new Error('startApp() aangeroepen zonder huisstijl.');
  appGestart = true;

  [
    'canvas', 'dropzone', 'bestandsknop', 'bestandsinvoer', 'voorbeeldknop',
    'kop', 'sub', 'kopregels', 'subregels', 'zoom', 'zoomrij', 'resetknop',
    'downloadknop', 'maatlabel', 'stijlbron', 'melding', 'fotonaam', 'formaatnoot',
    'decoratieAan', 'decoratiepositie', 'icoon0', 'icoon1', 'icoonrij',
    'miniatuur', 'stijlvoorbeeldnoot', 'kopbalk', 'subbalk',
  ].forEach((id) => { el[id] = document.getElementById(id); });

  el.ctx = el.canvas.getContext('2d');

  // De standaardiconen staan in state hardgecodeerd; komt de set uit Supabase
  // ooit anders terug, dan pakken we gewoon de eerste twee die er wel zijn.
  const beschikbaar = icoonnamen();
  state.iconen = state.iconen.map(
    (naam, i) => (beschikbaar.includes(naam) ? naam : beschikbaar[i] || beschikbaar[0])
  );

  // Hetzelfde voor de standaardkeuzes. De huisstijl komt uit de database en
  // hoeft niet dezelfde namen te gebruiken als toen deze code geschreven werd;
  // een hernoemde stijl mag geen lege pagina opleveren.
  if (!TEMPLATES.stijlen[state.stijl]) state.stijl = Object.keys(TEMPLATES.stijlen)[0];
  if (!TEMPLATES.platforms[state.platform]) state.platform = Object.keys(TEMPLATES.platforms)[0];
  if (!TEMPLATES.formats[state.format]) state.format = Object.keys(TEMPLATES.formats)[0];

  laadIconen();
  bouwTekstvelden();
  bouwFormaatkaarten();
  bouwStijlknoppen();
  bouwIcoonkeuze();
  koppelKnoppen();
  koppelFotoInvoer();
  koppelSlepen();
  werkbijUI();
  teken();
}

/*
 * Opnieuw tekenen omdat er buiten de app om iets veranderd is waar de
 * tekening van afhangt. Nu is dat één ding: de huisstijlletter die alsnog
 * binnenkwam nadat het scherm al stond. Zonder dit blijft het canvas op de
 * terugvalletter staan terwijl het scherm eromheen de huisstijlletter al
 * gebruikt — en dan wijkt de download af van wat de redacteur ziet.
 *
 * teken() ververst ook de stijlkaartjes en het miniatuur, dus dit is genoeg.
 */
function tekenOpnieuw() {
  if (appGestart) teken();
}

/*
 * De keuzekaarten voor platform en formaat: één kaart per combinatie, met de
 * vorm en de exportmaat erop. Ze komen uit de huisstijl in Supabase, net als de
 * stijlen, zodat een platform of formaat toevoegen daar genoeg is.
 *
 * Eén kaart draagt twee keuzes tegelijk — data-platform én data-format — want
 * "Instagram staand" is voor de redacteur één ding, geen twee. koppelKnoppen()
 * en werkbijUI() lopen per sleutel langs alle knoppen met dat attribuut, dus
 * een kaart met allebei wordt vanzelf door allebei bediend.
 */
function bouwFormaatkaarten() {
  const rooster = document.getElementById('formaatkaarten');

  Object.keys(TEMPLATES.platforms).forEach((platform) => {
    const p = TEMPLATES.platforms[platform];

    Object.keys(TEMPLATES.formats).forEach((format) => {
      const maat = p.maten[format];
      if (!maat) return;     // niet elk platform hoeft elk formaat te hebben

      const f = TEMPLATES.formats[format];
      const kaart = document.createElement('button');
      kaart.type = 'button';
      kaart.className = 'kaart';
      kaart.dataset.platform = platform;
      kaart.dataset.format = format;
      kaart.setAttribute('aria-pressed', 'false');

      // De vorm van de export, met de afgeronde hoek rechtsonder uit de
      // toolkit — zodat je de verhouding ziet in plaats van hem te lezen.
      const doek = document.createElement('span');
      doek.className = 'kaart__vorm';
      const vel = document.createElement('span');
      vel.style.aspectRatio = maat[0] + ' / ' + maat[1];
      vel.style.borderEndEndRadius =
        (TEMPLATES.stramien.hoekFactor * 100).toFixed(1) + '%';
      doek.appendChild(vel);

      const naam = document.createElement('span');
      naam.className = 'kaart__naam';
      naam.textContent = (p.label || platform) + ' · ' +
                         (f.label || format).toLowerCase();

      const maatregel = document.createElement('span');
      maatregel.className = 'kaart__bij';
      maatregel.textContent = maat[0] + ' × ' + maat[1] + ' px · ' + f.verhoudingLabel;

      kaart.append(doek, naam, maatregel);
      rooster.appendChild(kaart);
    });
  });
}

/*
 * De stijlkaarten komen uit de huisstijl in Supabase, zodat een stijl
 * toevoegen daar genoeg is en hier niets hoeft te veranderen.
 *
 * Op elke kaart staat een canvas dat langs dezelfde tekencode komt als de
 * export. Je vergelijkt de vijf stijlen dus met jouw foto en jouw tekst erin,
 * niet met een plaatje dat ongeveer laat zien wat de bedoeling is.
 */
function bouwStijlknoppen() {
  const rooster = document.getElementById('stijlknoppen');

  Object.keys(TEMPLATES.stijlen).forEach((naam) => {
    const stijl = TEMPLATES.stijlen[naam];

    const kaart = document.createElement('button');
    kaart.type = 'button';
    kaart.className = 'kaart kaart--stijl';
    kaart.dataset.stijl = naam;
    kaart.setAttribute('aria-pressed', 'false');

    const doek = document.createElement('span');
    doek.className = 'kaart__vorm';
    const canvas = document.createElement('canvas');
    canvas.className = 'kaart__doek';
    doek.appendChild(canvas);

    const label = document.createElement('span');
    label.className = 'kaart__naam';
    label.textContent = stijl.label;

    const regels = document.createElement('span');
    regels.className = 'kaart__bij';
    regels.textContent = regellimiet(stijl.kop.maxRegels, 'kop') + ', ' +
                         regellimiet(stijl.sub.maxRegels, 'sub');

    kaart.append(doek, label, regels);
    rooster.appendChild(kaart);
    stijlkaartjes.push({ canvas, stijl: naam });
  });
}

function regellimiet(aantal, wat) {
  return aantal + ' regel' + (aantal === 1 ? '' : 's') + ' ' + wat;
}

/* ------------------------------------------------------------- voorbeelden */

/*
 * De canvassen op de stijlkaarten en het miniatuur in de kop. Ze worden op het
 * dubbele van hun getoonde breedte getekend, zodat ze scherp blijven op een
 * scherm met een hoge pixeldichtheid.
 */
/*
 * Voorbeeldtekst, en alleen voor de kleine voorbeelden.
 *
 * Zonder tekst is er geen tekstvlak: tekstHoogte() geeft dan nul terug en met
 * vlakKrimpt schrompelt het vlak weg. Alle vijf de stijlkaarten tonen dan
 * precies hetzelfde — een foto zonder vlak — terwijl het verschil tussen de
 * stijlen nu juist is waar die kaarten voor zijn. Met voorbeeldtekst zie je
 * waar het vlak zit, hoe hoog het wordt en welke kleur het heeft.
 *
 * Het exportcanvas krijgt dit NOOIT. Dat toont wat je downloadt, en met lege
 * velden download je een post zonder tekst. Zodra je één van de twee velden
 * invult, staat overal je eigen tekst.
 */
const VOORBEELDTEKST = {
  kop: stukkenUit('Souvenirs meenemen uit het buitenland?'),
  sub: stukkenUit('Dit zijn de regels.'),
};

const KAARTBREEDTE = 440;
const MINIATUURBREEDTE = 520;
let kaartjesWacht = null;

/*
 * Bij elke toetsaanslag en elke sleepbeweging alle kaartjes opnieuw tekenen zou
 * het werk ongeveer verdubbelen terwijl je aan het slepen bent. Ze lopen dus
 * achter de hand aan: pas als je even niets doet, worden ze bijgewerkt.
 */
function vraagKaartjes() {
  if (kaartjesWacht) clearTimeout(kaartjesWacht);
  kaartjesWacht = setTimeout(tekenVoorbeelden, 120);
}

function tekenVoorbeelden() {
  kaartjesWacht = null;
  const [breed, hoog] = huidigeMaat(state);
  const verhouding = hoog / breed;

  // Eén ingevuld veld is genoeg om overal je eigen tekst te laten zien.
  const eigenTekst = Boolean(platteTekst(state.kop).trim() || platteTekst(state.sub).trim());
  const invulling = eigenTekst ? {} : VOORBEELDTEKST;

  stijlkaartjes.forEach((kaartje) => {
    tekenKlein(kaartje.canvas, KAARTBREEDTE, Math.round(KAARTBREEDTE * verhouding),
               opdrachtMet(Object.assign({ stijl: kaartje.stijl, voorbeeldje: true }, invulling)));
  });

  if (el.miniatuur) {
    tekenKlein(el.miniatuur, MINIATUURBREEDTE, Math.round(MINIATUURBREEDTE * verhouding),
               opdrachtMet(Object.assign({ voorbeeldje: true }, invulling)));
  }

  if (el.stijlvoorbeeldnoot) el.stijlvoorbeeldnoot.hidden = eigenTekst;
}

function tekenKlein(canvas, breed, hoog, opdracht) {
  if (canvas.width !== breed || canvas.height !== hoog) {
    canvas.width = breed;
    canvas.height = hoog;
  }
  tekenOp(canvas.getContext('2d'), breed, hoog, opdracht);
}

/*
 * Iconen komen als SVG-tekst uit de huisstijl en worden hier omgezet naar een
 * data-URI. Geen los bestand dus: een canvas waar een extern plaatje in is
 * getekend raakt "besmet" en weigert daarna te exporteren. Met een data-URI
 * blijft de PNG-download werken.
 */
function laadIconen() {
  const kleur = TEMPLATES.decoratie.icoonKleur;
  Object.keys(TEMPLATES.iconen).forEach((naam) => {
    const bron = TEMPLATES.iconen[naam].trim();
    const img = new Image();
    img.onload = () => teken();          // opnieuw tekenen zodra hij binnen is
    img.src = bron.startsWith('data:')
      ? bron
      : 'data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(bron.replace(/\{kleur\}/g, kleur));
    icoonCache[naam] = img;
  });
}

/*
 * De iconen op alfabet.
 *
 * Postgres geeft de sleutels van een jsonb-waarde terug op lengte en pas
 * daarbinnen op alfabet, dus zonder dit staat "Euro" boven "Ambassade" en
 * "Nederlandse vlag" onderaan bij de toolkiticonen. Bij acht iconen viel dat
 * nog te overzien, bij twintig niet meer. localeCompare met 'nl' zet ook
 * iconen met een accent op hun plek.
 */
function icoonnamen() {
  return Object.keys(TEMPLATES.iconen).sort((a, b) => a.localeCompare(b, 'nl'));
}

/* ============================================================== teksteditor */

/*
 * De tekstvelden zijn contenteditable, geen textarea, want in een textarea kan
 * één woord niet vet zijn.
 *
 * Het model is de bron, niet de DOM: state.kop is de reeks stukken en het veld
 * is daar een weergave van. Dat is met opzet zo. Zou de DOM de waarheid zijn,
 * dan moest elke rare knoop die contenteditable achterlaat — een <font>, een
 * geneste <b>, een leeg <span> — ook op het canvas kloppen, en dat is precies
 * het soort bug dat zich pas in de export laat zien.
 *
 * Tijdens typen lezen we de DOM uit zonder opnieuw te tekenen: opnieuw
 * opbouwen zou de cursor naar het begin gooien bij elke aanslag. Alleen na een
 * klik op de werkbalk bouwen we het veld opnieuw op, en dan zetten we de
 * selectie terug op dezelfde tekens.
 */

const VELDEN = [
  { naam: 'kop', host: 'kop', balk: 'kopbalk' },
  { naam: 'sub', host: 'sub', balk: 'subbalk' },
];

/* --------------------------------------------------------------- DOM lezen */

/* Platte tekst van een knoop, met <br> en blokken als regelovergang. */
function platDom(knoop) {
  let uit = '';
  knoop.childNodes.forEach((kind) => {
    if (kind.nodeType === Node.TEXT_NODE) uit += kind.nodeValue;
    else if (kind.nodeName === 'BR') uit += '\n';
    else {
      if (blokachtig(kind) && uit && !uit.endsWith('\n')) uit += '\n';
      uit += platDom(kind);
    }
  });
  return uit;
}

function blokachtig(knoop) {
  return ['DIV', 'P', 'LI'].includes(knoop.nodeName);
}

function opmaakVanSpan(knoop, erboven) {
  if (!knoop.dataset || !knoop.dataset.op) return erboven;
  return {
    korps: knoop.dataset.korps || null,
    gewicht: knoop.dataset.gewicht ? Number(knoop.dataset.gewicht) : null,
    schuin: knoop.dataset.schuin === '1',
  };
}

/*
 * De stukken uit het veld lezen. Een harde spatie (\u00a0) wordt een gewone
 * spatie: contenteditable zet die er zelf tussen, en op het canvas zou hij een
 * regel net niet laten afbreken waar hij dat wel hoort te doen.
 */
function stukkenUitDom(host) {
  const uit = [];
  const loop = (knoop, opmaak) => {
    knoop.childNodes.forEach((kind) => {
      if (kind.nodeType === Node.TEXT_NODE) {
        uit.push(Object.assign({}, opmaak, { tekst: kind.nodeValue.replace(/\u00a0/g, ' ') }));
      } else if (kind.nodeName === 'BR') {
        uit.push(Object.assign({}, opmaak, { tekst: '\n' }));
      } else {
        if (blokachtig(kind) && uit.length) uit.push(Object.assign({}, opmaak, { tekst: '\n' }));
        loop(kind, opmaakVanSpan(kind, opmaak));
      }
    });
  };
  loop(host, KAAL);
  return normaliseer(uit);
}

/* -------------------------------------------------------------- DOM zetten */

/*
 * Hoe groot een stuk in het VELD getoond wordt. Het veld is geen post: de
 * korpsgroottes uit de toolkit zijn daar in verhouding tot elkaar zinvol, niet
 * in absolute pixels. Vandaar de verhouding tot de maat van de stijl, geknepen
 * tot iets dat in een invoerveld leesbaar blijft.
 */
function toonmaat(stuk, veldnaam) {
  if (!stuk.korps || !TEMPLATES.korps[stuk.korps]) return null;
  const stijlspec = TEMPLATES.stijlen[state.stijl][veldnaam];
  const keer = TEMPLATES.korps[stuk.korps] / stijlspec.grootte;
  return klem(keer, 0.7, 1.7).toFixed(2);
}

function domUitStukken(host, stukken, veldnaam) {
  host.textContent = '';
  stukken.forEach((stuk) => {
    stuk.tekst.split('\n').forEach((deel, i) => {
      if (i) host.appendChild(document.createElement('br'));
      if (!deel) return;
      if (zelfdeOpmaak(stuk, KAAL)) {
        host.appendChild(document.createTextNode(deel));
        return;
      }
      const span = document.createElement('span');
      span.dataset.op = '1';
      if (stuk.korps) span.dataset.korps = stuk.korps;
      if (stuk.gewicht) span.dataset.gewicht = String(stuk.gewicht);
      if (stuk.schuin) span.dataset.schuin = '1';

      const maat = toonmaat(stuk, veldnaam);
      if (maat) span.style.fontSize = maat + 'em';
      if (stuk.gewicht) span.style.fontWeight = String(stuk.gewicht);
      if (stuk.schuin) span.style.fontStyle = 'italic';

      span.textContent = deel;
      host.appendChild(span);
    });
  });
}

/* ---------------------------------------------------------------- selectie */

/* Hoeveel tekens er vóór dit punt staan, in dezelfde telling als het model. */
function tekenIndex(host, knoop, verschuiving) {
  const bereik = document.createRange();
  bereik.selectNodeContents(host);
  bereik.setEnd(knoop, verschuiving);
  const hulp = document.createElement('div');
  hulp.appendChild(bereik.cloneContents());
  return platDom(hulp).length;
}

function selectieIn(host) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  const bereik = sel.getRangeAt(0);
  if (!host.contains(bereik.commonAncestorContainer)) return null;
  return {
    start: tekenIndex(host, bereik.startContainer, bereik.startOffset),
    eind: tekenIndex(host, bereik.endContainer, bereik.endOffset),
  };
}

/* Het omgekeerde: tekenpositie terug naar een plek in de DOM. */
function plekVoor(host, doel) {
  let geteld = 0;
  const loop = document.createTreeWalker(host, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let knoop;
  while ((knoop = loop.nextNode())) {
    if (knoop.nodeType === Node.TEXT_NODE) {
      const lengte = knoop.nodeValue.length;
      if (geteld + lengte >= doel) return { knoop, verschuiving: doel - geteld };
      geteld += lengte;
    } else if (knoop.nodeName === 'BR') {
      if (geteld + 1 > doel) return { knoop: knoop.parentNode, verschuiving: 0 };
      geteld += 1;
    }
  }
  return { knoop: host, verschuiving: host.childNodes.length };
}

function zetSelectie(host, start, eind) {
  const van = plekVoor(host, start);
  const tot = plekVoor(host, eind);
  const bereik = document.createRange();
  try {
    bereik.setStart(van.knoop, van.verschuiving);
    bereik.setEnd(tot.knoop, tot.verschuiving);
  } catch (e) {
    return;                       // knoop is verdwenen: laat de cursor met rust
  }
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(bereik);
}

/* ---------------------------------------------------------------- werkbalk */

/*
 * De werkbalk kent twee soorten knoppen, en dat verschil is met opzet.
 *
 * De KORPSGROOTTE en OPMAAK VERWIJDEREN gelden voor het hele veld. Een kop
 * heeft één maat — dat is wat een kop tot een kop maakt — dus een maat per
 * woord zou een keuze zijn die de redacteur niet hoort te hoeven maken. En
 * omdat er niets te kiezen valt, hoeft er ook niets geselecteerd te worden.
 *
 * VET en SCHUIN gelden wel voor de selectie: die zijn er juist om één woord
 * uit te lichten.
 */

/* Voor het hele veld. Levert false als het veld leeg is; dan valt er niets op
   te maken en horen de knoppen uit te staan. */
function pasOpHeelVeld(veld, wijziging) {
  const host = el[veld.host];
  const stukken = stukkenUitDom(host);
  const lengte = platteTekst(stukken).length;
  if (!lengte) return false;

  const nieuw = zetOpmaak(stukken, 0, lengte, wijziging(stukken));
  state[veld.naam] = nieuw;
  domUitStukken(host, nieuw, veld.naam);
  werkbijWerkbalken();
  teken();
  return true;
}

/*
 * Welke sport van de korpsladder dit veld nu aanhoudt.
 *
 * Stukken zonder eigen korps volgen de stijl, dus die tellen mee met de maat
 * van de stijl. Staan er verschillende maten in — dat kan uit een concept van
 * voor deze knoppen komen — dan wint de grootste: die bepaalt de regelhoogte,
 * en dus wat de redacteur als "de maat van dit veld" ziet staan.
 *
 * Er wordt naar de dichtstbijzijnde sport gezocht en niet naar een exacte
 * treffer, zodat een stijlmaat die niet op de ladder staat toch een beginpunt
 * heeft om vanaf te stappen.
 *
 * Levert de plek op de ladder en niet de sport zelf: korpsladder() maakt bij
 * elke aanroep nieuwe objecten, dus een sport uit de ene aanroep is niet te
 * vinden in de andere.
 */
function veldSport(stukken, stijlspec, ladder) {
  const delen = stukken.map((stuk) => (
    (stuk.korps && TEMPLATES.korps[stuk.korps] !== undefined)
      ? TEMPLATES.korps[stuk.korps]
      : stijlspec.grootte
  ));
  const deel = delen.length ? Math.max.apply(null, delen) : stijlspec.grootte;

  let beste = 0;
  ladder.forEach((sport, i) => {
    if (Math.abs(sport.deel - deel) < Math.abs(ladder[beste].deel - deel)) beste = i;
  });
  return beste;
}

/* Eén sport omhoog (+1) of omlaag (-1), voor het hele veld. */
function stapKorps(veld, richting) {
  const stijlspec = TEMPLATES.stijlen[state.stijl][veld.naam];
  const ladder = korpsladder();
  const doel = ladder[veldSport(stukkenUitDom(el[veld.host]), stijlspec, ladder) + richting];
  if (!doel) return;              // boven- of onderaan de ladder; de knop staat dan ook uit

  /*
   * Kom je precies op de maat van de stijl uit, dan krijgt het veld géén eigen
   * korps maar volgt het de stijl weer. Anders zou "één omhoog en weer omlaag"
   * een veld achterlaten dat toevallig dezelfde maat heeft maar niet meer
   * meeschuift als je van stijl wisselt — en dat is iets anders.
   */
  pasOpHeelVeld(veld, () => ({ korps: doel.deel === stijlspec.grootte ? null : doel.sleutel }));
}

/*
 * Voor de selectie. Staat de cursor ergens zonder iets te selecteren, dan valt
 * er niets op te maken — dan zegt de knop dat, in plaats van stilletjes niets
 * te doen of stiekem het hele veld te pakken.
 */
function pasWerkbalkToe(veld, wijziging) {
  const host = el[veld.host];
  const plek = selectieIn(host);
  if (!plek || plek.eind <= plek.start) {
    toonMelding('Selecteer eerst een stuk tekst: de knoppen in de werkbalk ' +
                'gelden voor wat je geselecteerd hebt.', 'let');
    host.focus();
    return;
  }

  const stukken = stukkenUitDom(host);
  const nieuw = zetOpmaak(stukken, plek.start, plek.eind,
                          wijziging(stukjesIn(stukken, plek.start, plek.eind)));
  state[veld.naam] = nieuw;
  domUitStukken(host, nieuw, veld.naam);
  zetSelectie(host, plek.start, plek.eind);
  werkbijWerkbalken();
  teken();
}

/* Een schakelaar kijkt naar wat er staat: is het er overal al, dan gaat het uit. */
function allemaal(stukjes, toets) {
  return stukjes.length > 0 && stukjes.every(toets);
}

function werkbijWerkbalken() {
  VELDEN.forEach((veld) => {
    const host = el[veld.host];
    const plek = selectieIn(host);
    const stukken = stukkenUitDom(host);
    const stukjes = plek ? stukjesIn(stukken, plek.start, plek.eind) : [];
    const stijlspec = TEMPLATES.stijlen[state.stijl][veld.naam];

    const balk = el[veld.balk];
    const vet = balk.querySelector('[data-rol="vet"]');
    const schuin = balk.querySelector('[data-rol="schuin"]');

    vet.setAttribute('aria-pressed',
      String(allemaal(stukjes, (s) => (s.gewicht || stijlspec.gewicht) >= VET)));
    schuin.setAttribute('aria-pressed', String(allemaal(stukjes, (s) => s.schuin)));

    // De maat van het veld, met de grenzen van de ladder erbij: bovenaan gaat
    // + uit, onderaan de min. Een lege kop heeft nog geen maat om te stappen,
    // dus dan staan ze allebei uit — met de maat van de stijl in beeld, zodat
    // je ziet waar je aan begint.
    const ladder = korpsladder();
    const sport = veldSport(stukken, stijlspec, ladder);
    const gevuld = platteTekst(stukken).length > 0;

    balk.querySelector('[data-rol="maat"]').textContent = korpslabel(ladder[sport].sleutel);
    balk.querySelector('[data-rol="kleiner"]').disabled = !gevuld || sport <= 0;
    balk.querySelector('[data-rol="groter"]').disabled = !gevuld || sport >= ladder.length - 1;
    balk.querySelector('[data-rol="terug"]').disabled = !gevuld;
  });
}

function bouwTekstvelden() {
  VELDEN.forEach((veld) => {
    const host = el[veld.host];
    const balk = el[veld.balk];

    balk.querySelector('[data-rol="kleiner"]').addEventListener('click', () => stapKorps(veld, -1));
    balk.querySelector('[data-rol="groter"]').addEventListener('click', () => stapKorps(veld, 1));

    balk.querySelector('[data-rol="vet"]').addEventListener('click', () => {
      const stijlspec = TEMPLATES.stijlen[state.stijl][veld.naam];
      pasWerkbalkToe(veld, (stukjes) => ({
        gewicht: allemaal(stukjes, (s) => (s.gewicht || stijlspec.gewicht) >= VET) ? NORMAAL : VET,
      }));
    });

    balk.querySelector('[data-rol="schuin"]').addEventListener('click', () => {
      pasWerkbalkToe(veld, (stukjes) => ({ schuin: !allemaal(stukjes, (s) => s.schuin) }));
    });

    // Het hele veld terug naar de stijl, niet alleen de selectie: "opmaak
    // verwijderen" hoort te doen wat er staat, zonder dat je eerst iets moet
    // aanwijzen.
    balk.querySelector('[data-rol="terug"]').addEventListener('click', () => {
      pasOpHeelVeld(veld, () => Object.assign({}, KAAL));
    });

    // Typen: het model bijwerken zonder het veld opnieuw op te bouwen, anders
    // springt de cursor. De opmaak van het stuk waarin je typt erft vanzelf mee.
    host.addEventListener('input', () => {
      state[veld.naam] = stukkenUitDom(host);
      teken();
    });

    // Plakken komt binnen als platte tekst. Opgemaakte HTML uit een andere
    // pagina overnemen zou opmaak binnenhalen die de huisstijl niet kent.
    host.addEventListener('paste', (e) => {
      e.preventDefault();
      const tekst = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, tekst);
    });

    ['keyup', 'mouseup', 'focus'].forEach((soort) => {
      host.addEventListener(soort, werkbijWerkbalken);
    });
  });

  document.addEventListener('selectionchange', werkbijWerkbalken);
}

/* Het veld opnieuw opbouwen uit het model — na een concept of een stijlwissel. */
function toonTekstvelden() {
  VELDEN.forEach((veld) => domUitStukken(el[veld.host], state[veld.naam], veld.naam));
  werkbijWerkbalken();
}

function bouwIcoonkeuze() {
  Object.keys(DECORATIEPOSITIES).forEach((naam) => {
    const optie = document.createElement('option');
    optie.value = naam;
    optie.textContent = DECORATIEPOSITIES[naam].label;
    el.decoratiepositie.appendChild(optie);
  });
  el.decoratiepositie.value = state.decoratiepositie;
  el.decoratiepositie.addEventListener('change', () => {
    state.decoratiepositie = el.decoratiepositie.value;
    teken();
  });

  [el.icoon0, el.icoon1].forEach((keuzelijst, i) => {
    icoonnamen().forEach((naam) => {
      const optie = document.createElement('option');
      optie.value = naam;
      optie.textContent = naam;
      keuzelijst.appendChild(optie);
    });
    keuzelijst.value = state.iconen[i];
    keuzelijst.addEventListener('change', () => {
      state.iconen[i] = keuzelijst.value;
      teken();
    });
  });

  el.decoratieAan.checked = state.decoratie;
  el.decoratieAan.addEventListener('change', () => {
    state.decoratie = el.decoratieAan.checked;
    el.icoonrij.hidden = !state.decoratie;
    teken();
  });
}

/* ------------------------------------------------------------------- invoer */

function koppelKnoppen() {
  // Eén klik, één keer bijwerken — ook als de kaart twee keuzes tegelijk zet.
  document.querySelectorAll('[data-platform], [data-format], [data-stijl]')
    .forEach((knop) => {
      knop.addEventListener('click', () => {
        ['platform', 'format', 'stijl'].forEach((sleutel) => {
          if (sleutel in knop.dataset) state[sleutel] = knop.dataset[sleutel];
        });
        werkbijUI();
        teken();
      });
    });

  el.zoom.addEventListener('input', () => {
    state.zoom = Number(el.zoom.value);
    teken();
  });

  el.resetknop.addEventListener('click', () => {
    state.zoom = 1;
    state.brandpunt = { x: 0.5, y: 0.5 };
    el.zoom.value = '1';
    teken();
  });

  el.downloadknop.addEventListener('click', download);
  el.voorbeeldknop.addEventListener('click', laadVoorbeeldfoto);

  // Pijltjestoetsen verschuiven de foto, voor wie liever niet sleept.
  el.canvas.addEventListener('keydown', (e) => {
    const stap = e.shiftKey ? 20 : 5;
    const richting = {
      ArrowLeft: [stap, 0], ArrowRight: [-stap, 0],
      ArrowUp: [0, stap], ArrowDown: [0, -stap],
    }[e.key];
    if (!richting || !state.foto) return;
    e.preventDefault();
    verschuif(richting[0], richting[1]);
  });
}

function koppelFotoInvoer() {
  el.bestandsknop.addEventListener('click', () => el.bestandsinvoer.click());
  el.bestandsinvoer.addEventListener('change', (e) => {
    if (e.target.files[0]) neemBestand(e.target.files[0]);
    e.target.value = '';   // zelfde bestand nogmaals kiezen moet ook werken
  });

  ['dragenter', 'dragover'].forEach((type) => {
    el.dropzone.addEventListener(type, (e) => {
      e.preventDefault();
      el.dropzone.classList.add('actief');
    });
  });
  ['dragleave', 'drop'].forEach((type) => {
    el.dropzone.addEventListener(type, (e) => {
      e.preventDefault();
      el.dropzone.classList.remove('actief');
    });
  });
  el.dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files[0]) neemBestand(e.dataTransfer.files[0]);
  });

  // Voorkom dat een misgeslepen bestand de pagina vervangt door de foto.
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());

  window.addEventListener('paste', (e) => {
    const item = [...(e.clipboardData?.items || [])]
      .find((i) => i.type.startsWith('image/'));
    if (item) neemBestand(item.getAsFile(), 'geplakte afbeelding');
  });
}

function neemBestand(bestand, naam) {
  if (!bestand.type.startsWith('image/')) {
    toonMelding(
      'Dat is geen afbeelding (' + (bestand.type || bestand.name) + '). ' +
      'Kies een JPG, PNG of WEBP.', 'fout');
    return;
  }

  const url = URL.createObjectURL(bestand);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    zetFoto(img, naam || bestand.name);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    toonMelding('Deze afbeelding kon niet geopend worden.', 'fout');
  };
  img.src = url;
}

function zetFoto(img, naam) {
  state.foto = img;
  state.fotonaam = naam;
  state.zoom = 1;
  state.brandpunt = { x: 0.5, y: 0.5 };
  el.zoom.value = '1';
  werkbijUI();
  teken();
}

/* Een gegenereerde foto, zodat je kunt demonstreren zonder eerst een bestand
   te zoeken. Geen bestand in de repo, geen rechtenvraag. */
function laadVoorbeeldfoto() {
  const c = document.createElement('canvas');
  c.width = 1600;
  c.height = 1200;
  const x = c.getContext('2d');

  const lucht = x.createLinearGradient(0, 0, 0, 1200);
  lucht.addColorStop(0, '#2a6ebb');
  lucht.addColorStop(0.6, '#8fc2e8');
  lucht.addColorStop(1, '#e8d9b5');
  x.fillStyle = lucht;
  x.fillRect(0, 0, 1600, 1200);

  x.fillStyle = 'rgba(255,255,255,0.55)';
  [[300, 220, 90], [420, 200, 120], [1150, 300, 110], [1290, 280, 80]]
    .forEach(([cx, cy, r]) => {
      x.beginPath();
      x.arc(cx, cy, r, 0, Math.PI * 2);
      x.fill();
    });

  x.fillStyle = '#3f6b4a';
  x.beginPath();
  x.moveTo(0, 900);
  [[200, 840], [480, 910], [760, 820], [1080, 890], [1360, 830], [1600, 880]]
    .forEach(([px, py]) => x.lineTo(px, py));
  x.lineTo(1600, 1200);
  x.lineTo(0, 1200);
  x.closePath();
  x.fill();

  x.fillStyle = 'rgba(0,0,0,0.18)';
  x.fillRect(0, 1050, 1600, 150);

  const img = new Image();
  img.onload = () => zetFoto(img, 'voorbeeldfoto (gegenereerd)');
  img.src = c.toDataURL('image/png');
}

/* ------------------------------------------------------------ slepen en zoom */

function koppelSlepen() {
  let sleept = false;
  let vorige = null;

  el.canvas.addEventListener('pointerdown', (e) => {
    if (!state.foto) return;
    sleept = true;
    vorige = { x: e.clientX, y: e.clientY };
    el.canvas.setPointerCapture(e.pointerId);
    el.canvas.classList.add('sleept');
  });

  el.canvas.addEventListener('pointermove', (e) => {
    if (!sleept) return;
    // Van schermpixels naar canvaspixels: het canvas wordt met CSS geschaald.
    const schaal = el.canvas.width / el.canvas.getBoundingClientRect().width;
    verschuif((e.clientX - vorige.x) * schaal, (e.clientY - vorige.y) * schaal);
    vorige = { x: e.clientX, y: e.clientY };
  });

  ['pointerup', 'pointercancel'].forEach((type) => {
    el.canvas.addEventListener(type, () => {
      sleept = false;
      el.canvas.classList.remove('sleept');
    });
  });

  el.canvas.addEventListener('wheel', (e) => {
    if (!state.foto) return;
    e.preventDefault();
    state.zoom = klem(state.zoom * (e.deltaY < 0 ? 1.06 : 1 / 1.06), 1, 3);
    el.zoom.value = String(state.zoom);
    teken();
  }, { passive: false });
}

/* Verschuif de foto met dx,dy canvaspixels. Het brandpunt is het punt van de
   foto dat in het midden van het kader staat; slepen verplaatst dat punt. */
function verschuif(dx, dy) {
  const [breed, hoog] = huidigeMaat(state);
  const m = fotoMeting(indeling(breed, hoog, state).foto, state);
  state.brandpunt.x -= dx / m.tekenBreed;
  state.brandpunt.y -= dy / m.tekenHoog;
  teken();
}

/* ----------------------------------------------------------------- indeling */

function huidigeMaat(opdracht) {
  return TEMPLATES.platforms[opdracht.platform].maten[opdracht.format];
}

/*
 * Waar foto en tekstvlak staan. De hoogte van het tekstvlak ligt vast in de
 * toolkit en is uitgedrukt in de breedte, zodat het vlak bij vierkant even
 * hoog blijft en de foto de ruimte inlevert.
 */
function indeling(breed, hoog, opdracht) {
  const str = TEMPLATES.stramien;
  const stijl = TEMPLATES.stijlen[opdracht.stijl];

  const marge = breed * str.marge;
  const kaart = { x: marge, y: marge, b: breed - 2 * marge, h: hoog - 2 * marge };

  const tekst = tekstMeting(breed, kaart.b - 2 * breed * str.paddingZij, opdracht);

  // De toolkithoogte is het plafond; met vlakKrimpt volgt het vlak de tekst,
  // zoals in de posts op het account.
  const plafond = Math.min(stijl.vlakHoogte * breed, kaart.h);
  let vlakH = str.vlakKrimpt
    ? Math.min(plafond, tekstHoogte(breed, stijl, tekst))
    : Math.max(plafond, tekstHoogte(breed, stijl, tekst));
  if (stijl.positie === 'opFoto') vlakH = 0;
  vlakH = klem(vlakH, 0, kaart.h);

  const foto = { x: kaart.x, y: kaart.y, b: kaart.b, h: kaart.h - vlakH };
  const vlak = { x: kaart.x, y: kaart.y, b: kaart.b, h: vlakH };

  if (stijl.positie === 'opFoto') {
    vlak.h = kaart.h;          // alleen om de tekst in te plaatsen
  } else if (stijl.positie === 'onder') {
    vlak.y = kaart.y + foto.h;
  } else {
    foto.y = kaart.y + vlakH;
  }

  // Precies één afgeronde hoek, rechtsonder, op de vorm die daar ligt.
  const onderste = (stijl.positie === 'onder' && vlakH > 0) ? 'vlak' : 'foto';

  return { kaart, foto, vlak, stijl, onderste, tekst };
}

/*
 * Hoeveel hoogte de tekst nodig heeft, inclusief de padding van het vlak.
 *
 * Per regel, niet per veld: staat er één woord op 66 pt in een regel van 40 pt,
 * dan is die regel zo hoog als dat woord. Optellen van regels is dus het enige
 * dat klopt zodra opmaak per stuk kan.
 */
function regelsHoogte(regels, regelhoogte) {
  return regels.reduce((totaal, regel) => totaal + regel.grootte * regelhoogte, 0);
}

function tekstHoogte(breed, stijl, tekst) {
  const rh = TEMPLATES.regelhoogte;
  const kopH = regelsHoogte(tekst.kop.regels, rh.kop);
  const subH = regelsHoogte(tekst.sub.regels, rh.sub);
  if (!kopH && !subH) return 0;
  const tussen = (kopH && subH) ? breed * TEMPLATES.stramien.tussenKopEnSub : 0;
  return breed * (stijl.paddingBoven + stijl.paddingOnder) + kopH + tussen + subH;
}

/*
 * De korpsladder uit de toolkit, van klein naar groot.
 *
 * De vijf korpsgroottes staan als losse sleutels in de huisstijl (pt24 tot en
 * met pt66) en een object heeft geen betrouwbare volgorde, dus sorteren we op
 * de waarde zelf. Zo blijft een keuzelijst kloppen als er ooit een korps bij
 * komt of af gaat.
 */
function korpsladder() {
  return Object.keys(TEMPLATES.korps)
    .map((sleutel) => ({ sleutel, deel: TEMPLATES.korps[sleutel] }))
    .sort((a, b) => a.deel - b.deel);
}

function korpslabel(sleutel) {
  const punten = /^pt(\d+)$/.exec(sleutel);
  return punten ? punten[1] + ' pt' : sleutel;
}

/*
 * De opmaak van één stuk: die van de stijl, met daaroverheen wat op dat stuk is
 * gezet. grootte komt er in pixels uit, want alleen hier is de canvasbreedte
 * bekend.
 *
 * Meten en tekenen halen hun opmaak allebei hiervandaan. Zou het tekenen zijn
 * eigen korpsgrootte samenstellen, dan breekt de tekst af op de ene maat en
 * staat hij er in de andere: regels die over het vlak heen lopen, of een vlak
 * met lucht eronder.
 */
function stukSpec(stijlspec, stuk, breed) {
  const deel = (stuk.korps && TEMPLATES.korps[stuk.korps] !== undefined)
    ? TEMPLATES.korps[stuk.korps]
    : stijlspec.grootte;
  return {
    kleur: stijlspec.kleur,
    gewicht: stuk.gewicht || stijlspec.gewicht,
    schuin: Boolean(stuk.schuin),
    grootte: breed * deel,
  };
}

/* De fontregel voor canvas. RijksSansVF heeft een eigen schuine snede, die
   huisstijlletter.js meelaadt; staat die er niet, dan valt alles terug op Fira
   Sans en maakt de browser zelf een schuine. */
function fontVan(spec) {
  return (spec.schuin ? 'italic ' : '') + spec.gewicht + ' ' +
         spec.grootte.toFixed(1) + 'px ' + TEMPLATES.lettertype;
}

function gewichtlabel(gewicht) {
  return gewicht === VET ? 'vet' : gewicht === NORMAAL ? 'normaal' : String(gewicht);
}

/*
 * Waarin dit veld van zijn stijl afwijkt — als één regel, hoe veel stukken er
 * ook zijn. Per stuk melden zou bij een uitgelichte kop een lijstje van vijf
 * regels opleveren; wat de redacteur moet weten is wélke afwijkingen erin
 * zitten, niet hoe vaak.
 */
function afwijkingsmelding(stukken, stijlspec, naam) {
  const soorten = [];
  const noem = (tekst) => { if (!soorten.includes(tekst)) soorten.push(tekst); };

  stukken.forEach((stuk) => {
    if (stuk.korps && TEMPLATES.korps[stuk.korps] !== stijlspec.grootte) {
      noem(korpslabel(stuk.korps));
    }
    if (stuk.gewicht && stuk.gewicht !== stijlspec.gewicht) noem(gewichtlabel(stuk.gewicht));
    if (stuk.schuin) noem('schuin');
  });

  if (!soorten.length) return null;
  return naam + ' wijkt af van de toolkit: ' + soorten.join(', ') + '.';
}

/*
 * Regels afbreken op de gekozen korpsgrootte. Past het niet binnen het
 * toegestane aantal regels, dan kappen we af en melden we het. Automatisch
 * verkleinen doen we nog steeds niet: de toolkit schrijft de korpsgrootte voor
 * en een grotere letter kiezen is een keuze, geen ongeluk.
 */
function tekstMeting(breed, tekstBreedte, opdracht) {
  const ctx = meetCtx;
  const waarschuwingen = [];

  function veld(stukken, veldnaam, naam) {
    const stijlspec = TEMPLATES.stijlen[opdracht.stijl][veldnaam];
    const specVan = (stuk) => stukSpec(stijlspec, stuk, breed);
    const leeg = !platteTekst(stukken).trim();

    const afwijking = afwijkingsmelding(stukken, stijlspec, naam);
    if (afwijking && !leeg) waarschuwingen.push(afwijking);

    // Zonder tekst is er geen regel, maar wel een hoogte nodig voor het lege
    // veld: de stijlmaat, zodat een leeg veld niets aan het vlak toevoegt.
    if (leeg) return { regels: [], grootte: breed * stijlspec.grootte };

    let regels = breekAfStukken(ctx, stukken, tekstBreedte, specVan);
    if (regels.length > stijlspec.maxRegels) {
      waarschuwingen.push(
        naam + ' is te lang: ' + regels.length + ' regels, maximaal ' +
        stijlspec.maxRegels + ' volgens de toolkit.');
      regels = regels.slice(0, stijlspec.maxRegels);
      regels[regels.length - 1] = kortAf(ctx, regels[regels.length - 1], tekstBreedte);
    }
    return { regels, grootte: regels.length ? regels[0].grootte : breed * stijlspec.grootte };
  }

  const kop = veld(opdracht.kop, 'kop', 'De kop');
  const sub = veld(opdracht.sub, 'sub', 'De subkop');

  // Niet hier opslaan: een stijlkaartje meet ook, en zijn waarschuwingen horen
  // niet in de melding onder het grote canvas terecht te komen. teken() pakt ze
  // op voor de opdracht die er wél toe doet.
  return { kop, sub, tekstBreedte, waarschuwingen };
}

/* De breedte van een rij stukjes, elk met zijn eigen letter. */
function meetStukjes(ctx, stukjes) {
  return stukjes.reduce((totaal, stukje) => {
    ctx.font = fontVan(stukje.spec);
    return totaal + ctx.measureText(stukje.tekst).width;
  }, 0);
}

/* Een regel is een rij stukjes plus de grootte van het grootste stukje erin:
   die bepaalt de regelhoogte en de gedeelde basislijn. */
function maakRegel(stukjes) {
  return {
    stukjes,
    grootte: stukjes.reduce((grootst, stukje) => Math.max(grootst, stukje.spec.grootte), 0),
  };
}

/* Achteraan toevoegen, en gelijk opgemaakte stukjes aan elkaar plakken zodat
   measureText de spatiëring tussen letters niet per stukje afkapt. */
function voegStukjesToe(rij, nieuwe) {
  nieuwe.forEach((stukje) => {
    const vorige = rij[rij.length - 1];
    if (vorige && vorige.spec === stukje.spec) vorige.tekst += stukje.tekst;
    else rij.push({ tekst: stukje.tekst, spec: stukje.spec });
  });
}

/*
 * Regels afbreken over stukken heen.
 *
 * Het afbreken gebeurt op woorden, en een woord kan half vet zijn: "pas" in de
 * ene opmaak en "poort" in de andere. Daarom eerst de platte tekst in woorden
 * knippen, en dat bereik daarna over de stukken leggen — zo blijft een woord
 * één woord, ook als het uit drie stukjes bestaat.
 */
function breekAfStukken(ctx, stukken, maxBreedte, specVan) {
  const plat = platteTekst(stukken);
  const metSpec = (van, tot) => stukjesIn(stukken, van, tot)
    .map((stuk) => ({ tekst: stuk.tekst, spec: specVan(stuk) }));

  const regels = [];
  let rij = [];
  let breedte = 0;
  let spatie = null;

  const sluitAf = () => {
    if (rij.length) regels.push(maakRegel(rij));
    rij = [];
    breedte = 0;
    spatie = null;
  };

  const woorden = /\n|[^\S\n]+|\S+/g;
  let treffer;
  while ((treffer = woorden.exec(plat)) !== null) {
    const stuk = treffer[0];
    if (stuk === '\n') { sluitAf(); continue; }
    if (!stuk.trim()) { spatie = [treffer.index, treffer.index + stuk.length]; continue; }

    const woord = metSpec(treffer.index, treffer.index + stuk.length);
    const woordBreed = meetStukjes(ctx, woord);
    const tussen = (spatie && rij.length) ? metSpec(spatie[0], spatie[1]) : [];
    const tussenBreed = meetStukjes(ctx, tussen);

    // Eén woord dat zelf al te breed is, krijgt toch zijn eigen regel: afkappen
    // doet kortAf() later, met de puntjes erachter.
    if (rij.length && breedte + tussenBreed + woordBreed > maxBreedte) {
      sluitAf();
      voegStukjesToe(rij, woord);
      breedte = woordBreed;
    } else {
      voegStukjesToe(rij, tussen);
      voegStukjesToe(rij, woord);
      breedte += tussenBreed + woordBreed;
    }
    spatie = null;
  }
  sluitAf();

  return regels;
}

/*
 * De laatste regel afkappen met een beletselteken. De puntjes krijgen de
 * opmaak van het stukje waar ze achter komen te staan, zodat ze niet plots in
 * een ander korps of gewicht staan dan het woord ervoor.
 */
function kortAf(ctx, regel, maxBreedte) {
  const stukjes = regel.stukjes.map((stukje) => ({ tekst: stukje.tekst, spec: stukje.spec }));
  const puntjes = { tekst: '…', spec: stukjes[stukjes.length - 1].spec };

  while (stukjes.length && meetStukjes(ctx, stukjes.concat([puntjes])) > maxBreedte) {
    const laatste = stukjes[stukjes.length - 1];
    laatste.tekst = laatste.tekst.slice(0, -1);
    if (!laatste.tekst) stukjes.pop();
    if (stukjes.length) puntjes.spec = stukjes[stukjes.length - 1].spec;
  }

  const laatste = stukjes[stukjes.length - 1];
  if (laatste) laatste.tekst = laatste.tekst.replace(/\s+$/, '');
  return maakRegel(stukjes.filter((stukje) => stukje.tekst).concat([puntjes]));
}

/* Hoe de foto het fotovlak vult, en hoever je hem mag verschuiven voordat er
   een gat zou ontstaan. */
function fotoMeting(vlak, opdracht) {
  const basis = Math.max(vlak.b / opdracht.foto.naturalWidth,
                         vlak.h / opdracht.foto.naturalHeight);
  const schaal = basis * opdracht.zoom;
  const tekenBreed = opdracht.foto.naturalWidth * schaal;
  const tekenHoog = opdracht.foto.naturalHeight * schaal;

  // Buiten [marge, 1 - marge] zou de foto het vlak loslaten. Dit schrijft in de
  // opdracht, niet in state: een stijlkaartje met een ander vlak mag de
  // uitsnede van het grote canvas niet verschuiven.
  opdracht.brandpunt.x = klem(opdracht.brandpunt.x,
                              vlak.b / (2 * tekenBreed), 1 - vlak.b / (2 * tekenBreed));
  opdracht.brandpunt.y = klem(opdracht.brandpunt.y,
                              vlak.h / (2 * tekenHoog), 1 - vlak.h / (2 * tekenHoog));

  return {
    tekenBreed,
    tekenHoog,
    x: vlak.x + vlak.b / 2 - opdracht.brandpunt.x * tekenBreed,
    y: vlak.y + vlak.h / 2 - opdracht.brandpunt.y * tekenHoog,
  };
}

/* ------------------------------------------------------------------ tekenen */

function teken() {
  const [breed, hoog] = huidigeMaat(state);

  // Het canvas staat op de exacte exportmaat en wordt met CSS kleiner getoond.
  // Zo is wat je ziet per definitie wat je downloadt.
  if (el.canvas.width !== breed || el.canvas.height !== hoog) {
    el.canvas.width = breed;
    el.canvas.height = hoog;
  }

  const indel = tekenOp(el.ctx, breed, hoog, state);

  laatsteWaarschuwingen = indel.tekst.waarschuwingen;
  toonWaarschuwingen();
  vraagKaartjes();
}

/*
 * Eén post tekenen op een willekeurige context, op een willekeurige maat.
 *
 * Alles is uitgedrukt in verhoudingen van de breedte, dus dit is net zo goed
 * de export van 1080 px als het kaartje van 216 px: hetzelfde sjabloon, alleen
 * een andere schaal. Daarom kan een stijlkaartje de echte stijl laten zien in
 * plaats van een tekening die erop lijkt.
 */
function tekenOp(ctx, breed, hoog, opdracht) {
  const indel = indeling(breed, hoog, opdracht);

  ctx.clearRect(0, 0, breed, hoog);
  ctx.fillStyle = TEMPLATES.papier;
  ctx.fillRect(0, 0, breed, hoog);

  tekenFoto(ctx, breed, indel, opdracht);
  tekenVlak(ctx, breed, indel);
  tekenTekst(ctx, breed, indel);

  return indel;
}

function tekenFoto(ctx, breed, indel, opdracht) {
  const vlak = indel.foto;
  if (vlak.h <= 0) return;

  ctx.save();
  pad(ctx, vlak, indel.onderste === 'foto' ? straal(vlak) : 0);
  ctx.clip();

  if (opdracht.foto) {
    const m = fotoMeting(vlak, opdracht);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(opdracht.foto, m.x, m.y, m.tekenBreed, m.tekenHoog);
    tekenDecoratie(ctx, vlak, opdracht);
  } else {
    tekenPlaatshouder(ctx, breed, vlak, opdracht);
  }

  ctx.restore();
}

/*
 * Wat er staat voordat je een foto hebt gekozen.
 *
 * Eerst stond hier een grijs vlak met "Nog geen foto gekozen". Daarmee valt de
 * opmaak niet te beoordelen: de kop is wit of diepblauw, de cirkellijnen zijn
 * wit, en die zie je pas als er iets fotoachtigs onder ligt. In de mockups lag
 * daarom een verloop onder elke post, en dat is precies wat er miste.
 *
 * Dit is hetzelfde verloop, van CSS naar canvas overgezet: een blauwe diagonaal
 * met een warme gloed rechtsboven, een donkere hoek linksonder en twee zachte
 * schaduwen. Geen foto, en het mag er ook nooit voor doorgaan — op het grote
 * canvas staat het er daarom met zoveel woorden bij. Op de stijlkaartjes niet:
 * vijf keer dezelfde melding naast elkaar is ruis, en daar gaat het om de vorm.
 *
 * De kleuren staan bewust hier en niet in Supabase. De huisstijl beschrijft hoe
 * een post eruitziet, niet hoe een plaatshouder eruitziet; hetzelfde geldt voor
 * de gegenereerde voorbeeldfoto verderop.
 */
function tekenPlaatshouder(ctx, breed, vlak, opdracht) {
  const diagonaal = ctx.createLinearGradient(
    vlak.x, vlak.y, vlak.x + vlak.b, vlak.y + vlak.h);
  diagonaal.addColorStop(0, '#5aa9d0');
  diagonaal.addColorStop(0.42, '#2f74a0');
  diagonaal.addColorStop(1, '#123c58');
  ctx.fillStyle = diagonaal;
  ctx.fillRect(vlak.x, vlak.y, vlak.b, vlak.h);

  // Donkere hoek linksonder, warme gloed rechtsboven, dan twee zachte plekken.
  ovaal(ctx, vlak, 0.12, 0.92, 0.85, 0.60, [[0, 'rgba(7,41,63,1)'], [0.62, 'rgba(7,41,63,0)']]);
  ovaal(ctx, vlak, 0.72, 0.12, 0.90, 0.60, [[0, 'rgba(255,217,163,1)'], [0.58, 'rgba(255,217,163,0)']]);
  ovaal(ctx, vlak, 0.26, 0.62, 0.38, 0.26, [[0, 'rgba(0,0,0,0.32)'], [0.70, 'rgba(0,0,0,0)']]);
  ovaal(ctx, vlak, 0.62, 0.74, 0.22, 0.30, [[0, 'rgba(0,0,0,0.22)'], [0.70, 'rgba(0,0,0,0)']]);

  tekenDecoratie(ctx, vlak, opdracht);

  if (opdracht.voorbeeldje) return;

  const grootte = breed * 0.03;
  ctx.font = '600 ' + grootte.toFixed(1) + 'px ' + TEMPLATES.lettertype;
  const tekst = 'Nog geen foto gekozen';
  const b = ctx.measureText(tekst).width + grootte * 1.6;
  const h = grootte * 2;
  const x = vlak.x + (vlak.b - b) / 2;
  // Bovenin, niet in het midden: de cirkellijnen en de badges komen uit de
  // linkeronderhoek omhoog, en daar liep de melding dwars doorheen.
  const y = vlak.y + vlak.h * 0.06;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x, y, b, h);
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(tekst, vlak.x + vlak.b / 2, y + h / 2 + grootte * 0.35);
  ctx.textAlign = 'left';
}

/*
 * Een ovaal verloop, zoals radial-gradient(rx ry at cx cy, …) in CSS. Alles in
 * delen van het vlak, zodat het op elk formaat en op elk kaartje hetzelfde valt.
 * Canvas kent alleen ronde verlopen, dus we rekken de ruimte op en tekenen er
 * een cirkel in.
 */
function ovaal(ctx, vlak, cxDeel, cyDeel, rxDeel, ryDeel, stops) {
  const cx = vlak.x + vlak.b * cxDeel;
  const cy = vlak.y + vlak.h * cyDeel;
  const rx = vlak.b * rxDeel;
  const ry = vlak.h * ryDeel;
  const rek = rx / ry;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(rek, 1);

  const verloop = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
  stops.forEach(([positie, kleur]) => verloop.addColorStop(positie, kleur));
  ctx.fillStyle = verloop;

  // Het vlak teruggerekend naar de opgerekte ruimte: precies genoeg vullen.
  ctx.fillRect((vlak.x - cx) / rek, vlak.y - cy, vlak.b / rek, vlak.h);
  ctx.restore();
}

/*
 * Van een cirkel uit de huisstijl naar een plek op het doek.
 *
 * De huisstijl rekent vanaf de linkeronderhoek van de foto, in eenheden van de
 * fotobreedte: de foto is dus altijd precies 1 breed en y loopt negatief naar
 * boven. Daardoor houdt de decoratie bij elk formaat en elke stijl dezelfde
 * verhouding, en is een andere plek een som en geen tweede tekening.
 *
 * Rechts en boven zijn spiegelingen om het midden van de foto. Dat is expres:
 * de grootste ring steekt aan de linkerkant onder de foto uit, en juist dat
 * aflopen hoort bij de stijl. Netjes binnen de foto schuiven zou hem kleiner
 * laten lijken dan hij is. Het midden is wel een verschuiving — daar valt niets
 * te spiegelen — en dan ligt het midden van de groep op het midden van de foto;
 * wat links en rechts uitsteekt, steekt dus aan beide kanten evenveel uit.
 *
 * Alleen de cirkels verhuizen, niet de iconen: die worden hierna om hun eigen
 * middelpunt getekend en staan dus nooit op hun kop of in spiegelbeeld.
 */
function decoratiePlaatsing(foto, positienaam) {
  const d = TEMPLATES.decoratie;
  const positie = DECORATIEPOSITIES[positienaam] || DECORATIEPOSITIES.linksonder;
  const eenheid = foto.b;
  const fotohoogte = foto.h / eenheid;

  let verschuif = 0;
  if (positie.zij === 'midden') {
    const vormen = (d.ringen || []).concat(d.badges || []);
    if (vormen.length) {
      const links = Math.min.apply(null, vormen.map((v) => v.x - v.d / 2));
      const rechts = Math.max.apply(null, vormen.map((v) => v.x + v.d / 2));
      verschuif = 0.5 - (links + rechts) / 2;
    }
  }

  return (vorm) => {
    const x = positie.zij === 'rechts' ? 1 - vorm.x : vorm.x + verschuif;
    const y = positie.hoogte === 'boven' ? -fotohoogte - vorm.y : vorm.y;
    return {
      cx: foto.x + x * eenheid,
      cy: foto.y + foto.h + y * eenheid,
      straal: vorm.d / 2 * eenheid,
    };
  };
}

/*
 * De witte ringen met icoonbadges, op de gekozen plek. Het staat binnen de clip
 * van de foto, dus het loopt nooit over het tekstvlak heen.
 */
function tekenDecoratie(ctx, foto, opdracht) {
  const d = TEMPLATES.decoratie;
  if (!d.aan || !opdracht.decoratie) return;

  const plaats = decoratiePlaatsing(foto, opdracht.decoratiepositie);
  const cirkel = (plek) => {
    ctx.beginPath();
    ctx.arc(plek.cx, plek.cy, plek.straal, 0, Math.PI * 2);
  };

  ctx.save();

  ctx.strokeStyle = d.lijnkleur;
  ctx.lineWidth = foto.b * d.lijndikte;
  d.ringen.forEach((ring) => {
    cirkel(plaats(ring));
    ctx.stroke();
  });

  d.badges.forEach((badge, i) => {
    const plek = plaats(badge);

    cirkel(plek);
    ctx.fillStyle = d.badgeKleur;
    ctx.fill();

    const icoon = icoonCache[opdracht.iconen[i]];
    if (icoon && icoon.complete && icoon.naturalWidth) {
      const maat = plek.straal * 2 * d.icoonDeel;
      ctx.drawImage(icoon, plek.cx - maat / 2, plek.cy - maat / 2, maat, maat);
    }
  });

  ctx.restore();
}

function tekenVlak(ctx, breed, indel) {
  const { vlak, stijl } = indel;
  if (stijl.positie === 'opFoto' || vlak.h <= 0) return;
  ctx.save();
  pad(ctx, vlak, indel.onderste === 'vlak' ? straal(vlak) : 0);
  ctx.fillStyle = stijl.vlakKleur;
  ctx.fill();
  ctx.restore();
}

function tekenTekst(ctx, breed, indel) {
  const { vlak, stijl, tekst } = indel;
  const str = TEMPLATES.stramien;

  const x = vlak.x + breed * str.paddingZij;
  let y = vlak.y + breed * stijl.paddingBoven;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  y = tekenRegels(ctx, tekst.kop, TEMPLATES.regelhoogte.kop, x, y);
  if (tekst.sub.regels.length) {
    if (tekst.kop.regels.length) y += breed * str.tussenKopEnSub;
    tekenRegels(ctx, tekst.sub, TEMPLATES.regelhoogte.sub, x, y);
  }
}

/*
 * Stukje voor stukje, op de plek waar het meten het heeft neergezet.
 *
 * Alle stukjes van een regel staan op dezelfde basislijn — die van het grootste
 * stukje. Zouden ze elk hun eigen basislijn krijgen, dan zou een groot woord in
 * een kleine regel omhoog of omlaag springen in plaats van in de regel te staan.
 */
function tekenRegels(ctx, veld, regelhoogte, x, y) {
  if (!veld.regels.length) return y;
  veld.regels.forEach((regel) => {
    const basislijn = y + regel.grootte * 0.82;
    let plek = x;
    regel.stukjes.forEach((stukje) => {
      ctx.fillStyle = stukje.spec.kleur;
      ctx.font = fontVan(stukje.spec);
      ctx.fillText(stukje.tekst, plek, basislijn);
      plek += ctx.measureText(stukje.tekst).width;
    });
    y += regel.grootte * regelhoogte;
  });
  return y;
}

/* round1Rect uit de toolkit: de straal is 9,492% van de kortste zijde. */
function straal(vlak) {
  return TEMPLATES.stramien.hoekFactor * Math.min(vlak.b, vlak.h);
}

/* Rechthoek met precies één afgeronde hoek: rechtsonder. */
function pad(ctx, v, r) {
  const ro = Math.min(r, Math.min(v.b, v.h));
  ctx.beginPath();
  ctx.moveTo(v.x, v.y);
  ctx.lineTo(v.x + v.b, v.y);
  ctx.lineTo(v.x + v.b, v.y + v.h - ro);
  if (ro > 0) {
    ctx.quadraticCurveTo(v.x + v.b, v.y + v.h, v.x + v.b - ro, v.y + v.h);
  }
  ctx.lineTo(v.x, v.y + v.h);
  ctx.closePath();
}

/* -------------------------------------------------------------- exporteren */

function download() {
  if (!state.foto) {
    toonMelding('Kies eerst een foto.', 'fout');
    return;
  }

  const [breed, hoog] = huidigeMaat(state);
  el.canvas.toBlob((blob) => {
    if (!blob) {
      toonMelding('De download is niet gelukt. Probeer het opnieuw.', 'fout');
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'post-' + state.platform + '-' + breed + 'x' + hoog + '.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toonMelding('Gedownload: ' + link.download, 'goed');
  }, 'image/png');
}

/* ---------------------------------------------------------------------- UI */

function werkbijUI() {
  /*
   * Een formaatkaart draagt twee keuzes tegelijk (platform én formaat), dus
   * "is deze knop actief" is: kloppen ál zijn keuzes met de huidige stand.
   * Per sleutel los kijken zou de kaart voor Instagram-vierkant aanzetten
   * zodra je Facebook-vierkant kiest.
   */
  document.querySelectorAll('[data-platform], [data-format], [data-stijl]')
    .forEach((knop) => {
      const sleutels = ['platform', 'format', 'stijl']
        .filter((sleutel) => sleutel in knop.dataset);
      const actief = sleutels.every((sleutel) => knop.dataset[sleutel] === state[sleutel]);
      knop.classList.toggle('actief', actief);
      knop.setAttribute('aria-pressed', String(actief));
    });

  const [breed, hoog] = huidigeMaat(state);
  const formaat = TEMPLATES.formats[state.format];
  el.maatlabel.textContent = breed + ' × ' + hoog + ' px · ' + formaat.verhoudingLabel;
  el.formaatnoot.hidden = formaat.uitToolkit;

  const stijl = TEMPLATES.stijlen[state.stijl];
  el.stijlbron.textContent = 'Toolkit-pagina: ' + stijl.bron;
  el.kopregels.textContent = 'maximaal ' + stijl.kop.maxRegels + ' regels';
  el.subregels.textContent = 'maximaal ' + stijl.sub.maxRegels +
    (stijl.sub.maxRegels === 1 ? ' regel' : ' regels');

  el.fotonaam.textContent = state.fotonaam || '';
  el.dropzone.classList.toggle('gevuld', Boolean(state.foto));
  el.zoomrij.hidden = !state.foto;
  el.downloadknop.disabled = !state.foto;

  /*
   * Ook de werkbalken, want de maat die zij tonen hangt van de stijl af: een
   * veld dat de stijl volgt heeft na een stijlwissel een andere maat, zonder
   * dat er iets aan de tekst veranderd is. En zonder deze regel staat het
   * maatvakje bij het opstarten leeg tot je ergens klikt.
   */
  werkbijWerkbalken();
}

/* Waarschuwingen over te lange tekst mogen een gekozen foto of een geslaagde
   download niet overschrijven, maar moeten wel meteen zichtbaar zijn. */
function toonWaarschuwingen() {
  if (laatsteWaarschuwingen.length) {
    toonMelding(laatsteWaarschuwingen.join(' '), 'let');
  } else if (el.melding.classList.contains('let')) {
    toonMelding('', '');
  }
}

function toonMelding(tekst, soort) {
  el.melding.textContent = tekst;
  el.melding.className = 'melding' + (soort ? ' ' + soort : '');
  el.melding.hidden = !tekst;
}

function klem(waarde, laag, hoog) {
  if (laag > hoog) return (laag + hoog) / 2;   // foto kleiner dan het vlak
  return Math.min(hoog, Math.max(laag, waarde));
}

/* -------------------------------------------------------------- concepten */

/*
 * Wat er in een bewaard concept gaat — en vooral: wat niet.
 *
 * De foto zit hier bewust niet in. Die zou als base64 in de database belanden
 * en daarmee de belofte breken dat beeld de computer van de redacteur niet
 * verlaat. Een concept is dus een recept, geen plaatje: je opent het en sleept
 * je foto er opnieuw in.
 */
function leesConcept() {
  return {
    platform: state.platform,
    format: state.format,
    stijl: state.stijl,
    kop: kopieerStukken(state.kop),
    sub: kopieerStukken(state.sub),
    decoratie: state.decoratie,
    decoratiepositie: state.decoratiepositie,
    iconen: state.iconen.slice(),
    zoom: state.zoom,
    brandpunt: { x: state.brandpunt.x, y: state.brandpunt.y },
  };
}

/*
 * Tekst uit een bewaard concept.
 *
 * Een concept van voor de werkbalk bewaarde een gewone string. Die wordt één
 * stuk zonder opmaak — precies hoe hij bewaard is. Verder wordt elk stuk
 * getoetst: de inhoud komt uit de database en hoeft niet te kloppen met de
 * huisstijl zoals die er nu uitziet, dus een korps dat niet meer bestaat valt
 * terug op de stijl in plaats van een lege regel op te leveren.
 */
function stukkenUitConcept(bewaard) {
  if (typeof bewaard === 'string') return stukkenUit(bewaard);
  if (!Array.isArray(bewaard)) return [];
  return normaliseer(bewaard
    .filter((stuk) => stuk && typeof stuk.tekst === 'string')
    .map((stuk) => ({
      tekst: stuk.tekst,
      korps: TEMPLATES.korps[stuk.korps] !== undefined ? stuk.korps : null,
      gewicht: (stuk.gewicht === NORMAAL || stuk.gewicht === VET) ? stuk.gewicht : null,
      schuin: Boolean(stuk.schuin),
    })));
}

/*
 * Een concept terugzetten. Alles wordt getoetst voordat het in state landt:
 * de inhoud komt uit de database en hoeft niet te kloppen met de huisstijl
 * zoals die er nu uitziet. Is een stijl inmiddels hernoemd of een icoon
 * verdwenen, dan houden we gewoon de huidige waarde aan.
 */
function pasConceptToe(inhoud) {
  if (!inhoud || typeof inhoud !== 'object') return;

  if (TEMPLATES.platforms[inhoud.platform]) state.platform = inhoud.platform;
  if (TEMPLATES.formats[inhoud.format]) state.format = inhoud.format;
  if (TEMPLATES.stijlen[inhoud.stijl]) state.stijl = inhoud.stijl;

  state.kop = stukkenUitConcept(inhoud.kop);
  state.sub = stukkenUitConcept(inhoud.sub);
  state.decoratie = Boolean(inhoud.decoratie);

  // Een concept van voor deze keuze kent de plek niet; die valt dan terug op
  // linksonder, en dat is precies hoe hij bewaard is.
  state.decoratiepositie = DECORATIEPOSITIES[inhoud.decoratiepositie]
    ? inhoud.decoratiepositie
    : 'linksonder';

  if (Array.isArray(inhoud.iconen)) {
    state.iconen = state.iconen.map((huidig, i) =>
      (typeof inhoud.iconen[i] === 'string' && TEMPLATES.iconen[inhoud.iconen[i]])
        ? inhoud.iconen[i]
        : huidig);
  }

  const zoom = Number(inhoud.zoom);
  state.zoom = Number.isFinite(zoom) ? klem(zoom, 1, 3) : 1;

  const bp = inhoud.brandpunt || {};
  state.brandpunt = {
    x: Number.isFinite(Number(bp.x)) ? klem(Number(bp.x), 0, 1) : 0.5,
    y: Number.isFinite(Number(bp.y)) ? klem(Number(bp.y), 0, 1) : 0.5,
  };

  toonTekstvelden();
  el.zoom.value = String(state.zoom);
  el.decoratieAan.checked = state.decoratie;
  el.icoonrij.hidden = !state.decoratie;
  el.decoratiepositie.value = state.decoratiepositie;
  el.icoon0.value = state.iconen[0];
  el.icoon1.value = state.iconen[1];

  werkbijUI();
  teken();
}
