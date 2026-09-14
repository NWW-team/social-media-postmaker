/*
 * app.js — foto inpassen, huisstijl eroverheen, PNG eruit.
 *
 * Alles gebeurt in de browser van de redacteur. De foto wordt nooit verstuurd,
 * niet opgeslagen en niet gelogd: er is geen server om hem heen te sturen.
 *
 * De opmaak zelf staat in templates.js, niet hier. Dit bestand tekent alleen
 * wat daar beschreven staat.
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
let laatsteWaarschuwingen = [];

/* ---------------------------------------------------------------- opstarten */

document.addEventListener('DOMContentLoaded', () => {
  [
    'canvas', 'dropzone', 'bestandsknop', 'bestandsinvoer', 'voorbeeldknop',
    'kop', 'sub', 'kopregels', 'subregels', 'zoom', 'zoomrij', 'resetknop',
    'downloadknop', 'maatlabel', 'stijlbron', 'melding', 'fotonaam', 'formaatnoot',
    'decoratieAan', 'icoon0', 'icoon1', 'icoonrij',
  ].forEach((id) => { el[id] = document.getElementById(id); });

  el.ctx = el.canvas.getContext('2d');

  laadIconen();
  bouwStijlknoppen();
  bouwIcoonkeuze();
  koppelKnoppen();
  koppelFotoInvoer();
  koppelSlepen();
  werkbijUI();
  teken();
});

/* De stijlknoppen komen uit templates.js, zodat een stijl toevoegen daar
   genoeg is. */
function bouwStijlknoppen() {
  const rij = document.getElementById('stijlknoppen');
  Object.keys(TEMPLATES.stijlen).forEach((naam) => {
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'keuze breed';
    knop.dataset.stijl = naam;
    knop.textContent = TEMPLATES.stijlen[naam].label;
    knop.setAttribute('aria-pressed', 'false');
    rij.appendChild(knop);
  });
}

/*
 * Iconen staan als SVG-tekst in templates.js en worden hier omgezet naar een
 * data-URI. Geen los bestand dus: dat houdt de pagina werkend als je index.html
 * lokaal dubbelklikt, waar de browser het laden van losse bestanden in een
 * canvas blokkeert.
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
  ['platform', 'format', 'stijl'].forEach((sleutel) => {
    document.querySelectorAll('[data-' + sleutel + ']').forEach((knop) => {
      knop.addEventListener('click', () => {
        state[sleutel] = knop.dataset[sleutel];
        werkbijUI();
        teken();
      });
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
  const [breed, hoog] = huidigeMaat();
  const m = fotoMeting(indeling(breed, hoog).foto);
  state.brandpunt.x -= dx / m.tekenBreed;
  state.brandpunt.y -= dy / m.tekenHoog;
  teken();
}

/* ----------------------------------------------------------------- indeling */

function huidigeMaat() {
  return TEMPLATES.platforms[state.platform].maten[state.format];
}

/*
 * Waar foto en tekstvlak staan. De hoogte van het tekstvlak ligt vast in de
 * toolkit en is uitgedrukt in de breedte, zodat het vlak bij vierkant even
 * hoog blijft en de foto de ruimte inlevert.
 */
