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
  concepten: { data: [{ id: 'c1', titel: 'Souvenirs juli', inhoud: { platform:'facebook', format:'vierkant', stijl:'proefB', kop:'Test kop', sub:'Test sub', decoratie:true, iconen:['Proeficoon A','Proeficoon B'], zoom:1.4, brandpunt:{x:0.4,y:0.6} }, bijgewerkt_op: '2026-09-15T10:00:00Z' }], error: null },
};

async function run(naam, scenario, controle) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const fouten = [];
  page.on('pageerror', (e) => fouten.push(String(e)));
  await page.route('**/supabase-js@2/**', (r) => r.fulfill({ contentType: 'application/javascript', body: stub(scenario) }));
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
      const st = await p.evaluate(() => ({ ...state, foto: state.foto }));
      const opgeslagen = await p.evaluate(() => leesConcept());
      return { ok: st.platform === 'facebook' && st.format === 'vierkant' && st.stijl === 'proefB'
                   && st.kop === 'Test kop' && Math.abs(st.zoom - 1.4) < 1e-9 && st.foto === null
                   && !('foto' in opgeslagen),
               uitleg: `${st.platform}/${st.format}/${st.stijl} zoom=${st.zoom}, foto in concept=${'foto' in opgeslagen}` };
    });

  console.log(alles ? '\nAlle frontendtests geslaagd.' : '\nEr zijn tests gefaald.');
  process.exit(alles ? 0 : 1);
})();
