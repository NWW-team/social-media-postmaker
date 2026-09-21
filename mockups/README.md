# Mockups — de tool in de Rijkshuisstijl

Drie pagina's, alle drie zonder server te openen:

| Pagina | Waarover | Stand |
| --- | --- | --- |
| [`index.html`](index.html) | Vijf indelingen voor de hele tool | Beslist: nummer 4 |
| [`teksteditor.html`](teksteditor.html) | Drie manieren om de letterknoppen in het tekstveld te zetten | **Open — nog te kiezen** |
| [`eigen-icoon.html`](eigen-icoon.html) | Twee manieren om een eigen icoon in de badge te zetten | Beslist: nummer 2 |

## Een eigen icoon in de badge

> **Gekozen: nummer 2, het eigen blok.** Die is gebouwd; zie `../index.html`.
> Dit deel blijft staan als vastlegging van de keuze — wat er naast lag, en wat
> elk voorstel zou kosten.

De iconen in de badges komen uit de huisstijl in Supabase; wie er een wil
bijzetten, moet de beheerder vragen. Hij staat dan meteen bij iedereen in de
lijst. [`eigen-icoon.html`](eigen-icoon.html) zet twee manieren naast elkaar om
de redacteur er zelf een te laten toevoegen, gedownload van Rijkshuisstijl.nl.
Ook deze voorstellen wérken: kies een icoon of sleep er zelf een in het vak, en
het voorbeeld verandert mee.

| | Voorstel | Waar het uploaden staat | Bouwwerk |
| --- | --- | --- | --- |
| 1 | **In de keuzelijst** | Onderaan de keuzelijst van elke badge, als optie *Eigen icoon uploaden…* | Klein — een optie, een uploadvak, en het icoon als data-URI in de bestaande icoonvoorraad |
| 2 | **Eigen blok met eigen iconen** | Een blok *Eigen iconen* onder de twee keuzelijsten, met een sleepvak en wat je toevoegde | Middel — als 1, plus een lijstje eigen iconen met toevoegen en weghalen |

Het verschil dat er het meest toe doet: in 1 hangt een eigen icoon aan één
badge en is het weg zodra je iets anders kiest, in 2 is het een verzameling die
blijft staan en in beide keuzelijsten verschijnt. Daar staat tegenover dat 2
altijd een sleepvak in beeld heeft, ook bij wie nooit een eigen icoon gebruikt.

Allebei hebben ze hetzelfde **'i'tje** naast het veld: één klik, en er klapt
uitleg open dat je een eigen icoon kunt downloaden van Rijkshuisstijl.nl en hier
kunt uploaden om in de badges te gebruiken, met daaronder wat voor bestand
werkt. Een knop en geen tooltip op hover, want op een aanraakscherm is er geen
hover.

Twee dingen die de mockup vast laat zien en die bij het bouwen terugkomen:

- **Het bestand blijft op de eigen computer.** Het wordt met `FileReader`
  gelezen en meteen als data-URI getekend, net als de foto — er is geen
  upload-aanroep. Wil je een eigen icoon bewaren bij een concept, dan gaat het
  wél naar Supabase, en dan is dat een bewuste keuze en geen bijvangst.
- **SVG zonder `width` en `height` weigert de mockup**, met dezelfde uitleg als
  het kopje *Zelf een icoon toevoegen* in de hoofd-LEESMIJ: Chrome vult zo'n maat
  aan, Edge en Firefox tekenen het bestand dan helemaal niet in een canvas, en
  dan blijft de badge in de export leeg.

## De letterknoppen in het tekstveld

De knoppen voor grootte, gewicht en schuin staan in de tool als los blok onder
de tekstvelden. [`teksteditor.html`](teksteditor.html) zet drie manieren naast
elkaar om ze bij de tekst zelf te zetten. De voorstellen wérken: typ in de
velden, klik op de knoppen en het voorbeeld verandert mee.

| | Voorstel | Geldt voor | Bouwwerk |
| --- | --- | --- | --- |
| 1 | **Werkbalk boven het veld** | Het hele veld | Klein — dezelfde werking als nu, andere plek |
| 2 | **Werkbalk op de selectie** | Wat je geselecteerd hebt | Groot — de export moet regels in stukken meten en tekenen |
| 3 | **Dunne rij onder het veld** | Het hele veld | Klein — als 1, met minder hoogte |

Het verschil dat er het meest toe doet zit tussen 1 en 3 enerzijds en 2
anderzijds. Alleen in 2 kun je één woord vet of groter maken; dat is ook de
enige van de drie die aan de tekencode raakt. Kies je 1 of 3, dan verhuizen de
bestaande knoppen en verandert er aan de export niets.

