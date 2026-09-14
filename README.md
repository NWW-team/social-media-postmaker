# Social Media Opmaaktool

Zet een foto in de huisstijl en download hem op de juiste maat voor Instagram of
Facebook — zonder tussenkomst van het social mediabureau.

Bedoeld voor redacteuren die zelf hun posts bedenken, maar voor de opmaak nu nog
moeten wachten. Zie [STRATEGY.md](STRATEGY.md) voor het waarom.

> **Prototype.** Kleuren, korpsgroottes, marges en hoekafronding komen uit de
> officiële PowerPoint-toolkit (*NWW_PPT_template_Posten_toolkit_socials_v1*).
> Het huisstijllettertype zit er niet in — zie hieronder. Laat een export
> controleren door communicatie voordat hier echt mee gepubliceerd wordt.

## Gebruiken

Open de gepubliceerde pagina, of download `index.html` en dubbelklik erop. Werkt
in Edge en Chrome, zonder installatie en zonder inloggen.

1. Kies platform en formaat.
2. Kies een stijl.
3. Sleep een foto in het vak, plak met Ctrl+V, of klik **Bestand kiezen**.
   Geen foto bij de hand? Klik **Voorbeeldfoto**.
4. Sleep de foto in het voorbeeld om de uitsnede te kiezen; zoom met de schuif
   of het scrollwiel.
5. Typ de kop en de subtekst. Elke stijl heeft een maximum aantal regels uit
   de toolkit; ga je eroverheen, dan zie je dat meteen.
6. Klik **PNG downloaden**.

## Waar blijft mijn foto?

Op je eigen computer. Er is geen server: de pagina is alleen HTML, CSS en
JavaScript, en alle bewerking gebeurt in je browser. De foto wordt niet
geüpload, niet opgeslagen en niet gelogd. Sluit je het tabblad, dan is alles weg.

Je kunt dat zelf controleren: zet je netwerk uit en ververs de pagina — hij
blijft gewoon werken.

## Exportmaten

De vorm hangt aan het formaat, de pixelmaat aan het platform. Instagram schaalt
alles boven 1080 px breed zelf terug; Facebook adviseert minimaal 1200 px breed.

|                  | Instagram   | Facebook    |
| ---------------- | ----------- | ----------- |
| Vierkant (1:1)   | 1080 × 1080 | 1200 × 1200 |
| Staand (4:5)     | 1080 × 1350 | 1200 × 1500 |

## Wat er uit de toolkit is overgenomen

Het PowerPoint-canvas is 1440 × 1800 px (4:5). Alle maten zijn daaruit
omgerekend naar verhoudingen van de breedte, zodat hetzelfde sjabloon klopt op
1080 én 1200 px breed.

| Uit de toolkit | Waarde |
| -------------- | ------ |
| Hoofdkleur | `#007BC7` |
| Tekstvlak licht | `#C7E5F3` |
| Bodytekst | `#154173` |
| Overig in het palet | `#01689B`, `#8FCAE7` |
| Lettertype | RijksSansVF |
| Marge rondom | 51 px → 3,54% van de breedte |
| Tekstinspringing | 83 px → 5,76% van de breedte |
| Afgeronde hoek | `round1Rect`, straal 9,492% van de kortste zijde, **één** hoek: rechtsonder |
| Korpsgroottes | 66 / 54 / 40 / 30 / 24 pt |

De vijf stijlen komen één op één van de sjabloonpagina's: *Photo + Text + Link*,
*Text + photo_1*, *Text + photo_2*, *Text + big photo*, plus de diepblauwe
variant zoals die op het Instagramaccount staat.

De toolkit schrijft voor: **hou je aan de korpsgrootte en aan het maximum aantal
regels**. Daarom verkleint de tool de tekst niet stiekem — hij kapt af en meldt
het. Twee bewuste afwijkingen:

