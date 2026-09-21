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
> Het huisstijllettertype zit niet in deze repo maar in de afgeschermde
> opslag — zie [Het huisstijllettertype](#het-huisstijllettertype). Laat een
> export controleren door communicatie voordat hier echt mee gepubliceerd
> wordt.

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
   of onderaan of bovenaan het midden. Staat het pictogram dat je nodig hebt
   niet in de lijst, sleep er dan bij **Eigen iconen** zelf een in het vak —
   zie [Zelf een icoon toevoegen](#zelf-een-icoon-toevoegen).
7. Te groot of te klein? Klik in de werkbalk boven het veld op **&minus;** of
   **+**: dat zet de hele kop of subtekst een maat op. Wil je één woord
   uitlichten, selecteer het dan en klik op **B** of **I**. Je ziet onder het
   voorbeeld waarin je van de stijl afwijkt; **Opmaak verwijderen** zet het hele
   veld weer terug.
8. Klik **PNG downloaden**.

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

Hetzelfde geldt voor een icoon dat je zelf toevoegt: dat wordt net als de foto
in je browser gelezen en getekend, en gaat niet naar Supabase. Een concept
onthoudt alleen de náám van het icoon. Sluit je het tabblad, dan is je eigen
icoon weg en kies je het bij het openen van het concept opnieuw.

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
het. Vier bewuste afwijkingen:

- **Het tekstvlak groeit mee met de tekst**, met de vaste toolkithoogte als
  plafond. De sjabloonpagina's tekenen een vlak van een halve pagina, maar in de
  echte posts hugt het vlak de tekst. Zet `stramien.vlakKrimpt` op `false` voor
  exact de toolkithoogte.
- **Vierkant (1:1) staat niet in de toolkit.** Daar houdt het tekstvlak dezelfde
  hoogte in pixels en levert de foto de ruimte in.
- **De korpsgroottes van de twee "foto boven"-stijlen komen uit de echte posts,
  niet van de sjabloonpagina.** Zie [Hoe groot is de letter
  eigenlijk?](#hoe-groot-is-de-letter-eigenlijk) hieronder.
- **De letter is bij te stellen.** Boven elk tekstveld staat een werkbalk, en
  die kent twee soorten knoppen:

  **&minus; en +** zetten het **hele veld** een maat kleiner of groter, langs de
  vijf korpsgroottes hierboven. Daar hoef je niets voor te selecteren: een kop
  heeft één maat, dat is wat een kop tot een kop maakt. Het vakje ertussen laat
  zien waar je staat; aan het eind van de ladder gaat de knop uit.
  **Opmaak verwijderen** zet het hele veld terug zoals de stijl het
  voorschrijft. Kom je met &minus; of + precies op de maat van de stijl uit, dan
  krijgt het veld géén eigen maat maar volgt het de stijl weer — anders zou het
  veld niet meer meeschuiven als je van stijl wisselt.

  **B en I** werken wél op een selectie: die zijn er juist om één woord uit te
  lichten. Wijk je van de stijl af, dan staat dat met zoveel woorden onder het
  voorbeeld.

  **B is een schakelaar, geen "maak vetter".** In de meeste stijlen is de kop al
  vet; daar haalt B het vet er dus af. De knop laat met zijn ingedrukte stand
  zien wat er staat.

  Wat de tool hier bewaakt: de regel waarop de tekst wordt afgebroken is
  dezelfde waarmee hij wordt getekend, een woord dat half is opgemaakt blijft
  één woord, de regelhoogte volgt het grootste stuk in die regel, en het maximum
  aantal regels blijft gelden. Een grotere letter betekent dus eerder een
  afkapmelding, niet tekst die over de rand loopt.

  Schuin komt uit de schuine snede van RijksSansVF, die de tool meelaadt uit de
  afgeschermde opslag. Lukt dat niet, dan valt de tekst terug op Fira Sans en
  maakt de browser daar zelf een schuine van.

### Hoe groot is de letter eigenlijk?

De sjabloonpagina's van de toolkit en de posts zoals ze werkelijk op het
Instagramaccount staan, gebruiken niet dezelfde korpsgrootte. De posts zijn een
maat groter. Dat is nagemeten en niet geschat, op drie echte posts (de
zorgverzekeringscheck, het overlijden in het buitenland, het contante geld):

De tekstkolom is op 1080 px breed **879 px** (`marge` + `paddingZij` aan beide
kanten). Zet je de kop van de eerste post in RijksSansVF, dan is
*"Ben ik in het buitenland verzekerd"* bij 54 pt **782 px** — dat past, en de
regel zou dus nooit na "buitenland" afbreken. Bij 66 pt is diezelfde regel
**956 px**: te breed, en de kop breekt precies waar hij in de post breekt.
Alleen 66 pt geeft de regelval van de post. Dezelfde rekensom op de subtekst van
de derde post wijst 54 pt aan.

| | Sjabloonpagina | Echte posts |
| --- | --- | --- |
| Kop | 54 pt | **66 pt** |
| Subtekst | 30 tot 40 pt | **54 pt** |

De twee stijlen met een gekleurd vlak onder de foto (*Foto boven, lichtblauw
vlak* en *Foto boven, diepblauw vlak*) staan daarom op 66/54 pt. De andere drie
stijlen houden de maten van hun sjabloonpagina, want daar is geen post van om
tegen te meten. Eén maat terug is één klik op **&minus;**.

## De opmaak aanpassen

De huisstijl stond in `templates.js`. Die staat er niet meer: hij zit nu in
Supabase, in de tabel `public.huisstijl`, achter de allowlist. Aanpassen doe je
in het dashboard, niet in deze repo.

### Tekst is een reeks stukken

Sinds de werkbalk is de tekst van een veld geen string meer maar een reeks
**stukken**: aaneengesloten lappen tekst met dezelfde opmaak.

```js
[ { tekst: 'Hoe kan ik een ', korps: null,   gewicht: null, schuin: false },
  { tekst: 'nieuw paspoort',  korps: 'pt66', gewicht: 700,  schuin: true  } ]
```

`korps` en `gewicht` zijn `null` als het stuk de stijl volgt — iets anders dan
"toevallig dezelfde maat als de stijl". Wissel je van stijl, dan schuift een
stuk met `null` mee en een stuk met `pt66` niet.

Het tekstveld is een weergave van dat model, niet andersom. De DOM van een
`contenteditable` zit vol knopen die de browser er zelf in legt; die zouden
anders allemaal ook op het canvas moeten kloppen. Bij het typen leest de app de
DOM uit zonder het veld opnieuw op te bouwen — dat zou de cursor verplaatsen —
en alleen na een klik op de werkbalk wordt het veld opnieuw opgebouwd, met de
selectie terug op dezelfde tekens.

Een bewaard concept van vóór de werkbalk bevat een gewone string. Die wordt bij
het openen één stuk zonder opmaak, precies zoals hij bewaard is.

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

### Het huisstijllettertype

RijksSansVF is licentieplichtig en staat daarom **niet** in deze publieke repo.
Hij staat in Supabase Storage, in de besloten bak `huisstijl-font`, achter
precies dezelfde toets als de huisstijl zelf: alleen een account op de allowlist
krijgt de bestanden. `huisstijlletter.js` haalt ze op na het inloggen en
registreert ze met `FontFace`, niet met een `@font-face`-regel — een CSS-url
zou het bestand zonder token opvragen, en dat weigert de opslag terecht.

Twee bestanden, allebei variabel over het gewicht (wght 200–800), dus alle
gewichten die de huisstijl gebruikt komen uit dezelfde twee bestanden:

| In de bak | Wat |
| --- | --- |
| `RijksSansWeb-Regular.woff2` | De rechte snede |
| `RijksSansWeb-Italic.woff2` | De schuine snede |

Komt de letter er niet door — geen toegang, nog niet geüpload, netwerk eruit —
dan draait de tool door op **Fira Sans**, de open letter die de Rijkshuisstijl
Community daar zelf voor meelevert; die staat in `vendor/rijkshuisstijl/fonts/`.
De regelval wijkt dan iets af. Staat RijksSansVF geïnstalleerd op de
werklaptop, dan pakt de browser die vanzelf: de tokens noemen hem als eerste
keuze.

Uploaden doe je in het dashboard, net als het vullen van de huisstijl: zie
[supabase/LEESMIJ.md](supabase/LEESMIJ.md) stap 9. Er is met opzet geen
schrijfpolicy op de bak — vanuit de browser kan niemand een lettertype
toevoegen of vervangen.

> Dit houdt de letter uit de openbare ruimte, niet uit de browser van wie hem
> mag gebruiken. Een ingelogde redacteur heeft het bestand per definitie
> binnengehaald en kan het daaruit opdiepen. Dat is bij de huisstijl niet
> anders: de grens ligt bij het account.

### Nog te doen

- **Logo** ontbreekt nog. Er stond een zichtbare gestippelde plaatshouder in de
  kopbalk; die is er op verzoek uit, dus de kopbalk draagt nu alleen de sessie.
  Komt het beeldmerk er, dan is dat de plek ervoor.
- **Iconenset**: de plaatshouders zijn eruit. In de huisstijl staan nu veertig
  officiële pictogrammen van Rijkshuisstijl.nl, plus de wereldbol — dat is het
  eigen beeldmerk en die zat niet in de aangeleverde set, dus die is bewust
  blijven staan onder de naam *Wereld (NederlandWereldwijd)*. Het
  Nederlandkaartje met het hoofd, dat hier met de hand niet na te maken was,
  zit er nu wél bij als *Nederland*. Zie `supabase/06_iconen.sql` voor wat er
  precies in de tabel is gezet. De keuzelijsten staan op alfabet.
- **Controle** door communicatie of de export echt aan de huisstijl voldoet.

### Zelf een icoon toevoegen

Dit doet de redacteur zelf, zonder beheerder. Onder de twee keuzelijsten staat
**Eigen iconen**: sleep er een bestand in of klik op **Bestand kiezen**, en het
icoon staat meteen in de grote badge én in beide keuzelijsten, onder het kopje
*Eigen iconen*. Met het kruisje haal je het weer weg; een badge die het gebruikte
valt dan terug op het eerste icoon uit de huisstijl.

Het 'i'tje naast de naam vertelt waar zo'n icoon vandaan komt: je kunt er een
downloaden van [Rijkshuisstijl.nl](https://www.rijkshuisstijl.nl/) en hier
uploaden om in de badges te gebruiken. Een SVG of PNG met een doorzichtige
achtergrond, tot 512 kB. De kleur van het bestand doet er niet toe: de tool
herkleurt elk eigen icoon naar de icoonkleur uit de huisstijl, precies zoals
dat al gebeurde bij de iconen die er al stonden.

Het bestand blijft op je eigen computer: het wordt met `FileReader` gelezen en
meteen getekend, precies zoals de foto, en er is geen upload-aanroep. Een
eigen icoon hoort dus bij dit tabblad en niet bij je account — een collega
ziet het niet, en na het sluiten is het weg. Moet iedereen het kunnen kiezen,
dan hoort het in de huisstijl thuis; zie het volgende kopje.

Rijkshuisstijl.nl levert SVG's zonder `width` en `height` op het svg-element,
alleen een viewBox. Chrome vult dat zelf aan, maar Edge en Firefox tekenen
zo'n bestand dan helemaal niet in een canvas — de badge zou leeg blijven,
terwijl hij in Chrome gewoon gevuld lijkt (dezelfde valkuil als hieronder). De
tool vult die maat daarom zelf aan uit de viewBox, zodat een ongewijzigde
download gewoon werkt; alleen een bestand dat geen geldige SVG is, wordt
geweigerd.

### Een pictogram aan de huisstijl toevoegen

Dit doet de beheerder, en dan staat het pictogram bij iedereen in de lijst.
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

Let op bij hergebruik: `components-css` en de meegeleverde terugvalletter Fira
Sans zijn EUPL-1.2, maar de
**design tokens zijn niet open source**. Op het logo en de huisstijl rust
auteursrecht; gebruik is voorbehouden aan de Rijksoverheid en aan partijen die
voor de Rijksoverheid werken.

## Toegang

Alleen vooraf toegelaten accounts kunnen de tool gebruiken. Inrichten:
[supabase/LEESMIJ.md](supabase/LEESMIJ.md). Nalopen of het werkt:
[TESTEN.md](TESTEN.md).

### Wat wél is afgeschermd

De **huisstijl**, de **opgeslagen concepten** en het **huisstijllettertype**.
Die staan in Supabase achter row level security — de eerste twee in tabellen,
de letter in een besloten opslagbak. Elke policy toetst twee dingen: ben je wie je zegt te zijn
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
| `huisstijlletter.js` | Het huisstijllettertype ophalen uit de besloten opslag |
| `config.js` | De publieke Supabase-URL en publishable key |
| `supabase/01_schema.sql` | Tabellen, RLS en policies — hier ligt de toegangscontrole |
| `supabase/03_controle.sql` | Nalopen of RLS op elke tabel aan staat |
| `supabase/05_huisstijlletter.sql` | De besloten opslagbak voor het huisstijllettertype |
| `supabase/LEESMIJ.md` | Wat je zelf in het Supabase-dashboard doet |
| `TESTEN.md` | Testdraaiboek voor de toegangscontrole |
| `vendor/supabase-js.js` | De officiële Supabase-client, meegeleverd |
| `vendor/rijkshuisstijl/` | De Rijkshuisstijl Community, meegeleverd: tokens, componenten-CSS, lettertype |
| `mockups/` | De indelingsvoorstellen waaruit dit scherm gekozen is, en de voorstellen die nog openstaan |
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