## Vijf indelingen voor de hele tool

> **Gekozen: nummer 4, Keuzekaarten.** Die is gebouwd; zie `../index.html`.
> Dit deel blijft staan als vastlegging van de keuze — wat er naast lag, en wat
> elke indeling zou kosten.

Open **[`index.html`](index.html)** en klik door de vijf indelingen.

Dubbelklikken werkt: deze map laadt niets van buiten en heeft geen Supabase,
geen inlog en geen server nodig.

## Wat je ziet

Vijf indelingen voor **dezelfde** tool. De inhoud is overal gelijk — dezelfde
zes stappen, dezelfde teksten, hetzelfde voorbeeld. Alleen de indeling
verschilt, zodat je vergelijkt wat er te vergelijken valt.

| | Mockup | In één zin | Sterkste kant | Zwakste kant |
| --- | --- | --- | --- | --- |
| 1 | **Rijksformulier** | Eén pagina, zes stappen onder elkaar | Het meest herkenbaar en het minste bouwwerk | Lang scrollen; het voorbeeld staat ver van de tekstvelden |
| 2 | **Stappenplan** | Eén stap per scherm, met een stappenlijst | Je kunt maar één ding tegelijk fout doen | Traag als je één ding wilt wijzigen |
| 3 | **Werkbank** | Groot voorbeeld in het midden, keuzes eromheen | Snelst als je er tien achter elkaar maakt | Gereedschapstaal, geen formuliertaal |
| 4 | **Keuzekaarten** | Hero en keuzes als kaarten met voorbeeldje | De enige waarin je de vijf stijlen ziet | De meeste ruimte voor de minste invoer |
| 5 | **Compact** | Alles op één scherm, zonder scrollen | Volume: concept, tekst, download, volgende | Kleine letters; valt uit elkaar op een klein scherm |

In de balk bovenaan staat per mockup ook wat het kost en hoeveel werk het is om
hem te bouwen. Met **Telefoon** bekijk je dezelfde mockup op 400 px breed.

## Het is de échte huisstijl, geen nabootsing

De mockups gebruiken de componenten-CSS en de design tokens van
[nl-design-system/rijkshuisstijl-community](https://github.com/nl-design-system/rijkshuisstijl-community),
onveranderd uit npm. Zie [../vendor/rijkshuisstijl/LEESMIJ.md](../vendor/rijkshuisstijl/LEESMIJ.md) voor de
versies, de herkomst en de licenties.

Gekozen lintkleur: **hemelblauw** — van de zes lintkleuren ligt die het dichtst
bij de `#007BC7` uit de toolkit. Een andere kiezen is één klasse en één ander
tokenbestand.

Twee dingen zijn met opzet géén huisstijl:

- **De donkere balk bovenaan** is de vergelijkingsbalk, niet het ontwerp. Die
  hoort niet bij een van de vijf.
- **Het logoblok is een gestippelde plaatshouder.** Het beeldmerk staat niet in
  deze repo en hoort niet in een mockup; zie `../README.md`, *Nog te doen*. In
  de tool zelf staat die plaatshouder niet meer; in deze vastlegging van de
  keuze blijft hij staan zoals hij toen was.

## Het voorbeeld is op schaal

De post in het voorbeeld is geen plaatje maar opgebouwd uit de verhoudingen uit
de PowerPoint-toolkit: de kop is echt 66 pt op een canvas van 1080 pt breed, de
marge echt 3,54 % van de breedte, de afgeronde hoek echt 9,492 % — rechtsonder,
en alleen daar. De "foto" is een paar verlopen over elkaar, want deze pagina
laadt met opzet geen enkel bestand van buiten.

## Wat er van 4 is gebouwd

Bijna alles, met twee verschillen die het bouwen aan het licht bracht:

- **De stijlkaarten zijn echt geworden.** In de mockup stond er een
  nagetekend voorbeeldje op; in de app tekent elke kaart langs dezelfde code
  als de export, met jouw foto en jouw tekst. Daar is `app.js` voor opgeschoond:
  de tekencode werkt nu op een losse "opdracht" in plaats van rechtstreeks op de
  toestand van het grote canvas.
- **De formaatkaarten komen uit de database**, niet uit `index.html`. Ze zijn
  platform × formaat, dus een platform toevoegen in Supabase levert vanzelf
  nieuwe kaarten op — net als bij de stijlen.

Het voorbeeld naast de tekstvelden staat bovendien *sticky*, wat precies de
zwakke kant van deze indeling verzacht: veel scrollen, met het voorbeeld ver
van de invoer.

Aan de Supabase-kant is niets veranderd: de stijlen, de exportmaten en de
regellimieten komen nog steeds uit de database.