- **Het tekstvlak groeit mee met de tekst**, met de vaste toolkithoogte als
  plafond. De sjabloonpagina's tekenen een vlak van een halve pagina, maar in de
  echte posts hugt het vlak de tekst. Zet `stramien.vlakKrimpt` op `false` voor
  exact de toolkithoogte.
- **Vierkant (1:1) staat niet in de toolkit.** Daar houdt het tekstvlak dezelfde
  hoogte in pixels en levert de foto de ruimte in.

## De opmaak aanpassen

Alles wat met vormgeving te maken heeft staat in **`templates.js`**. Daar pas je
aan, nergens anders:

| Wat                                  | Waar in `templates.js` |
| ------------------------------------ | ---------------------- |
| Kleuren                              | `HUISSTIJL`            |
| Lettertype                           | `LETTERTYPE`           |
| Marge, inspringing, hoekafronding    | `TEMPLATES.stramien`   |
| Korpsgroottes en regelhoogte         | `TEMPLATES.korps`, `TEMPLATES.regelhoogte` |
| De vijf stijlen en hun regellimieten | `TEMPLATES.stijlen`    |
| Exportmaten per platform             | `TEMPLATES.platforms`  |

Maten staan in verhoudingen van de breedte (0–1), niet in pixels. Zo klopt
hetzelfde sjabloon zowel op 1080 als op 1200 pixels breed.

Een stijl toevoegen is één blok in `TEMPLATES.stijlen` plus één knop in
`index.html`. Verder niets.

### Nog te doen

- **Lettertype**: RijksSansVF is licentieplichtig en staat daarom niet in deze
  publieke repo. Staat hij geïnstalleerd op de werklaptop, dan pakt de browser
  hem vanzelf — `LETTERTYPE` noemt hem als eerste keuze. Anders valt hij terug
  op een vergelijkbare letter en wijkt de regelval iets af.
- **Logo** ontbreekt nog.
- **Iconenset**: drie pictogrammen komen uit de toolkit (wereld, gesprek,
  megafoon). De rest zijn eenvoudige eigen tekeningen. In de posts op het
  account staan er meer, zoals het Nederlandkaartje en de brancard.
- **Controle** door communicatie of de export echt aan de huisstijl voldoet.

### Een pictogram toevoegen

Zet een nieuw item in `ICONEN` in `templates.js`. Twee vormen zijn toegestaan:

- een kant-en-klare data-URI (`data:image/png;base64,…`), of
- SVG-tekst, waarin `{kleur}` wordt vervangen door de huisstijlkleur.

> **Let op bij SVG:** zet altijd `width` én `height` op het `<svg>`-element, niet
> alleen een `viewBox`. Chrome vult een ontbrekende maat aan, maar Edge en
> Firefox tekenen zo'n SVG helemaal niet in een canvas — de badge blijft dan
> leeg. Hier is precies dat misgegaan.

De keuzelijsten in het scherm vullen zich vanzelf; er hoeft geen code aangepast
te worden.

## Publiceren

De pagina is een statische site. Publiceren via GitHub Pages:

Settings → Pages → Source: *Deploy from a branch* → Branch: `main`, map `/ (root)`.

Na een minuut staat hij op `https://nww-team.github.io/social-media-postmaker/`.
Let op: de repo is openbaar, dus die pagina is voor iedereen zichtbaar.

## Bestanden

| Bestand        | Wat erin staat                                   |
| -------------- | ------------------------------------------------ |
| `index.html`   | Het scherm en alle opmaak van de pagina zelf     |
| `app.js`       | Foto inpassen, slepen, zoomen, tekenen, exporteren |
| `templates.js` | De huisstijl: kleuren, stramien, stijlen, maten  |
| `STRATEGY.md`  | Waarom dit product bestaat                       |

Geen build, geen dependencies, geen installatie.

## Wat er nog niet in zit

Stories en Reels (9:16), webtekst omzetten naar social tekst, concepten
opslaan, rechtstreeks posten, een koppeling met een beeldbank, en de
icoonbadges en cirkellijnen uit de toolkit.
