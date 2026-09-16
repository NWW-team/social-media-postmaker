/*
 * tests/poort.test.js — draait de poortlogica van de frontend na.
 *
 * WAT DIT WEL TOETST: welk scherm er verschijnt in welke situatie, en of de
 * app weigert te starten zonder huisstijl.
 *
 * WAT DIT NIET TOETST: de RLS-policies. Die draaien in Postgres. Deze test
 * bootst de Supabase-client na en kan dus niet bewijzen dat de database
 * gegevens weigert — alleen dat de frontend zich correct gedraagt bij elk
 * antwoord dat de database kan geven. Het echte bewijs voor RLS lever je met
 * de directe-verzoektest uit TESTEN.md.
 *
 * De huisstijl hieronder is VERZONNEN testmateriaal, geen echte huisstijl.
 *
 * Draaien (heeft Node en Playwright nodig; niet vereist om de app te gebruiken):
 *     node tests/poort.test.js
 */

'use strict';

const { chromium } = require('playwright');
const ROOT = require('path').join(__dirname, '..');

/* Minimale, fictieve huisstijl: genoeg om de app te laten tekenen. */
const huisstijl = {
  kleuren: { blauw: '#112233', lichtblauw: '#ccddee', donkerblauw: '#001122',
             middenblauw: '#223344', zacht: '#aabbcc', wit: '#FFFFFF' },
  lettertype: 'Arial, sans-serif',
  papier: '#FFFFFF',
  decoratie: { aan: true, lijndikte: 0.002, lijnkleur: 'rgba(255,255,255,0.9)',
               badgeKleur: '#FFFFFF', icoonKleur: '#112233', icoonDeel: 0.65,
               ringen: [{ x: 0.14, y: -0.14, d: 0.56 }],
               badges: [{ x: 0.19, y: -0.40, d: 0.16 }] },
  iconen: {
    'Proeficoon A': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="10" height="10"><circle cx="5" cy="5" r="4" fill="{kleur}"/></svg>',
    'Proeficoon B': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="10" height="10"><rect x="1" y="1" width="8" height="8" fill="{kleur}"/></svg>',
    // Kort maar achteraan in het alfabet, en lang maar vooraan: zo valt op als
    // de keuzelijst de volgorde van Postgres overneemt in plaats van het alfabet.
    'Zebra': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="10" height="10"><path d="M1 1h8v8H1z" fill="{kleur}"/></svg>',
    'Aanvraag': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="10" height="10"><path d="M5 1 9 9H1z" fill="{kleur}"/></svg>',
  },
  platforms: { instagram: { label: 'Instagram', maten: { staand: [1080, 1350], vierkant: [1080, 1080] } },
               facebook:  { label: 'Facebook',  maten: { staand: [1200, 1500], vierkant: [1200, 1200] } } },
  formats: { staand: { label: 'Staand', verhoudingLabel: '4:5', uitToolkit: true },
             vierkant: { label: 'Vierkant', verhoudingLabel: '1:1', uitToolkit: false } },
  stramien: { marge: 0.035, paddingZij: 0.058, tussenKopEnSub: 0.022, hoekFactor: 0.095, vlakKrimpt: true },
  korps: { pt66: 0.061, pt54: 0.05, pt40: 0.037, pt30: 0.028, pt24: 0.022 },
  regelhoogte: { kop: 1.15, sub: 1.2 },
  stijlen: {
    proefA: { label: 'Proefstijl A', bron: 'test', positie: 'onder', vlakHoogte: 0.59,
              vlakKleur: '#ccddee', paddingBoven: 0.059, paddingOnder: 0.0625,
              kop: { grootte: 0.05, maxRegels: 3, kleur: '#112233', gewicht: 700 },
              sub: { grootte: 0.028, maxRegels: 1, kleur: '#112233', gewicht: 400 } },
    proefB: { label: 'Proefstijl B', bron: 'test', positie: 'opFoto', vlakHoogte: 0,
              vlakKleur: null, paddingBoven: 0.077, paddingOnder: 0,
              kop: { grootte: 0.05, maxRegels: 2, kleur: '#FFFFFF', gewicht: 700 },
              sub: { grootte: 0.037, maxRegels: 2, kleur: '#FFFFFF', gewicht: 400 } },
  },
};

