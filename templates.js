/*
 * templates.js — het sjabloonsysteem.
 *
 * Alle waarden hieronder komen uit de officiële PowerPoint-toolkit
 * (NWW_PPT_template_Posten_toolkit_socials_v1). Het PPT-canvas is 1440 × 1800 px
 * (4:5); maten zijn daaruit omgerekend naar verhoudingen van de breedte, zodat
 * hetzelfde sjabloon klopt op 1080, 1200 of welke exportmaat dan ook.
 *
 * Waarom een .js en geen .json: de pagina moet ook werken als je index.html
 * gewoon dubbelklikt (file://). Browsers blokkeren dan fetch() naar een los
 * JSON-bestand. Als JS-bestand werkt het overal, en het blijft even leesbaar.
 */

/* Themakleuren uit de toolkit. */
const HUISSTIJL = {
  blauw: '#007BC7',        // hoofdkleur; koptekst en het diepblauwe vlak
  lichtblauw: '#C7E5F3',   // het tekstvlak in de toolkit
  donkerblauw: '#154173',  // bodytekst
  middenblauw: '#01689B',
  zacht: '#8FCAE7',
  wit: '#FFFFFF',
};

/*
 * De toolkit gebruikt RijksSansVF. Dat lettertype is licentieplichtig en staat
 * daarom niet in deze publieke repo. Heeft de redacteur het geïnstalleerd — wat
 * op een werklaptop met de huisstijlpakketten zo is — dan pakt de browser het
 * vanzelf. Anders valt hij terug op een vergelijkbare schreefloze.
 */
const LETTERTYPE =
  '"RijksSansVF", "Rijksoverheid Sans", "Segoe UI", system-ui, ' +
  '-apple-system, "Helvetica Neue", Arial, sans-serif';

const TEMPLATES = {
  lettertype: LETTERTYPE,
  papier: HUISSTIJL.wit,
  kleuren: HUISSTIJL,

  /* Exportmaten per platform. Instagram schaalt alles boven 1080 px breed zelf
     terug; Facebook adviseert minimaal 1200 px breed. */
  platforms: {
    instagram: {
      label: 'Instagram',
      maten: { staand: [1080, 1350], vierkant: [1080, 1080] },
    },
    facebook: {
      label: 'Facebook',
      maten: { staand: [1200, 1500], vierkant: [1200, 1200] },
    },
  },

  formats: {
    staand: { label: 'Staand', verhoudingLabel: '4:5', uitToolkit: true },
    // De toolkit beschrijft alleen 4:5. Bij vierkant houden we het tekstvlak
    // even hoog in pixels en levert de foto de ruimte in.
    vierkant: { label: 'Vierkant', verhoudingLabel: '1:1', uitToolkit: false },
  },

  /* Stramien, als deel van de breedte. Uit de toolkit: marge 51 px en
     tekstinspringing 83 px op een canvas van 1440 px breed. */
  stramien: {
    marge: 0.035417,
    paddingZij: 0.057639,
    tussenKopEnSub: 0.022,
    // round1Rect met adj 9492/100000: de straal is 9,492% van de kortste zijde
    // van de vorm. Precies één hoek is afgerond — rechtsonder.
    hoekFactor: 0.09492,
    // De toolkit tekent een vast tekstvlak van een halve pagina. In de
    // echte posts hugt het vlak de tekst. Met true groeit het vlak mee met
    // de tekst, met de toolkithoogte als plafond; met false krijg je exact
    // de vaste hoogte uit de toolkit.
    vlakKrimpt: true,
  },

  /* Korpsgroottes uit de toolkit, omgerekend van punten naar deel van de
     breedte (66pt = 88px op 1440px breed). De toolkit schrijft voor: hou je
     aan deze groottes en aan het maximum aantal regels. */
  korps: {
    pt66: 0.061111,
    pt54: 0.05,
    pt40: 0.037037,
    pt30: 0.027778,
    pt24: 0.022222,
  },

  regelhoogte: { kop: 1.15, sub: 1.2 },

  /*
   * De stijlen, één op één overgenomen uit de sjabloonpagina's van de toolkit.
   * `vlakHoogte` is de hoogte van het tekstvlak als deel van de BREEDTE, zodat
   * het vlak bij elk formaat even hoog blijft en de foto de rest krijgt.
   */
  stijlen: {
    fotoBovenVlak: {
      label: 'Foto boven, lichtblauw vlak',
      bron: 'Photo + Text + Link',
      positie: 'onder',
      vlakHoogte: 0.591667,
      vlakKleur: HUISSTIJL.lichtblauw,
      paddingBoven: 0.059028,
      paddingOnder: 0.0625,
      kop: { grootte: 0.05, maxRegels: 3, kleur: HUISSTIJL.blauw, gewicht: 700 },
      sub: { grootte: 0.027778, maxRegels: 1, kleur: HUISSTIJL.blauw, gewicht: 400 },
    },

    fotoBovenDiepblauw: {
      label: 'Foto boven, diepblauw vlak',
      bron: 'Variant zoals op het Instagramaccount',
      positie: 'onder',
      vlakHoogte: 0.591667,
      vlakKleur: HUISSTIJL.blauw,
      paddingBoven: 0.059028,
      paddingOnder: 0.0625,
      kop: { grootte: 0.05, maxRegels: 3, kleur: HUISSTIJL.wit, gewicht: 700 },
      sub: { grootte: 0.037037, maxRegels: 2, kleur: HUISSTIJL.wit, gewicht: 400 },
    },

    vlakBovenFoto: {
      label: 'Tekst boven, foto onder',
      bron: 'Text + photo_1',
      positie: 'boven',
      vlakHoogte: 0.39375,
      vlakKleur: HUISSTIJL.wit,
      paddingBoven: 0.120833,
      paddingOnder: 0.02,
      kop: { grootte: 0.05, maxRegels: 2, kleur: HUISSTIJL.blauw, gewicht: 700 },
      sub: { grootte: 0.037037, maxRegels: 2, kleur: HUISSTIJL.donkerblauw, gewicht: 400 },
    },

    fotoBovenWit: {
      label: 'Foto boven, tekst op wit',
      bron: 'Text + photo_2',
      positie: 'onder',
      vlakHoogte: 0.590972,
      vlakKleur: HUISSTIJL.wit,
      paddingBoven: 0.075,
      paddingOnder: 0.06,
      kop: { grootte: 0.061111, maxRegels: 2, kleur: HUISSTIJL.blauw, gewicht: 700 },
      sub: { grootte: 0.037037, maxRegels: 5, kleur: HUISSTIJL.donkerblauw, gewicht: 400 },
    },

    tekstOpFoto: {
      label: 'Tekst op de foto',
      bron: 'Text + big photo',
      positie: 'opFoto',
      vlakHoogte: 0,
      vlakKleur: null,
      paddingBoven: 0.077083,
      paddingOnder: 0,
      kop: { grootte: 0.05, maxRegels: 2, kleur: HUISSTIJL.wit, gewicht: 700 },
      sub: { grootte: 0.037037, maxRegels: 2, kleur: HUISSTIJL.wit, gewicht: 400 },
    },
  },
};
