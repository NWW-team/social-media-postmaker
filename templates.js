/*
 * templates.js — het sjabloonsysteem.
 *
 * Dit is het enige bestand dat je aanpast om de opmaak te wijzigen: kleuren,
 * marges, hoekafronding, tekstgroottes en de drie stijlen staan hier.
 *
 * De opmaak is nagebouwd naar bestaande posts van @nederlandwereldwijd.
 * Kleuren zijn met het oog bepaald uit voorbeeldafbeeldingen, niet uit een
 * huisstijldocument — laat ze bevestigen door communicatie voordat hier iets
 * echt mee gepubliceerd wordt. Zie README.md.
 *
 * Waarom een .js en geen .json: de pagina moet ook werken als je index.html
 * gewoon dubbelklikt (file://). Browsers blokkeren dan fetch() naar een los
 * JSON-bestand. Als JS-bestand werkt het overal, en het blijft even leesbaar.
 *
 * Maten staan in verhoudingen van de breedte (0-1), niet in pixels. Zo klopt
 * hetzelfde sjabloon zowel op 1080 als op 1200 pixels breed.
 */

const HUISSTIJL = {
  blauw: '#0c6bb3',        // het blauwe tekstvlak
  donkerblauw: '#123a63',  // koptekst op een wit vlak
  middenblauw: '#1a73b8',  // subtekst op een wit vlak
  wit: '#ffffff',
  papier: '#ffffff',       // achtergrond van de hele post
};

/*
 * Het lettertype. De echte huisstijl gebruikt een licentieplichtig lettertype
 * dat we niet mogen meeleveren in een publieke repo. Staat het op de computer
 * van de redacteur geïnstalleerd, dan pakt de browser het vanzelf; anders valt
 * hij terug op een vergelijkbare humanistische schreefloze.
 */
const LETTERTYPE =
  '"RijksoverheidSansWebText", "Rijksoverheid Sans", "Segoe UI", ' +
  'system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';

const TEMPLATES = {
  lettertype: LETTERTYPE,
  papier: HUISSTIJL.papier,

  /* Exportmaten per platform. Instagram schaalt alles boven 1080 px breed zelf
     terug; Facebook adviseert minimaal 1200 px breed. Verandert Meta dit, dan
     pas je hier één getal aan. */
  platforms: {
    instagram: {
      label: 'Instagram',
      maten: { vierkant: [1080, 1080], staand: [1080, 1350] },
    },
    facebook: {
      label: 'Facebook',
      maten: { vierkant: [1200, 1200], staand: [1200, 1500] },
    },
  },

  formats: {
    vierkant: { label: 'Vierkant', verhoudingLabel: '1:1' },
    staand: { label: 'Staand', verhoudingLabel: '4:5' },
  },

  /* Vaste maten van het stramien, als deel van de breedte. */
  stramien: {
    marge: 0.031,          // witruimte rond de hele post
    hoekGroot: 0.068,      // de opvallende afgeronde hoek
    hoekKlein: 0.015,      // de rustige hoeken
    paddingZij: 0.048,     // tekst tot de rand van het tekstvlak
    paddingBoven: 0.052,
    paddingOnder: 0.058,
    tussenKopEnSub: 0.006,
    maxTekstvlak: 0.46,    // het tekstvlak mag nooit meer dan dit deel van
                           // de hoogte pakken; daarna verkleint de tekst
  },

  typografie: {
    kop: { grootte: 0.055, gewicht: 700, regelhoogte: 1.14 },
    sub: { grootte: 0.049, gewicht: 400, regelhoogte: 1.16 },
    minSchaal: 0.68,       // zover mag de tekst krimpen om te passen
  },

  /*
   * De drie stijlen. Per stijl: waar het tekstvlak staat, welke kleuren, en
   * welke hoeken groot afgerond zijn. Hoeken: lb = linksboven, rb = rechtsboven,
   * ro = rechtsonder, lo = linksonder. 'groot' | 'klein' | 'recht'.
   */
  stijlen: {
    blauwOnder: {
      label: 'Blauw vlak onder',
      positie: 'onder',
      vlakKleur: HUISSTIJL.blauw,
      kopKleur: HUISSTIJL.wit,
      subKleur: HUISSTIJL.wit,
      fotoHoeken: { lb: 'klein', rb: 'klein', ro: 'recht', lo: 'recht' },
      vlakHoeken: { lb: 'recht', rb: 'recht', ro: 'klein', lo: 'groot' },
      decoratieHoek: 'rechtsonder',
    },
    blauwBoven: {
      label: 'Blauw vlak boven',
      positie: 'boven',
      vlakKleur: HUISSTIJL.blauw,
      kopKleur: HUISSTIJL.wit,
      subKleur: HUISSTIJL.wit,
      fotoHoeken: { lb: 'recht', rb: 'recht', ro: 'groot', lo: 'klein' },
      vlakHoeken: { lb: 'klein', rb: 'klein', ro: 'recht', lo: 'recht' },
      decoratieHoek: 'rechtsonder',
    },
    witOnder: {
      label: 'Wit vlak onder',
      positie: 'onder',
      vlakKleur: HUISSTIJL.papier,   // geen zichtbaar vlak, tekst op wit
      kopKleur: HUISSTIJL.donkerblauw,
      subKleur: HUISSTIJL.middenblauw,
      fotoHoeken: { lb: 'klein', rb: 'klein', ro: 'klein', lo: 'groot' },
      vlakHoeken: { lb: 'recht', rb: 'recht', ro: 'recht', lo: 'recht' },
      decoratieHoek: 'linksboven',
    },
  },

  /* De dunne witte cirkellijnen over de foto. Middelpunt en straal zijn deel
     van de fotobreedte, gerekend vanaf de gekozen hoek. */
  decoratie: {
    aan: true,
    lijndikte: 0.0028,
    kleur: 'rgba(255,255,255,0.85)',
    cirkels: [
      { x: 0.12, y: 0.16, r: 0.30 },
      { x: 0.06, y: 0.05, r: 0.14 },
    ],
  },
};