const stub = (scenario) => `
window.__scenario = ${JSON.stringify(scenario)};
window.__letterverzoeken = [];
window.supabase = {
  createClient() {
    let cb = null;
    const s = window.__scenario;
    return {
      auth: {
        onAuthStateChange(fn) { cb = fn; setTimeout(() => fn('INITIAL_SESSION', s.sessie), 0); return { data:{subscription:{unsubscribe(){}}} }; },
        async signInWithPassword({ email }) {
          if (!s.wachtwoordOk) return { error: { message: 'Invalid login credentials' } };
          const sessie = { user: { id: 'u1', email } };
          setTimeout(() => cb('SIGNED_IN', sessie), 0);
          return { data: { session: sessie }, error: null };
        },
        async signOut() { return { error: null }; },
      },
      /*
       * De besloten opslag met het huisstijllettertype. Een echte woff2 staat
       * hier niet: die is licentieplichtig en hoort net zomin in de tests als
       * in de repo. Wat hier wél te toetsen valt, is het gedrag als de letter
       * er niet is of niet deugt — en dat is precies het geval waarin de
       * redacteur geen stukgelopen scherm mag krijgen.
       */
      storage: {
        from(bak) {
          return {
            async download(bestand) {
              window.__letterverzoeken.push(bak + '/' + bestand);
              const inhoud = (s.letters || {})[bestand];
              if (inhoud === undefined) return { data: null, error: { message: 'Object not found' } };
              return { data: new Blob([inhoud]), error: null };
            },
          };
        },
      },
      from(tabel) {
        const q = {
          select() { return q; },
          order() { return q; },
          insert() { return Promise.resolve({ error: null }); },
          delete() { return { eq: () => Promise.resolve({ error: null }) }; },
          then(res) { return Promise.resolve(s.rijen[tabel] ?? { data: [], error: null }).then(res); },
        };
        return q;
      },
    };
  },
};`;

const configStub = `
const SUPABASE_CONFIG = { url: 'https://test.supabase.co', publishableKey: 'sb_publishable_test' };
function configIsIngevuld() { return true; }`;

const rijenToegestaan = {
  huisstijl: { data: Object.entries(huisstijl).map(([sleutel, waarde]) => ({ sleutel, waarde })), error: null },
  concepten: { data: [
    { id: 'c1', titel: 'Souvenirs juli', inhoud: { platform:'facebook', format:'vierkant', stijl:'proefB', kop:[{tekst:'Test ', korps:null, gewicht:null, schuin:false},{tekst:'paspoort', korps:'pt66', gewicht:700, schuin:true}], sub:'Test sub', decoratie:true, decoratiepositie:'rechtsboven', iconen:['Proeficoon A','Proeficoon B'], zoom:1.4, brandpunt:{x:0.4,y:0.6} }, bijgewerkt_op: '2026-09-15T10:00:00Z' },
    /* Bewaard voordat de cirkels konden verhuizen: zonder de sleutel. */
    { id: 'c2', titel: 'Souvenirs juni', inhoud: { platform:'instagram', format:'staand', stijl:'proefA', kop:'Oud concept', sub:'', decoratie:true, iconen:['Proeficoon A','Proeficoon B'], zoom:1, brandpunt:{x:0.5,y:0.5} }, bijgewerkt_op: '2026-09-14T10:00:00Z' },
  ], error: null },
};

async function run(naam, scenario, controle) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const fouten = [];
  page.on('pageerror', (e) => fouten.push(String(e)));
  await page.route('**/vendor/supabase-js.js', (r) => r.fulfill({ contentType: 'application/javascript', body: stub(scenario) }));
  await page.route('**/config.js', (r) => r.fulfill({ contentType: 'application/javascript', body: configStub }));
  await page.goto('file://' + ROOT + '/index.html');
  await page.waitForTimeout(700);
  const res = await controle(page);
  await browser.close();
  const ok = res.ok && fouten.length === 0;
  console.log((ok ? '  PASS  ' : '  FAAL  ') + naam + (res.uitleg ? ' — ' + res.uitleg : ''));
  if (fouten.length) console.log('         js-fouten: ' + fouten.join(' | '));
  return ok;
}

/*
 * Kijk naar wat de bezoeker ZIET, niet naar het hidden-attribuut.
 *
 * Dit is precies waar de vorige versie van deze test de mist in ging: die
 * vroeg `el.hidden` op en kreeg `true` terug, terwijl het element gewoon in
 * beeld stond. Het attribuut zet display:none via de stijl van de browser
 * zelf, en een eigen `main { display: grid }` wint daarvan.
 */
const zichtbaar = (page, id) => page.evaluate((i) => {
  const el = document.getElementById(i);
  if (!el) return false;
  const st = getComputedStyle(el);
  return st.display !== 'none' && st.visibility !== 'hidden'
         && el.getClientRects().length > 0;
}, id);

