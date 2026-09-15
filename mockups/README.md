# Vijf mockups — de tool in de Rijkshuisstijl

Open **[`index.html`](index.html)** en klik door de vijf indelingen. Kies er één;
die wordt daarna in `../index.html` gebouwd.

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
onveranderd uit npm. Zie [vendor/LEESMIJ.md](vendor/LEESMIJ.md) voor de
versies, de herkomst en de licenties.

Gekozen lintkleur: **hemelblauw** — van de zes lintkleuren ligt die het dichtst
bij de `#007BC7` uit de toolkit. Een andere kiezen is één klasse en één ander
tokenbestand.

Twee dingen zijn met opzet géén huisstijl:

- **De donkere balk bovenaan** is de vergelijkingsbalk, niet het ontwerp. Die
  hoort niet bij een van de vijf.
- **Het logoblok is een gestippelde plaatshouder.** Het beeldmerk staat niet in
  deze repo en hoort niet in een mockup; zie `../README.md`, *Nog te doen*.

## Het voorbeeld is op schaal

De post in het voorbeeld is geen plaatje maar opgebouwd uit de verhoudingen uit
de PowerPoint-toolkit: de kop is echt 66 pt op een canvas van 1080 pt breed, de
marge echt 3,54 % van de breedte, de afgeronde hoek echt 9,492 % — rechtsonder,
en alleen daar. De "foto" is een paar verlopen over elkaar, want deze pagina
laadt met opzet geen enkel bestand van buiten.

## Wat hierna gebeurt

De gekozen indeling wordt in `../index.html` gebouwd, met deze vendor-bestanden.
Aan `app.js`, `auth.js` en de Supabase-kant verandert daarbij niets: dat is
opmaak, geen gedrag. De vijf stijlen, de exportmaten en de regellimieten blijven
uit de database komen.
