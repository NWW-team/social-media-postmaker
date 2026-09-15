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
  kop: '',
  sub: '',
  decoratie: true,
  iconen: ['Wereld (toolkit)', 'Gesprek (toolkit)'],
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
    'decoratieAan', 'icoon0', 'icoon1', 'icoonrij', 'miniatuur',
  ].forEach((id) => { el[id] = document.getElementById(id); });

  el.ctx = el.canvas.getContext('2d');

  // De standaardiconen staan in state hardgecodeerd; komt de set uit Supabase
  // ooit anders terug, dan pakken we gewoon de eerste twee die er wel zijn.
  const beschikbaar = Object.keys(TEMPLATES.iconen);
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

  stijlkaartjes.forEach((kaartje) => {
    tekenKlein(kaartje.canvas, KAARTBREEDTE, Math.round(KAARTBREEDTE * verhouding),
               opdrachtMet({ stijl: kaartje.stijl, voorbeeldje: true }));
  });

  if (el.miniatuur) {
    tekenKlein(el.miniatuur, MINIATUURBREEDTE,
               Math.round(MINIATUURBREEDTE * verhouding), opdrachtMet({ voorbeeldje: true }));
  }
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

function bouwIcoonkeuze() {
  [el.icoon0, el.icoon1].forEach((keuzelijst, i) => {
    Object.keys(TEMPLATES.iconen).forEach((naam) => {
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

  ['kop', 'sub'].forEach((sleutel) => {
    el[sleutel].addEventListener('input', () => {
      state[sleutel] = el[sleutel].value;
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

/* Hoeveel hoogte de tekst nodig heeft, inclusief de padding van het vlak. */
function tekstHoogte(breed, stijl, tekst) {
  const rh = TEMPLATES.regelhoogte;
  const kopH = tekst.kop.regels.length * tekst.kop.grootte * rh.kop;
  const subH = tekst.sub.regels.length * tekst.sub.grootte * rh.sub;
  if (!kopH && !subH) return 0;
  const tussen = (kopH && subH) ? breed * TEMPLATES.stramien.tussenKopEnSub : 0;
  return breed * (stijl.paddingBoven + stijl.paddingOnder) + kopH + tussen + subH;
}

/*
 * Regels afbreken op de vaste korpsgrootte uit de toolkit. Past het niet
 * binnen het toegestane aantal regels, dan kappen we af en melden we het.
 * Verkleinen doen we niet: de toolkit schrijft de korpsgrootte voor.
 */
function tekstMeting(breed, tekstBreedte, opdracht) {
  const ctx = meetCtx;
  const stijl = TEMPLATES.stijlen[opdracht.stijl];
  const waarschuwingen = [];

  function veld(tekst, spec, naam) {
    const grootte = breed * spec.grootte;
    if (!tekst.trim()) return { regels: [], grootte };
    ctx.font = spec.gewicht + ' ' + grootte.toFixed(1) + 'px ' + TEMPLATES.lettertype;
    let regels = breekAf(ctx, tekst.trim(), tekstBreedte);
    if (regels.length > spec.maxRegels) {
      waarschuwingen.push(
        naam + ' is te lang: ' + regels.length + ' regels, maximaal ' +
        spec.maxRegels + ' volgens de toolkit.');
      regels = regels.slice(0, spec.maxRegels);
      regels[regels.length - 1] = kortAf(ctx, regels[regels.length - 1], tekstBreedte);
    }
    return { regels, grootte };
  }

  const kop = veld(opdracht.kop, stijl.kop, 'De kop');
  const sub = veld(opdracht.sub, stijl.sub, 'De subkop');

  // Niet hier opslaan: een stijlkaartje meet ook, en zijn waarschuwingen horen
  // niet in de melding onder het grote canvas terecht te komen. teken() pakt ze
  // op voor de opdracht die er wél toe doet.
  return { kop, sub, tekstBreedte, waarschuwingen };
}

function kortAf(ctx, regel, maxBreedte) {
  let tekst = regel;
  while (tekst.length > 1 && ctx.measureText(tekst + '…').width > maxBreedte) {
    tekst = tekst.slice(0, -1);
  }
  return tekst.replace(/\s+$/, '') + '…';
}

function breekAf(ctx, tekst, maxBreedte) {
  const regels = [];
  tekst.split('\n').forEach((alinea) => {
    let regel = '';
    alinea.split(/\s+/).filter(Boolean).forEach((woord) => {
      const poging = regel ? regel + ' ' + woord : woord;
      if (ctx.measureText(poging).width <= maxBreedte || !regel) {
        regel = poging;
      } else {
        regels.push(regel);
        regel = woord;
      }
    });
    if (regel) regels.push(regel);
  });
  return regels;
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
 * De witte ringen met icoonbadges. Alles is gerekend vanaf de linkeronderhoek
 * van de foto, in eenheden van de fotobreedte, zodat de decoratie bij elk
 * formaat en elke stijl dezelfde verhouding houdt. Het staat binnen de clip van
 * de foto, dus het loopt nooit over het tekstvlak heen.
 */
function tekenDecoratie(ctx, foto, opdracht) {
  const d = TEMPLATES.decoratie;
  if (!d.aan || !opdracht.decoratie) return;

  const eenheid = foto.b;
  const ox = foto.x;
  const oy = foto.y + foto.h;
  const cirkel = (cx, cy, straal) => {
    ctx.beginPath();
    ctx.arc(cx, cy, straal, 0, Math.PI * 2);
  };

  ctx.save();

  ctx.strokeStyle = d.lijnkleur;
  ctx.lineWidth = eenheid * d.lijndikte;
  d.ringen.forEach((ring) => {
    cirkel(ox + ring.x * eenheid, oy + ring.y * eenheid, ring.d / 2 * eenheid);
    ctx.stroke();
  });

  d.badges.forEach((badge, i) => {
    const cx = ox + badge.x * eenheid;
    const cy = oy + badge.y * eenheid;
    const straal = badge.d / 2 * eenheid;

    cirkel(cx, cy, straal);
    ctx.fillStyle = d.badgeKleur;
    ctx.fill();

    const icoon = icoonCache[opdracht.iconen[i]];
    if (icoon && icoon.complete && icoon.naturalWidth) {
      const maat = straal * 2 * d.icoonDeel;
      ctx.drawImage(icoon, cx - maat / 2, cy - maat / 2, maat, maat);
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

  y = tekenRegels(ctx, tekst.kop, stijl.kop, TEMPLATES.regelhoogte.kop, x, y);
  if (tekst.sub.regels.length) {
    if (tekst.kop.regels.length) y += breed * str.tussenKopEnSub;
    tekenRegels(ctx, tekst.sub, stijl.sub, TEMPLATES.regelhoogte.sub, x, y);
  }
}

function tekenRegels(ctx, veld, spec, regelhoogte, x, y) {
  if (!veld.regels.length) return y;
  ctx.fillStyle = spec.kleur;
  ctx.font = spec.gewicht + ' ' + veld.grootte.toFixed(1) + 'px ' + TEMPLATES.lettertype;
  veld.regels.forEach((regel) => {
    ctx.fillText(regel, x, y + veld.grootte * 0.82);
    y += veld.grootte * regelhoogte;
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
    kop: state.kop,
    sub: state.sub,
    decoratie: state.decoratie,
    iconen: state.iconen.slice(),
    zoom: state.zoom,
    brandpunt: { x: state.brandpunt.x, y: state.brandpunt.y },
  };
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

  state.kop = typeof inhoud.kop === 'string' ? inhoud.kop : '';
  state.sub = typeof inhoud.sub === 'string' ? inhoud.sub : '';
  state.decoratie = Boolean(inhoud.decoratie);

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

  el.kop.value = state.kop;
  el.sub.value = state.sub;
  el.zoom.value = String(state.zoom);
  el.decoratieAan.checked = state.decoratie;
  el.icoonrij.hidden = !state.decoratie;
  el.icoon0.value = state.iconen[0];
  el.icoon1.value = state.iconen[1];

  werkbijUI();
  teken();
}
