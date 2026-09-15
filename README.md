# Social Media Opmaaktool

Zet een foto in de huisstijl en download hem op de juiste maat voor Instagram of
Facebook — zonder tussenkomst van het social mediabureau.

Bedoeld voor redacteuren die zelf hun posts bedenken, maar voor de opmaak nu nog
moeten wachten. Zie [STRATEGY.md](STRATEGY.md) voor het waarom.

Het scherm staat in de **Rijkshuisstijl**: kleuren, letters, afstanden, knoppen
en velden komen uit
[nl-design-system/rijkshuisstijl-community](https://github.com/nl-design-system/rijkshuisstijl-community),
onveranderd uit npm. Zie [De Rijkshuisstijl](#de-rijkshuisstijl) hieronder.

> **Prototype.** Kleuren, korpsgroottes, marges en hoekafronding komen uit de
> officiële PowerPoint-toolkit (*NWW_PPT_template_Posten_toolkit_socials_v1*).
> Het huisstijllettertype zit er niet in — zie hieronder. Laat een export
> controleren door communicatie voordat hier echt mee gepubliceerd wordt.

## Gebruiken

Open de gepubliceerde pagina en log in. Werkt in Edge en Chrome, zonder
installatie.

Alleen vooraf toegelaten accounts komen binnen; zelf een account aanmaken kan
niet. Heb je toegang nodig, vraag dan de beheerder je toe te voegen — zie
[supabase/LEESMIJ.md](supabase/LEESMIJ.md) stap 5.

> Dubbelklikken op een gedownloade `index.html` werkt sinds de koppeling met
> Supabase niet meer: de huisstijl komt uit de database en daar moet de pagina
> voor kunnen inloggen. Hetzelfde geldt voor offline werken.

1. Kies een kaart: platform en formaat in één klik, met de vorm en de
   exportmaat erop.
2. Kies een stijl. Op elke stijlkaart staat **jouw** foto en **jouw** tekst in
   die stijl — je vergelijkt de stijlen dus met je eigen post erin.
3. Sleep een foto in het vak, plak met Ctrl+V, of klik **Bestand kiezen**.
   Geen foto bij de hand? Klik **Voorbeeldfoto**.
4. Sleep de foto in het voorbeeld om de uitsnede te kiezen; zoom met de schuif
   of het scrollwiel.
5. Typ de kop en de subtekst. Elke stijl heeft een maximum aantal regels uit
   de toolkit; ga je eroverheen, dan zie je dat meteen.
6. Kies waar de cirkels met de icoonbadges staan: in een van de vier hoeken,
   of onderaan of bovenaan het midden.
7. Klik **PNG downloaden**.

Stap 2 laat de vijf kaarten zien wat elke stijl met jouw materiaal doet. Heb je
nog niets getypt, dan staat er voorbeeldtekst op de kaarten — zonder tekst is er
namelijk geen tekstvlak, en dan lijken alle stijlen op elkaar. Zodra je één van
de twee velden invult, staat overal je eigen tekst. Het grote voorbeeld en de
download krijgen die voorbeeldtekst nooit: die tonen wat je werkelijk downloadt.

De cirkelgroep staat in de huisstijl op één plek: linksonder, zoals op de
toolkitpagina's. Op het account staat diezelfde groep ook rechtsonder, bovenin
en onderaan het midden. Dat zijn geen andere tekeningen maar dezelfde,
gespiegeld om het midden van de foto — en zo rekent de tool ze ook uit. Eén
plek in Supabase levert dus zes plekken in het scherm, en past de huisstijl de
cirkels aan, dan schuiven alle zes mee.

Zolang je nog geen foto hebt gekozen, tekent de tool een verloop als plaatshouder — anders is er niets om de
witte koppen en de witte cirkellijnen tegen af te zetten en valt de opmaak niet
te beoordelen. Op het grote voorbeeld staat er dan **Nog geen foto gekozen** bij,
zodat de plaatshouder nooit voor een foto kan doorgaan.

## Waar blijft mijn foto?

Op je eigen computer. Het inpassen, bijsnijden en exporteren gebeurt volledig in
je browser; er gaat geen enkele pixel naar een server. Sluit je het tabblad, dan
is de foto weg.

Dat is geen belofte op erewoord maar een eigenschap van de code: `app.js` leest
je bestand met `FileReader`, tekent het op een `<canvas>` en exporteert dat
canvas. Er is geen upload-aanroep om te vergeten. Je kunt het zelf zien in het
tabblad **Netwerk** van de ontwikkelaarsconsole (`F12`): terwijl je sleept en
zoomt, gebeurt er niets.

Wat wél naar Supabase gaat:

| Gegeven | Wanneer |
| --- | --- |
| Je e-mailadres en wachtwoord | Bij inloggen |
| De huisstijl die je ophaalt | Bij het openen van de app |
| Naam, kop, subtekst en instellingen van een concept | Alleen als je op **Bewaren** klikt |

Een bewaard concept bevat dus een recept, geen plaatje. Open je het later, dan
sleep je je foto er opnieuw in.

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

De huisstijl stond in `templates.js`. Die staat er niet meer: hij zit nu in
Supabase, in de tabel `public.huisstijl`, achter de allowlist. Aanpassen doe je
in het dashboard, niet in deze repo.

Elke rij is één sleutel met een stuk JSON:

| Sleutel | Wat erin staat |
| --- | --- |
| `kleuren` | De huisstijlkleuren |
| `lettertype` | De letterstapel |
| `stramien` | Marge, inspringing, hoekafronding |
| `korps`, `regelhoogte` | Korpsgroottes en regelhoogte |
| `stijlen` | De vijf stijlen en hun regellimieten |
| `platforms`, `formats` | Exportmaten en verhoudingen |
| `decoratie`, `iconen` | De cirkellijnen en de badges |
| `papier` | De achtergrondkleur van de export |

Maten staan in verhoudingen van de breedte (0–1), niet in pixels. Zo klopt
hetzelfde sjabloon zowel op 1080 als op 1200 pixels breed.

Een waarde wijzigen gaat via **SQL Editor**:

```sql
update public.huisstijl
set waarde = jsonb_set(waarde, '{blauw}', '"#0055AA"')
where sleutel = 'kleuren';
```

Een stijl toevoegen is één blok in de sleutel `stijlen`. De knoppen in het
scherm komen daar vanzelf uit; `index.html` hoeft niet aangepast te worden.

Er is met opzet **geen** schrijfpolicy op deze tabel: vanuit de browser kan
niemand de huisstijl veranderen, ook een toegelaten redacteur niet.

### Nog te doen

- **Lettertype**: RijksSansVF is licentieplichtig en staat daarom niet in deze
  publieke repo. Staat hij geïnstalleerd op de werklaptop, dan pakt de browser
  hem vanzelf — de tokens noemen hem als eerste keuze. Anders valt hij terug op
  Fira Sans, de open letter die de Rijkshuisstijl Community daar zelf voor
  meelevert; die staat in `vendor/rijkshuisstijl/fonts/`. De regelval wijkt dan
  iets af.
- **Logo** ontbreekt nog. In het scherm staat op die plek een zichtbare
  gestippelde plaatshouder: liever een leeg vak dat zegt dat er iets hoort te
  staan, dan een tekstlogo dat voor het echte kan doorgaan.
- **Iconenset**: drie pictogrammen komen uit de toolkit (wereld, gesprek,
  megafoon). De rest zijn eenvoudige eigen tekeningen. In de posts op het
  account staan er meer, zoals het Nederlandkaartje en de brancard.
- **Controle** door communicatie of de export echt aan de huisstijl voldoet.

### Een pictogram toevoegen

Voeg een item toe aan de sleutel `iconen` in de tabel `public.huisstijl`. Twee
vormen zijn toegestaan:

- een kant-en-klare data-URI (`data:image/png;base64,…`), of
- SVG-tekst, waarin `{kleur}` wordt vervangen door de huisstijlkleur.

> **Let op bij SVG:** zet altijd `width` én `height` op het `<svg>`-element, niet
> alleen een `viewBox`. Chrome vult een ontbrekende maat aan, maar Edge en
> Firefox tekenen zo'n SVG helemaal niet in een canvas — de badge blijft dan
> leeg. Hier is precies dat misgegaan.

De keuzelijsten in het scherm vullen zich vanzelf; er hoeft geen code aangepast
te worden.

## De Rijkshuisstijl

Het scherm gebruikt de Rijkshuisstijl, het bouwt hem niet na. In
`vendor/rijkshuisstijl/` staan de uitvoerbestanden van
[nl-design-system/rijkshuisstijl-community](https://github.com/nl-design-system/rijkshuisstijl-community),
onveranderd uit npm: de componenten-CSS en de design tokens. `index.html` bevat
daarnaast alleen de indeling van dít scherm en een browserreset — de
componenten-CSS is volledig klassegebonden en raakt kale elementen met opzet
niet aan.

Ze staan in de repo en komen bewust **niet** van een CDN, om dezelfde reden als
`vendor/supabase-js.js`: werknetwerken blokkeren CDN's regelmatig, en dan staat
er een pagina zonder opmaak. Versies, herkomst en licenties:
[vendor/rijkshuisstijl/LEESMIJ.md](vendor/rijkshuisstijl/LEESMIJ.md).

**Lintkleur: hemelblauw.** De toolkit gebruikt `#007BC7`, en van de zes
lintkleuren in de Rijkshuisstijl ligt hemelblauw daar het dichtst bij. Een
andere kiezen is twee regels: een ander tokenbestand in de `<link>` en een
andere klasse op `<body>`. De tokens staan namelijk niet op `:root` maar op een
klasse — zonder die klasse is elke `--rhc-`variabele leeg en valt de pagina
terug op de kale browserstijl.

**De indeling** is gekozen uit vijf voorstellen; zie
[mockups/README.md](mockups/README.md). Het werd *Keuzekaarten*: platform en
formaat als kaarten met de vorm erop, en de vijf stijlen als kaarten met een
echt voorbeeld — geen tekening die erop lijkt, maar dezelfde tekencode als de
export, met jouw foto en jouw tekst erin. Wat dat kostte, staat in die mockup
ook beschreven: het is de langste pagina van de vijf.

Let op bij hergebruik: `components-css` en het lettertype zijn EUPL-1.2, maar de
**design tokens zijn niet open source**. Op het logo en de huisstijl rust
auteursrecht; gebruik is voorbehouden aan de Rijksoverheid en aan partijen die
voor de Rijksoverheid werken.

## Toegang

Alleen vooraf toegelaten accounts kunnen de tool gebruiken. Inrichten:
[supabase/LEESMIJ.md](supabase/LEESMIJ.md). Nalopen of het werkt:
[TESTEN.md](TESTEN.md).

### Wat wél is afgeschermd

De **huisstijl** en de **opgeslagen concepten**. Die staan in Supabase achter
row level security. Elke policy toetst twee dingen: ben je wie je zegt te zijn
(`auth.uid()`), en sta je op de allowlist (`public.is_toegestaan()`). Die toets
draait in Postgres, bij elk verzoek opnieuw — niet in de browser, waar de
bezoeker hem zou kunnen omzeilen.

Gevolg: haal je met de ontwikkelaarsconsole het inlogscherm weg, dan zie je de
app-onderdelen en verder niets. Geen stijl, geen kleur, geen maat, een blanco
canvas. De tool is zonder huisstijl geen tool.

Toegang intrekken is één regel SQL en werkt direct, ook bij een lopende sessie.

### Wat níét is afgeschermd

**De bestanden zelf.** `index.html`, `app.js`, `auth.js` en `config.js` zijn
voor iedereen op te vragen, en dat blijft zo. GitHub Pages serveert statische
bestanden zonder enige sessiecontrole; er is geen plek waar zo'n controle in
past. Een inlogscherm in HTML is een scherm, geen slot.

Dat is bewust en het is geen lek: in die bestanden staat niets geheims. De
Supabase-URL en de publishable key horen publiek te zijn — ze zeggen alleen
wélk project je aanspreekt, niet wie je bent.

Wil je dat ook de pagina zelf privé is, dan is er een voorziening nodig die
GitHub Pages niet heeft: **edge-authenticatie**, een laag die de sessie
controleert vóórdat er één byte HTML wordt geleverd. Opties:

| Waar | Hoe | Kanttekening |
| --- | --- | --- |
| Cloudflare Pages + Cloudflare Access | Allowlist op e-mailadres, geen codewijziging | Gratis tot 50 gebruikers; meest passend hier |
| Netlify of Vercel | Edge-middleware die de Supabase-sessie verifieert | Vraagt wel code |
| GitHub Pages privé | Repo privé zetten | Alleen met GitHub Enterprise Cloud; bezoekers moeten org-lid zijn |

### Een openstaand punt

De huisstijl-config heeft in deze **openbare** repo gestaan en staat nog in de
Git-geschiedenis. Hem er nu uit halen beperkt wat er in de toekomst bij komt,
maar haalt niet terug wat al gepubliceerd is. Wil je dat ook dichtzetten, dan
moet de repo privé worden of de geschiedenis herschreven. Dat is een aparte
beslissing; hij is nog niet genomen.

## Publiceren

De pagina is een statische site. Publiceren via GitHub Pages:

Settings → Pages → Source: *Deploy from a branch* → Branch: `main`, map `/ (root)`.

Na een minuut staat hij op `https://nww-team.github.io/social-media-postmaker/`.

Vul vóór het publiceren `config.js` in — zonder die twee waarden toont de
pagina alleen een foutmelding. Zie [supabase/LEESMIJ.md](supabase/LEESMIJ.md)
stap 6.

## Bestanden

| Bestand | Wat erin staat |
| --- | --- |
| `index.html` | Het scherm, het inlogscherm en de indeling van de pagina |
| `app.js` | Foto inpassen, slepen, zoomen, tekenen, exporteren |
| `auth.js` | Inloggen, uitloggen, huisstijl en concepten ophalen |
| `config.js` | De publieke Supabase-URL en publishable key |
| `supabase/01_schema.sql` | Tabellen, RLS en policies — hier ligt de toegangscontrole |
| `supabase/03_controle.sql` | Nalopen of RLS op elke tabel aan staat |
| `supabase/LEESMIJ.md` | Wat je zelf in het Supabase-dashboard doet |
| `TESTEN.md` | Testdraaiboek voor de toegangscontrole |
| `vendor/supabase-js.js` | De officiële Supabase-client, meegeleverd |
| `vendor/rijkshuisstijl/` | De Rijkshuisstijl Community, meegeleverd: tokens, componenten-CSS, lettertype |
| `mockups/` | De vijf indelingsvoorstellen waaruit dit scherm gekozen is |
| `tests/poort.test.js` | Geautomatiseerde test van de poortlogica |
| `STRATEGY.md` | Waarom dit product bestaat |

Geen build, geen package.json, geen installatie.

De Supabase-client en de Rijkshuisstijl staan in `vendor/` en komen bewust
**niet** van een CDN.
Werknetwerken blokkeren CDN's als `cdn.jsdelivr.net` regelmatig, en dan laadt
de client niet en verschijnt er geen inlogscherm — dat is precies wat er
gebeurde; zonder de huisstijl erbij zou hetzelfde gebeuren met de opmaak. Nu
komt alles van hetzelfde domein als de pagina zelf. Zie
[vendor/LEESMIJ.md](vendor/LEESMIJ.md) en
[vendor/rijkshuisstijl/LEESMIJ.md](vendor/rijkshuisstijl/LEESMIJ.md) voor de
versies en hoe je ze bijwerkt.

Het enige verzoek dat nog naar buiten gaat, is naar je eigen Supabase-project.

`tests/poort.test.js` is optioneel en heeft Node en Playwright nodig. Je hebt
het niet nodig om de app te gebruiken of aan te passen.

### Sleutels die hier nooit in horen

De service-role key, de secret key, het databasewachtwoord en het JWT-secret.
De eerste twee negeren álle policies. Zet ze niet in `config.js`, niet in een
ander bestand, en niet in een chatbericht. Zie
[supabase/LEESMIJ.md](supabase/LEESMIJ.md) stap 6 voor wat je doet als er toch
één is rondgegaan.

## Wat er nog niet in zit

Stories en Reels (9:16), webtekst omzetten naar social tekst, rechtstreeks
posten, en een koppeling met een beeldbank.

Concepten opslaan zit er sinds de Supabase-koppeling wél in — per redacteur
afgeschermd, en zonder de foto.
