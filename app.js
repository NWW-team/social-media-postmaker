/*
 * app.js — foto inpassen, huisstijl eroverheen, PNG eruit.
 *
 * Alles gebeurt in de browser van de redacteur. De foto wordt nooit verstuurd,
 * niet opgeslagen en niet gelogd: er is geen server om hem heen te sturen.
 *
 * De opmaak zelf staat in templates.js, niet hier. Dit bestand tekent alleen
 * wat daar beschreven staat.
 */

'use strict';

const state = {
  platform: 'instagram',
  format: 'staand',
  stijl: 'blauwOnder',
  foto: null,                     // HTMLImageElement
  fotonaam: '',
  zoom: 1,                        // 1 = precies vullend
  brandpunt: { x: 0.5, y: 0.5 },  // welk punt van de foto in het midden staat
  kop: '',
  sub: '',
};

const el = {};

/* ---------------------------------------------------------------- opstarten */

document.addEventListener('DOMContentLoaded', () => {
  [
    'canvas', 'dropzone', 'bestandsknop', 'bestandsinvoer', 'voorbeeldknop',
    'kop', 'sub', 'teller', 'zoom', 'zoomrij', 'resetknop', 'downloadknop',
    'maatlabel', 'melding', 'fotonaam',
  ].forEach((id) => { el[id] = document.getElementById(id); });

  el.ctx = el.canvas.getContext('2d');

  koppelKnoppen();
  koppelFotoInvoer();
  koppelSlepen();
  werkbijUI();
  teken();
});

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

  [['kop', 'kop'], ['sub', 'sub']].forEach(([id, sleutel]) => {
    el[id].addEventListener('input', () => {
      state[sleutel] = el[id].value;
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
  toonMelding('', '');
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
  const vlakken = indeling(breed, hoog);
  const m = fotoMeting(vlakken.foto);
  state.brandpunt.x -= dx / m.tekenBreed;
  state.brandpunt.y -= dy / m.tekenHoog;
  teken();
}

/* ----------------------------------------------------------------- indeling */

function huidigeMaat() {
  return TEMPLATES.platforms[state.platform].maten[state.format];
}

/*
 * Waar foto en tekstvlak komen te staan. Het tekstvlak groeit mee met de
 * hoeveelheid tekst, zoals in de bestaande posts: twee regels geeft een lager
 * vlak dan vier. De foto krijgt wat overblijft.
 */
function indeling(breed, hoog) {
  const str = TEMPLATES.stramien;
  const stijl = TEMPLATES.stijlen[state.stijl];

  const marge = breed * str.marge;
  const binnen = {
    x: marge,
    y: marge,
    b: breed - 2 * marge,
    h: hoog - 2 * marge,
  };

  const tekstBreedte = binnen.b - 2 * breed * str.paddingZij;
  const tekst = tekstMeting(breed, binnen.h * str.maxTekstvlak, tekstBreedte);

  const vlakH = tekst.hoogte;
  const fotoH = binnen.h - vlakH;

  const foto = { x: binnen.x, y: binnen.y, b: binnen.b, h: fotoH };
  const vlak = { x: binnen.x, y: binnen.y, b: binnen.b, h: vlakH };

  if (stijl.positie === 'onder') {
    vlak.y = binnen.y + fotoH;
  } else {
    foto.y = binnen.y + vlakH;
  }

  return { foto, vlak, tekst, stijl, tekstBreedte };
}

/*
 * Hoe groot de tekst wordt en hoeveel regels dat oplevert. Past het niet binnen
 * de ruimte die het tekstvlak mag innemen, dan verkleinen we stapsgewijs; helpt
 * dat niet genoeg, dan korten we regels af. Liever een afgekapte titel dan een
 * post waarin de tekst over de foto heen loopt.
 */
function tekstMeting(breed, maxHoogte, tekstBreedte) {
  const ctx = el.ctx;
  const typo = TEMPLATES.typografie;

  const kopTekst = state.kop.trim();
  const subTekst = state.sub.trim();
  if (!kopTekst && !subTekst) {
    return { hoogte: 0, kopRegels: [], subRegels: [], kopSize: 0, subSize: 0 };
  }

  let meting;
  for (let schaal = 1; ; schaal -= 0.02) {
    const kopSize = breed * typo.kop.grootte * schaal;
    const subSize = breed * typo.sub.grootte * schaal;

    ctx.font = fontRegel(typo.kop.gewicht, kopSize);
    const kopRegels = kopTekst ? breekAf(ctx, kopTekst, tekstBreedte) : [];
    ctx.font = fontRegel(typo.sub.gewicht, subSize);
    const subRegels = subTekst ? breekAf(ctx, subTekst, tekstBreedte) : [];

    meting = { kopSize, subSize, kopRegels, subRegels };
    meting.hoogte = blokHoogte(breed, meting);

    if (meting.hoogte <= maxHoogte || schaal <= typo.minSchaal) break;
  }

  // Nog te hoog: regels weglaten, laatste met een beletselteken.
  while (meting.hoogte > maxHoogte &&
         meting.kopRegels.length + meting.subRegels.length > 1) {
    if (meting.subRegels.length > 0) {
      meting.subRegels.pop();
      if (meting.subRegels.length) {
        ctx.font = fontRegel(TEMPLATES.typografie.sub.gewicht, meting.subSize);
        meting.subRegels[meting.subRegels.length - 1] =
          kortAf(ctx, meting.subRegels[meting.subRegels.length - 1], tekstBreedte);
      }
    } else {
      meting.kopRegels.pop();
      ctx.font = fontRegel(TEMPLATES.typografie.kop.gewicht, meting.kopSize);
      meting.kopRegels[meting.kopRegels.length - 1] =
        kortAf(ctx, meting.kopRegels[meting.kopRegels.length - 1], tekstBreedte);
    }
    meting.hoogte = blokHoogte(breed, meting);
  }

  return meting;
}

function blokHoogte(breed, m) {
  const str = TEMPLATES.stramien;
  const typo = TEMPLATES.typografie;
  let h = 0;
  if (m.kopRegels.length) {
    h += m.kopRegels.length * m.kopSize * typo.kop.regelhoogte;
  }
  if (m.subRegels.length) {
    if (m.kopRegels.length) h += breed * str.tussenKopEnSub;
    h += m.subRegels.length * m.subSize * typo.sub.regelhoogte;
  }
  if (h > 0) h += breed * (str.paddingBoven + str.paddingOnder);
  return h;
}

function fontRegel(gewicht, grootte) {
  return gewicht + ' ' + grootte.toFixed(1) + 'px ' + TEMPLATES.lettertype;
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
  const margeX = vlak.b / (2 * tekenBreed);
  const margeY = vlak.h / (2 * tekenHoog);
  state.brandpunt.x = klem(state.brandpunt.x, margeX, 1 - margeX);
  state.brandpunt.y = klem(state.brandpunt.y, margeY, 1 - margeY);

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
  const vlakken = indeling(breed, hoog);
  const stijl = vlakken.stijl;

  ctx.clearRect(0, 0, breed, hoog);
  ctx.fillStyle = TEMPLATES.papier;
  ctx.fillRect(0, 0, breed, hoog);

  tekenFoto(ctx, breed, vlakken.foto, stijl);
  tekenTekstvlak(ctx, breed, vlakken.vlak, stijl);
  tekenTekst(ctx, breed, vlakken);
}

function tekenFoto(ctx, breed, vlak, stijl) {
  if (vlak.h <= 0) return;

  ctx.save();
  pad(ctx, vlak, hoeken(breed, stijl.fotoHoeken));
  ctx.clip();

  if (state.foto) {
    const m = fotoMeting(vlak);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(state.foto, m.x, m.y, m.tekenBreed, m.tekenHoog);
    tekenDecoratie(ctx, breed, vlak, stijl);
  } else {
    ctx.fillStyle = '#e9edf2';
    ctx.fillRect(vlak.x, vlak.y, vlak.b, vlak.h);
    ctx.fillStyle = '#9aa7b4';
    ctx.textAlign = 'center';
    ctx.font = fontRegel(600, breed * 0.033);
    ctx.fillText('Nog geen foto gekozen',
                 vlak.x + vlak.b / 2, vlak.y + vlak.h / 2);
    ctx.textAlign = 'left';
  }

  ctx.restore();
}

/* De dunne witte cirkellijnen die in de bestaande posts over de foto lopen. */
function tekenDecoratie(ctx, breed, vlak, stijl) {
  const deco = TEMPLATES.decoratie;
  if (!deco.aan) return;

  ctx.save();
  ctx.strokeStyle = deco.kleur;
  ctx.lineWidth = breed * deco.lijndikte;
  deco.cirkels.forEach((cirkel) => {
    const [cx, cy] = decoratiePunt(vlak, stijl.decoratieHoek, cirkel.x, cirkel.y);
    ctx.beginPath();
    ctx.arc(cx, cy, cirkel.r * vlak.b, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
}

function decoratiePunt(vlak, hoek, dx, dy) {
  const x = dx * vlak.b;
  const y = dy * vlak.b;
  switch (hoek) {
    case 'linksboven': return [vlak.x + x, vlak.y + y];
    case 'rechtsboven': return [vlak.x + vlak.b - x, vlak.y + y];
    case 'linksonder': return [vlak.x + x, vlak.y + vlak.h - y];
    default: return [vlak.x + vlak.b - x, vlak.y + vlak.h - y];
  }
}

function tekenTekstvlak(ctx, breed, vlak, stijl) {
  if (vlak.h <= 0) return;
  ctx.save();
  pad(ctx, vlak, hoeken(breed, stijl.vlakHoeken));
  ctx.fillStyle = stijl.vlakKleur;
  ctx.fill();
  ctx.restore();
}

function tekenTekst(ctx, breed, vlakken) {
  const { vlak, tekst, stijl } = vlakken;
  if (!tekst.hoogte) return;

  const str = TEMPLATES.stramien;
  const typo = TEMPLATES.typografie;

  const x = vlak.x + breed * str.paddingZij;
  let y = vlak.y + breed * str.paddingBoven;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = stijl.kopKleur;
  ctx.font = fontRegel(typo.kop.gewicht, tekst.kopSize);
  tekst.kopRegels.forEach((regel) => {
    const regelhoogte = tekst.kopSize * typo.kop.regelhoogte;
    ctx.fillText(regel, x, y + tekst.kopSize * 0.82);
    y += regelhoogte;
  });

  if (tekst.subRegels.length) {
    if (tekst.kopRegels.length) y += breed * str.tussenKopEnSub;
    ctx.fillStyle = stijl.subKleur;
    ctx.font = fontRegel(typo.sub.gewicht, tekst.subSize);
    tekst.subRegels.forEach((regel) => {
      const regelhoogte = tekst.subSize * typo.sub.regelhoogte;
      ctx.fillText(regel, x, y + tekst.subSize * 0.82);
      y += regelhoogte;
    });
  }
}

/* Een rechthoek met per hoek een eigen afronding. Hoeken: lb linksboven,
   rb rechtsboven, ro rechtsonder, lo linksonder. */
function hoeken(breed, spec) {
  const str = TEMPLATES.stramien;
  const maat = { groot: breed * str.hoekGroot, klein: breed * str.hoekKlein, recht: 0 };
  return {
    lb: maat[spec.lb] || 0,
    rb: maat[spec.rb] || 0,
    ro: maat[spec.ro] || 0,
    lo: maat[spec.lo] || 0,
  };
}

function pad(ctx, v, r) {
  const max = Math.min(v.b, v.h) / 2;
  const lb = Math.min(r.lb, max);
  const rb = Math.min(r.rb, max);
  const ro = Math.min(r.ro, max);
  const lo = Math.min(r.lo, max);

  ctx.beginPath();
  ctx.moveTo(v.x + lb, v.y);
  ctx.lineTo(v.x + v.b - rb, v.y);
  ctx.quadraticCurveTo(v.x + v.b, v.y, v.x + v.b, v.y + rb);
  ctx.lineTo(v.x + v.b, v.y + v.h - ro);
  ctx.quadraticCurveTo(v.x + v.b, v.y + v.h, v.x + v.b - ro, v.y + v.h);
  ctx.lineTo(v.x + lo, v.y + v.h);
  ctx.quadraticCurveTo(v.x, v.y + v.h, v.x, v.y + v.h - lo);
  ctx.lineTo(v.x, v.y + lb);
  ctx.quadraticCurveTo(v.x, v.y, v.x + lb, v.y);
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
  el.maatlabel.textContent = breed + ' × ' + hoog + ' px · ' +
    TEMPLATES.formats[state.format].verhoudingLabel;

  el.teller.textContent =
    state.kop.trim().length + ' + ' + state.sub.trim().length + ' tekens';

  el.fotonaam.textContent = state.fotonaam || '';
  el.dropzone.classList.toggle('gevuld', Boolean(state.foto));
  el.zoomrij.hidden = !state.foto;
  el.downloadknop.disabled = !state.foto;
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