(async () => {
  let alles = true;

  alles &= await run('uitgelogd: inlogscherm zichtbaar, werkblad dicht',
    { sessie: null, rijen: {} },
    async (p) => {
      const poort = await zichtbaar(p, 'poort');
      const werkblad = await zichtbaar(p, 'werkblad');
      return { ok: poort && !werkblad, uitleg: `poort=${poort} werkblad=${werkblad}` };
    });

  alles &= await run('uitgelogd: TEMPLATES leeg, geen huisstijl in de pagina',
    { sessie: null, rijen: {} },
    async (p) => {
      const t = await p.evaluate(() => TEMPLATES);
      const gestart = await p.evaluate(() => appGestart);
      return { ok: t === null && gestart === false, uitleg: `TEMPLATES=${t} appGestart=${gestart}` };
    });

  alles &= await run('toegestaan account: werkblad open, huisstijl geladen, canvas getekend',
    { sessie: { user: { id: 'u1', email: 'redacteur@example.org' } }, rijen: rijenToegestaan },
    async (p) => {
      const werkblad = await zichtbaar(p, 'werkblad');
      const stijlen = await p.evaluate(() => Object.keys(TEMPLATES.stijlen).length);
      const knoppen = await p.evaluate(() => document.querySelectorAll('#stijlknoppen button').length);
      const getekend = await p.evaluate(() => {
        const c = document.getElementById('canvas');
        const d = c.getContext('2d').getImageData(0, 0, 1, 1).data;
        return d[3] > 0;
      });
      const adres = await p.evaluate(() => document.getElementById('sessieadres').textContent);
      return { ok: werkblad && stijlen === 2 && knoppen === 2 && getekend && adres === 'redacteur@example.org',
               uitleg: `stijlen=${stijlen} knoppen=${knoppen} getekend=${getekend}` };
    });

  alles &= await run('niet-toegestaan account: nul rijen -> geen-toegangscherm, app start niet',
    { sessie: { user: { id: 'u2', email: 'buitenstaander@example.org' } }, rijen: { huisstijl: { data: [], error: null } } },
    async (p) => {
      const geen = await zichtbaar(p, 'geentoegang');
      const werkblad = await zichtbaar(p, 'werkblad');
      const t = await p.evaluate(() => TEMPLATES);
      const adres = await p.evaluate(() => document.getElementById('geentoegangAdres').textContent);
      return { ok: geen && !werkblad && t === null && adres === 'buitenstaander@example.org',
               uitleg: `geentoegang=${geen} werkblad=${werkblad} TEMPLATES=${t}` };
    });

  alles &= await run('RLS-weigering (error i.p.v. lege lijst) -> ook geen toegang',
    { sessie: { user: { id: 'u2', email: 'x@example.org' } }, rijen: { huisstijl: { data: null, error: { message: 'permission denied' } } } },
    async (p) => {
      const geen = await zichtbaar(p, 'geentoegang');
      const t = await p.evaluate(() => TEMPLATES);
      return { ok: geen && t === null, uitleg: `geentoegang=${geen}` };
    });

  alles &= await run('werkblad forceren zonder toegang levert een leeg canvas op',
    { sessie: { user: { id: 'u2', email: 'buitenstaander@example.org' } }, rijen: { huisstijl: { data: [], error: null } } },
    async (p) => {
      // Dit is de aanval: de bezoeker haalt in de console het scherm open.
      const gevolg = await p.evaluate(() => {
        document.getElementById('werkblad').hidden = false;
        document.getElementById('geentoegang').hidden = true;
        try { startApp(); return 'app gestart'; } catch (e) { return 'geweigerd: ' + e.message; }
      });
      const knoppen = await p.evaluate(() => document.querySelectorAll('#stijlknoppen button').length);
      const getekend = await p.evaluate(() => {
        const d = document.getElementById('canvas').getContext('2d').getImageData(0, 0, 1, 1).data;
        return d[3] > 0;
      });
      return { ok: gevolg.startsWith('geweigerd') && knoppen === 0 && !getekend,
               uitleg: `${gevolg}, stijlknoppen=${knoppen}, canvas getekend=${getekend}` };
    });

  alles &= await run('inloggen met fout wachtwoord: melding, werkblad blijft dicht',
    { sessie: null, wachtwoordOk: false, rijen: {} },
    async (p) => {
      await p.fill('#inlogEmail', 'redacteur@example.org');
      await p.fill('#inlogWachtwoord', 'fout');
      await p.click('#inlogknop');
      await p.waitForTimeout(300);
      const melding = await zichtbaar(p, 'inlogmelding');
      const werkblad = await zichtbaar(p, 'werkblad');
      const tekst = await p.evaluate(() => document.getElementById('inlogmelding').textContent);
      const lekt = /bestaat niet|onbekend|geen account/i.test(tekst);
      return { ok: melding && !werkblad && !lekt, uitleg: `melding="${tekst.slice(0,45)}…"` };
    });

  alles &= await run('inloggen met goed wachtwoord: werkblad gaat open',
    { sessie: null, wachtwoordOk: true, rijen: rijenToegestaan },
    async (p) => {
      await p.fill('#inlogEmail', 'redacteur@example.org');
      await p.fill('#inlogWachtwoord', 'goed-wachtwoord-12');
      await p.click('#inlogknop');
      await p.waitForTimeout(500);
      const werkblad = await zichtbaar(p, 'werkblad');
      const leeg = await p.evaluate(() => document.getElementById('inlogWachtwoord').value === '');
      return { ok: werkblad && leeg, uitleg: `werkblad=${werkblad}, wachtwoordveld gewist=${leeg}` };
    });

  alles &= await run('concept openen zet alle instellingen terug, zonder foto',
    { sessie: { user: { id: 'u1', email: 'redacteur@example.org' } }, rijen: rijenToegestaan },
    async (p) => {
      await p.selectOption('#conceptlijst', 'c1');
      await p.click('#conceptOpenen');
      await p.waitForTimeout(200);
      const st = await p.evaluate(() => ({ ...state, foto: state.foto, koptekst: platteTekst(state.kop) }));
      const opgeslagen = await p.evaluate(() => leesConcept());
      const keuzelijst = await p.evaluate(() => document.getElementById('decoratiepositie').value);
      return { ok: st.platform === 'facebook' && st.format === 'vierkant' && st.stijl === 'proefB'
                   && st.koptekst === 'Test paspoort'
                   && Math.abs(st.zoom - 1.4) < 1e-9 && st.foto === null
                   && !('foto' in opgeslagen)
                   && st.decoratiepositie === 'rechtsboven' && keuzelijst === 'rechtsboven',
               uitleg: `${st.platform}/${st.format}/${st.stijl} zoom=${st.zoom}, plek=${st.decoratiepositie}/${keuzelijst}, foto in concept=${'foto' in opgeslagen}` };
    });

  alles &= await run('concept van voor de cirkelplek valt terug op linksonder',
    { sessie: { user: { id: 'u1', email: 'redacteur@example.org' } }, rijen: rijenToegestaan },
    async (p) => {
      // Eerst een concept mét plek openen, zodat de terugval ook echt iets
      // moet terugzetten in plaats van te blijven staan waar hij al stond.
      await p.selectOption('#conceptlijst', 'c1');
      await p.click('#conceptOpenen');
      await p.waitForTimeout(200);
      await p.selectOption('#conceptlijst', 'c2');
      await p.click('#conceptOpenen');
      await p.waitForTimeout(200);
      const plek = await p.evaluate(() => state.decoratiepositie);
      const keuzelijst = await p.evaluate(() => document.getElementById('decoratiepositie').value);
      return { ok: plek === 'linksonder' && keuzelijst === 'linksonder',
               uitleg: `plek=${plek}/${keuzelijst}` };
    });

  /*
   * De zes plekken zijn spiegelingen en een verschuiving van één groep uit de
   * huisstijl. Dit rekent ze na op een foto van 1000 bij 800, met de ring en de
   * badge uit de verzonnen huisstijl hierboven: gaat er iets mis in de
   * omrekening, dan is het hier te zien en niet pas in de export.
   */
  alles &= await run('de zes cirkelplekken komen op de juiste plaats uit',
    { sessie: { user: { id: 'u1', email: 'redacteur@example.org' } }, rijen: rijenToegestaan },
    async (p) => {
      const uit = await p.evaluate(() => {
        const foto = { x: 0, y: 0, b: 1000, h: 800 };
        const ring = { x: 0.14, y: -0.14, d: 0.56 };
        const plekken = {};
        Object.keys(DECORATIEPOSITIES).forEach((naam) => {
          const p = decoratiePlaatsing(foto, naam)(ring);
          plekken[naam] = [Math.round(p.cx), Math.round(p.cy), Math.round(p.straal)];
        });
        // Een onbekende naam hoort niet te laten vallen, maar terug te vallen.
        plekken.onzin = (() => {
          const p = decoratiePlaatsing(foto, 'bestaatniet')(ring);
          return [Math.round(p.cx), Math.round(p.cy), Math.round(p.straal)];
        })();
        return plekken;
      });

      // linksonder = de huisstijl zelf; rechts is 1 - x; boven spiegelt om het
      // midden van de foto; midden legt het midden van de groep op 0,5.
      const verwacht = {
        linksonder:  [140, 660, 280],
        rechtsonder: [860, 660, 280],
        linksboven:  [140, 140, 280],
        rechtsboven: [860, 140, 280],
        middenonder: [500, 660, 280],
        middenboven: [500, 140, 280],
        onzin:       [140, 660, 280],
      };
      const fout = Object.keys(verwacht)
        .filter((naam) => String(uit[naam]) !== String(verwacht[naam]))
        .map((naam) => `${naam}: ${uit[naam]} i.p.v. ${verwacht[naam]}`);
      return { ok: fout.length === 0, uitleg: fout.length ? fout.join('; ') : 'alle zes kloppen' };
    });

  /*
   * Postgres geeft jsonb-sleutels terug op lengte en pas daarbinnen op alfabet.
   * Bij twintig iconen is dat een onvindbare lijst, dus de app sorteert zelf.
   */
  alles &= await run('de icoonlijsten staan op alfabet, niet op sleutellengte',
    { sessie: { user: { id: 'u1', email: 'redacteur@example.org' } }, rijen: rijenToegestaan },
    async (p) => {
      const lijsten = await p.evaluate(() => ['icoon0', 'icoon1'].map(
        (id) => [...document.getElementById(id).options].map((o) => o.value)));
      const verwacht = ['Aanvraag', 'Proeficoon A', 'Proeficoon B', 'Zebra'];
      const goed = lijsten.every((lijst) => String(lijst) === String(verwacht));
      return { ok: goed, uitleg: goed ? verwacht.join(', ') : `kreeg ${lijsten[0]}` };
    });

  /*
   * Meten en tekenen moeten dezelfde letter gebruiken. Zouden ze uiteenlopen,
   * dan breekt de tekst af op de ene maat en staat hij er in de andere: regels
   * over de rand, of een vlak met lucht eronder. Daarom toetst dit niet of er
   * "iets" verandert maar wat er per stukje uit de meting komt — dat is precies
   * waarmee breekAfStukken() heeft gemeten en waarmee tekenRegels() tekent.
   */
  alles &= await run('opmaak op een stuk tekst komt alleen op dat stuk terecht',
    { sessie: { user: { id: 'u1', email: 'redacteur@example.org' } }, rijen: rijenToegestaan },
    async (p) => {
      const uit = await p.evaluate(() => {
        state.stijl = 'proefA';
        state.sub = [];
        state.kop = [
          { tekst: 'Souvenirs ', korps: null, gewicht: null, schuin: false },
          { tekst: 'meenemen', korps: 'pt66', gewicht: 700, schuin: true },
          { tekst: ' uit het buitenland', korps: null, gewicht: null, schuin: false },
        ];
        toonTekstvelden();
        teken();

        const [breed, hoog] = huidigeMaat(state);
        const indel = indeling(breed, hoog, state);
        const regels = indel.tekst.kop.regels;
        return {
          stukjes: regels.map((r) => r.stukjes.map((s) => ({
            tekst: s.tekst, font: fontVan(s.spec), grootte: Math.round(s.spec.grootte),
            gewicht: s.spec.gewicht, schuin: s.spec.schuin,
          }))),
          groottes: regels.map((r) => Math.round(r.grootte)),
          tekst: regels.map((r) => r.stukjes.map((s) => s.tekst).join('')),
          melding: document.getElementById('melding').textContent,
        };
      });

      const alle = uit.stukjes.flat();
      const fouten = [];

      // pt66 is 0,061 van 1080 in de verzonnen huisstijl hierboven: 66 px.
      const uitgelicht = alle.find((s) => s.tekst.includes('meenemen'));
      const rest = alle.find((s) => s.tekst.includes('Souvenirs'));

      if (!uitgelicht || uitgelicht.grootte !== 66 || uitgelicht.gewicht !== 700 || !uitgelicht.schuin) {
        fouten.push('het uitgelichte stuk klopt niet: ' + JSON.stringify(uitgelicht));
      }
      if (!rest || rest.grootte !== 54 || rest.schuin) {
        fouten.push('de rest volgt de stijl niet: ' + JSON.stringify(rest));
      }
      // De regel met het grote woord erin is zo hoog als dat woord.
      const metGroot = uit.stukjes.findIndex((r) => r.some((s) => s.grootte === 66));
      if (metGroot < 0 || uit.groottes[metGroot] !== 66) {
        fouten.push('de regelhoogte volgt het grootste stuk niet: ' + uit.groottes.join(','));
      }
      // Woorden blijven heel en in volgorde staan.
      if (!uit.tekst.join(' ').includes('Souvenirs meenemen uit het')) {
        fouten.push('de tekst is niet heel gebleven: ' + JSON.stringify(uit.tekst));
      }
      if (!/wijkt af van de toolkit/.test(uit.melding)) fouten.push('geen melding bij afwijken');

      return { ok: fouten.length === 0,
               uitleg: fouten.length ? fouten.join('; ')
                                     : alle.map((s) => s.font).join(' | ') };
    });

  /*
   * Een woord mag half opgemaakt zijn. Dan bestaat dat woord uit twee stukjes
   * en mag het nog steeds niet middenin afgebroken worden.
   */
  alles &= await run('een half opgemaakt woord blijft één woord',
    { sessie: { user: { id: 'u1', email: 'redacteur@example.org' } }, rijen: rijenToegestaan },
    async (p) => {
      const uit = await p.evaluate(() => {
        state.stijl = 'proefA';
        state.sub = [];
        state.kop = [
          { tekst: 'aaa bbb pas', korps: null, gewicht: null, schuin: false },
          { tekst: 'poort ccc', korps: null, gewicht: 700, schuin: false },
        ];
        teken();
        const [breed, hoog] = huidigeMaat(state);
        const regels = indeling(breed, hoog, state).tekst.kop.regels;
        return regels.map((r) => r.stukjes.map((s) => s.tekst).join(''));
      });
      const heel = uit.every((regel) => !/pas$/.test(regel)) &&
                   uit.join(' ').includes('paspoort');
      return { ok: heel, uitleg: JSON.stringify(uit) };
    });

  /*
   * De werkbalk werkt op de selectie. Dit klikt hem aan zoals een redacteur dat
   * doet: slepen over een woord en op B drukken.
   */
  /*
   * De B-knop is een schakelaar, geen "maak vetter". In proefA is de kop al 700
   * en de subtekst 400, dus dezelfde klik hoort in het ene veld vet aan te
   * zetten en in het andere uit. Anders zou B op een kop niets zichtbaars doen.
   */
  alles &= await run('de werkbalk schakelt vet op de selectie, en laat de rest staan',
    { sessie: { user: { id: 'u1', email: 'redacteur@example.org' } }, rijen: rijenToegestaan },
    async (p) => {
      const uit = await p.evaluate(() => {
        state.stijl = 'proefA';               // kop 700, sub 400
        const klikOpWoord = (veldnaam, woord) => {
          const host = document.getElementById(veldnaam);
          const knoop = host.firstChild;
          const begin = knoop.nodeValue.indexOf(woord);
          const bereik = document.createRange();
          bereik.setStart(knoop, begin);
          bereik.setEnd(knoop, begin + woord.length);
          const sel = getSelection();
          sel.removeAllRanges();
          sel.addRange(bereik);
          document.querySelector('#' + veldnaam + 'balk [data-rol="vet"]').click();
          return {
            stukken: state[veldnaam].map((s) => s.tekst + '/' + (s.gewicht || 'stijl')),
            // Blijft de selectie op hetzelfde woord staan na het opnieuw opbouwen?
            selectie: getSelection().toString(),
            html: host.innerHTML,
          };
        };

        state.kop = [{ tekst: 'Souvenirs meenemen uit het buitenland', korps: null, gewicht: null, schuin: false }];
        state.sub = [{ tekst: 'Dit zijn de regels', korps: null, gewicht: null, schuin: false }];
        toonTekstvelden();
        teken();

        return { sub: klikOpWoord('sub', 'regels'), kop: klikOpWoord('kop', 'meenemen') };
      });

      const fouten = [];
      // De subtekst is 400, dus vet gaat AAN.
      if (uit.sub.stukken.length !== 2 || !uit.sub.stukken[1].endsWith('/700')) {
        fouten.push('vet ging niet aan in de subtekst: ' + uit.sub.stukken.join(' · '));
      }
      // De kop is al 700, dus dezelfde knop haalt vet ERAF.
      if (uit.kop.stukken.length !== 3 || !uit.kop.stukken[1].endsWith('/400')) {
        fouten.push('vet ging niet uit in de kop: ' + uit.kop.stukken.join(' · '));
      }
      if (uit.kop.selectie !== 'meenemen') {
        fouten.push('de selectie is versprongen: "' + uit.kop.selectie + '"');
      }
      if (!/data-gewicht="400"/.test(uit.kop.html)) {
        fouten.push('het veld toont de opmaak niet: ' + uit.kop.html);
      }

      return { ok: fouten.length === 0,
               uitleg: fouten.length ? fouten.join('; ')
                                     : 'sub: ' + uit.sub.stukken.join(' · ') + ' | kop: ' + uit.kop.stukken.join(' · ') };
    });

  alles &= await run('concept bewaart opgemaakte tekst, en oude concepten blijven werken',
    { sessie: { user: { id: 'u1', email: 'redacteur@example.org' } }, rijen: rijenToegestaan },
    async (p) => {
      // c1 bewaart stukken, c2 is van voor de werkbalk en bewaart een string.
      await p.selectOption('#conceptlijst', 'c1');
      await p.click('#conceptOpenen');
      await p.waitForTimeout(200);
      const nieuw = await p.evaluate(() => ({
        stukken: state.kop.map((s) => [s.tekst, s.korps, s.gewicht, s.schuin]),
        opnieuw: leesConcept().kop.map((s) => [s.tekst, s.korps, s.gewicht, s.schuin]),
        html: document.getElementById('kop').innerHTML,
      }));

      await p.selectOption('#conceptlijst', 'c2');
      await p.click('#conceptOpenen');
      await p.waitForTimeout(200);
      const oud = await p.evaluate(() => ({
        stukken: state.kop.map((s) => [s.tekst, s.korps, s.gewicht, s.schuin]),
        tekst: document.getElementById('kop').textContent,
      }));

      const fouten = [];
      if (nieuw.stukken.length !== 2) fouten.push('stukken niet teruggezet: ' + JSON.stringify(nieuw.stukken));
      if (String(nieuw.stukken[1]) !== String(['paspoort', 'pt66', 700, true])) {
        fouten.push('opmaak niet teruggezet: ' + JSON.stringify(nieuw.stukken[1]));
      }
      if (String(nieuw.opnieuw) !== String(nieuw.stukken)) fouten.push('bewaren en terugzetten lopen uiteen');
      if (!/data-korps="pt66"/.test(nieuw.html)) fouten.push('het veld toont de opmaak niet: ' + nieuw.html);
      if (oud.stukken.length !== 1 || oud.stukken[0][1] !== null) {
        fouten.push('oud concept niet omgezet: ' + JSON.stringify(oud.stukken));
      }
      if (oud.tekst !== 'Oud concept') fouten.push('oude tekst niet in het veld: ' + oud.tekst);

      return { ok: fouten.length === 0, uitleg: fouten.length ? fouten.join('; ') : 'beide vormen goed' };
    });

  alles &= await run('huisstijlletter ontbreekt in de opslag: de tool start op de terugvalletter',
    { sessie: { user: { id: 'u1', email: 'redacteur@example.org' } }, rijen: rijenToegestaan },
    async (p) => {
      const werkblad = await zichtbaar(p, 'werkblad');
      const getekend = await p.evaluate(() => {
        const d = document.getElementById('canvas').getContext('2d').getImageData(0, 0, 1, 1).data;
        return d[3] > 0;
      });
      // Gevraagd is er wél, en onder de naam die 05_huisstijlletter.sql
      // beschrijft: een typefout in bak of bestandsnaam valt hier door de mand.
      const gevraagd = await p.evaluate(() => window.__letterverzoeken.slice().sort());
      const juist = String(gevraagd) === String([
        'huisstijl-font/RijksSansWeb-Italic.woff2',
        'huisstijl-font/RijksSansWeb-Regular.woff2',
      ]);
      return { ok: werkblad && getekend && juist,
               uitleg: `werkblad=${werkblad} getekend=${getekend} gevraagd=${gevraagd.join(' + ') || 'niets'}` };
    });

  alles &= await run('onleesbaar lettertypebestand houdt de tool niet tegen',
    { sessie: { user: { id: 'u1', email: 'redacteur@example.org' } }, rijen: rijenToegestaan,
      letters: { 'RijksSansWeb-Regular.woff2': 'dit is geen woff2',
                 'RijksSansWeb-Italic.woff2': 'dit ook niet' } },
    async (p) => {
      const werkblad = await zichtbaar(p, 'werkblad');
      const getekend = await p.evaluate(() => {
        const d = document.getElementById('canvas').getContext('2d').getImageData(0, 0, 1, 1).data;
        return d[3] > 0;
      });
      // Geen halve registratie: een bestand dat niet parseert hoort niet als
      // huisstijlletter in document.fonts te belanden.
      const families = await p.evaluate(() => {
        const uit = [];
        document.fonts.forEach((f) => uit.push(f.family));
        return uit;
      });
      const schoon = !families.includes('RijksSansVF');
      return { ok: werkblad && getekend && schoon,
               uitleg: `werkblad=${werkblad} getekend=${getekend} families=[${families.join(', ')}]` };
    });

  alles &= await run('plus en min zetten het hele veld een maat op, zonder selectie',
    { sessie: { user: { id: 'u1', email: 'redacteur@example.org' } }, rijen: rijenToegestaan },
    async (p) => {
      // proefA: kop 0.05 = pt54. Niets selecteren — dat is juist het punt.
      await p.evaluate(() => {
        state.stijl = 'proefA';
        state.kop = [{ tekst: 'Souvenirs meenemen uit het buitenland', korps: null, gewicht: null, schuin: false }];
        toonTekstvelden();
        werkbijUI();
      });

      const maat = () => p.evaluate(() => document.querySelector('#kopbalk [data-rol="maat"]').textContent);
      const korpsen = () => p.evaluate(() => state.kop.map((s) => s.korps));

      const beginmaat = await maat();
      await p.click('#kopbalk [data-rol="groter"]');
      const naGroter = { maat: await maat(), korps: await korpsen() };
      await p.click('#kopbalk [data-rol="kleiner"]');
      const naTerug = { maat: await maat(), korps: await korpsen() };

      const fouten = [];
      if (beginmaat !== '54 pt') fouten.push('beginmaat is niet die van de stijl: ' + beginmaat);
      if (naGroter.maat !== '66 pt') fouten.push('+ ging niet naar 66 pt maar naar ' + naGroter.maat);
      if (JSON.stringify(naGroter.korps) !== '["pt66"]') {
        fouten.push('+ zette het veld niet op pt66: ' + JSON.stringify(naGroter.korps));
      }
      if (naTerug.maat !== '54 pt') fouten.push('- ging niet terug naar 54 pt maar naar ' + naTerug.maat);
      // Terug op de maat van de stijl hoort "volgt de stijl" te betekenen, niet
      // "toevallig even groot": anders schuift het veld niet mee met een andere stijl.
      if (JSON.stringify(naTerug.korps) !== '[null]') {
        fouten.push('terug op de stijlmaat liet een eigen korps staan: ' + JSON.stringify(naTerug.korps));
      }
      return { ok: fouten.length === 0,
               uitleg: fouten.length ? fouten.join('; ') : beginmaat + ' -> ' + naGroter.maat + ' -> ' + naTerug.maat };
    });

  alles &= await run('de maatknoppen stoppen aan het eind van de korpsladder',
    { sessie: { user: { id: 'u1', email: 'redacteur@example.org' } }, rijen: rijenToegestaan },
    async (p) => {
      const stand = await p.evaluate(() => {
        state.stijl = 'proefA';
        state.kop = [{ tekst: 'Kop', korps: null, gewicht: null, schuin: false }];
        toonTekstvelden();
        werkbijUI();

        const klik = (rol) => {
          const knop = document.querySelector('#kopbalk [data-rol="' + rol + '"]');
          if (!knop.disabled) knop.click();
          return knop.disabled;
        };
        // Vijf sporten op de ladder: tien klikken komt hoe dan ook aan het eind uit.
        for (let i = 0; i < 10; i++) klik('groter');
        const boven = { maat: document.querySelector('#kopbalk [data-rol="maat"]').textContent,
                        groterUit: document.querySelector('#kopbalk [data-rol="groter"]').disabled };
        for (let i = 0; i < 10; i++) klik('kleiner');
        const onder = { maat: document.querySelector('#kopbalk [data-rol="maat"]').textContent,
                        kleinerUit: document.querySelector('#kopbalk [data-rol="kleiner"]').disabled };
        return { boven, onder };
      });

      const fouten = [];
      if (stand.boven.maat !== '66 pt' || !stand.boven.groterUit) {
        fouten.push('bovenaan klopt niet: ' + JSON.stringify(stand.boven));
      }
      if (stand.onder.maat !== '24 pt' || !stand.onder.kleinerUit) {
        fouten.push('onderaan klopt niet: ' + JSON.stringify(stand.onder));
      }
      return { ok: fouten.length === 0,
               uitleg: fouten.length ? fouten.join('; ') : 'boven 66 pt, onder 24 pt, knoppen uit' };
    });

  alles &= await run('opmaak verwijderen wist het hele veld, niet alleen de selectie',
    { sessie: { user: { id: 'u1', email: 'redacteur@example.org' } }, rijen: rijenToegestaan },
    async (p) => {
      await p.evaluate(() => {
        state.stijl = 'proefA';
        state.kop = [
          { tekst: 'Souvenirs ', korps: 'pt66', gewicht: null, schuin: false },
          { tekst: 'meenemen', korps: null, gewicht: 400, schuin: true },
          { tekst: ' uit het buitenland', korps: 'pt24', gewicht: null, schuin: false },
        ];
        toonTekstvelden();
        werkbijUI();
        // Eén woord selecteren: de knop hoort zich daar niets van aan te trekken.
        zetSelectie(document.getElementById('kop'), 0, 5);
      });
      await p.click('#kopbalk [data-rol="terug"]');

      const uit = await p.evaluate(() => ({
        stukken: state.kop.map((s) => [s.tekst, s.korps, s.gewicht, s.schuin]),
        html: document.getElementById('kop').innerHTML,
        maat: document.querySelector('#kopbalk [data-rol="maat"]').textContent,
      }));

      const fouten = [];
      if (uit.stukken.length !== 1) fouten.push('niet alles is gewist: ' + JSON.stringify(uit.stukken));
      const s0 = uit.stukken[0] || [];
      if (s0[1] !== null || s0[2] !== null || s0[3] !== false) {
        fouten.push('er bleef opmaak staan: ' + JSON.stringify(s0));
      }
      if (s0[0] !== 'Souvenirs meenemen uit het buitenland') fouten.push('de tekst veranderde: ' + s0[0]);
      if (/data-/.test(uit.html)) fouten.push('het veld toont nog opmaak: ' + uit.html);
      if (uit.maat !== '54 pt') fouten.push('de maat viel niet terug op de stijl: ' + uit.maat);
      return { ok: fouten.length === 0, uitleg: fouten.length ? fouten.join('; ') : 'alles terug naar de stijl' };
    });

  alles &= await run('een leeg veld heeft niets op te maken: de knoppen staan uit',
    { sessie: { user: { id: 'u1', email: 'redacteur@example.org' } }, rijen: rijenToegestaan },
    async (p) => {
      const uit = await p.evaluate(() => {
        state.stijl = 'proefA';
        state.kop = [];
        toonTekstvelden();
        werkbijUI();
        const rol = (r) => document.querySelector('#kopbalk [data-rol="' + r + '"]').disabled;
        return { kleiner: rol('kleiner'), groter: rol('groter'), terug: rol('terug'),
                 maat: document.querySelector('#kopbalk [data-rol="maat"]').textContent };
      });
      // De maat van de stijl hoort er wél te staan: die zie je zo vast staan
      // voordat je begint te typen.
      const ok = uit.kleiner && uit.groter && uit.terug && uit.maat === '54 pt';
      return { ok, uitleg: JSON.stringify(uit) };
    });

  console.log(alles ? '\nAlle frontendtests geslaagd.' : '\nEr zijn tests gefaald.');
  process.exit(alles ? 0 : 1);
})();