function indeling(breed, hoog) {
  const str = TEMPLATES.stramien;
  const stijl = TEMPLATES.stijlen[state.stijl];

  const marge = breed * str.marge;
  const kaart = { x: marge, y: marge, b: breed - 2 * marge, h: hoog - 2 * marge };

  const tekst = tekstMeting(breed, kaart.b - 2 * breed * str.paddingZij);

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
function tekstMeting(breed, tekstBreedte) {
  const ctx = el.ctx;
  const stijl = TEMPLATES.stijlen[state.stijl];
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

  const kop = veld(state.kop, stijl.kop, 'De kop');
  const sub = veld(state.sub, stijl.sub, 'De subkop');

  laatsteWaarschuwingen = waarschuwingen;
  return { kop, sub, tekstBreedte };
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
function fotoMeting(vlak) {
  const basis = Math.max(vlak.b / state.foto.naturalWidth,
                         vlak.h / state.foto.naturalHeight);
  const schaal = basis * state.zoom;
  const tekenBreed = state.foto.naturalWidth * schaal;
  const tekenHoog = state.foto.naturalHeight * schaal;

  // Buiten [marge, 1 - marge] zou de foto het vlak loslaten.
  state.brandpunt.x = klem(state.brandpunt.x,
                           vlak.b / (2 * tekenBreed), 1 - vlak.b / (2 * tekenBreed));
  state.brandpunt.y = klem(state.brandpunt.y,
                           vlak.h / (2 * tekenHoog), 1 - vlak.h / (2 * tekenHoog));

  return {
    tekenBreed,
    tekenHoog,
    x: vlak.x + vlak.b / 2 - state.brandpunt.x * tekenBreed,
    y: vlak.y + vlak.h / 2 - state.brandpunt.y * tekenHoog,
  };
}

/* ------------------------------------------------------------------ tekenen */

function teken() {
  const [breed, hoog] = huidigeMaat();

  // Het canvas staat op de exacte exportmaat en wordt met CSS kleiner getoond.
  // Zo is wat je ziet per definitie wat je downloadt.
  if (el.canvas.width !== breed || el.canvas.height !== hoog) {
    el.canvas.width = breed;
    el.canvas.height = hoog;
  }

  const ctx = el.ctx;
  const indel = indeling(breed, hoog);

  ctx.clearRect(0, 0, breed, hoog);
  ctx.fillStyle = TEMPLATES.papier;
  ctx.fillRect(0, 0, breed, hoog);

  tekenFoto(ctx, breed, indel);
  tekenVlak(ctx, breed, indel);
  tekenTekst(ctx, breed, indel);

  toonWaarschuwingen();
}

function tekenFoto(ctx, breed, indel) {
  const vlak = indel.foto;
  if (vlak.h <= 0) return;

  ctx.save();
  pad(ctx, vlak, indel.onderste === 'foto' ? straal(vlak) : 0);
  ctx.clip();

  if (state.foto) {
    const m = fotoMeting(vlak);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(state.foto, m.x, m.y, m.tekenBreed, m.tekenHoog);
    tekenDecoratie(ctx, vlak);
  } else {
    ctx.fillStyle = '#e6eef4';
    ctx.fillRect(vlak.x, vlak.y, vlak.b, vlak.h);
    ctx.fillStyle = '#7f96a8';
    ctx.textAlign = 'center';
    ctx.font = '600 ' + (breed * 0.03).toFixed(1) + 'px ' + TEMPLATES.lettertype;
    ctx.fillText('Nog geen foto gekozen', vlak.x + vlak.b / 2, vlak.y + vlak.h / 2);
    ctx.textAlign = 'left';
  }

  ctx.restore();
}

/*
 * De witte ringen met icoonbadges. Alles is gerekend vanaf de linkeronderhoek
 * van de foto, in eenheden van de fotobreedte, zodat de decoratie bij elk
 * formaat en elke stijl dezelfde verhouding houdt. Het staat binnen de clip van
 * de foto, dus het loopt nooit over het tekstvlak heen.
 */
function tekenDecoratie(ctx, foto) {
  const d = TEMPLATES.decoratie;
  if (!d.aan || !state.decoratie) return;

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

    const icoon = icoonCache[state.iconen[i]];
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

  const [breed, hoog] = huidigeMaat();
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
  ['platform', 'format', 'stijl'].forEach((sleutel) => {
    document.querySelectorAll('[data-' + sleutel + ']').forEach((knop) => {
      const actief = knop.dataset[sleutel] === state[sleutel];
      knop.classList.toggle('actief', actief);
      knop.setAttribute('aria-pressed', String(actief));
    });
  });

  const [breed, hoog] = huidigeMaat();
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
