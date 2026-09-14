# Social Media Opmaaktool

Zet een foto in de huisstijl en download hem op de juiste maat voor Instagram of
Facebook — zonder tussenkomst van het social mediabureau.

Bedoeld voor redacteuren die zelf hun posts bedenken, maar voor de opmaak nu nog
moeten wachten. Zie [STRATEGY.md](STRATEGY.md) voor het waarom.

> **Prototype.** De opmaak is nagebouwd naar bestaande posts. Kleuren en
> lettertype zijn met het oog benaderd, niet overgenomen uit een huisstijl-
> document. Laat een export controleren door communicatie voordat hier echt mee
> gepubliceerd wordt.

## Gebruiken

Open de gepubliceerde pagina, of download `index.html` en dubbelklik erop. Werkt
in Edge en Chrome, zonder installatie en zonder inloggen.

1. Kies platform en formaat.
2. Kies een stijl.
3. Sleep een foto in het vak, plak met Ctrl+V, of klik **Bestand kiezen**.
   Geen foto bij de hand? Klik **Voorbeeldfoto**.
4. Sleep de foto in het voorbeeld om de uitsnede te kiezen; zoom met de schuif
   of het scrollwiel.
5. Typ de kop en de subkop.
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

## De opmaak aanpassen

Alles wat met vormgeving te maken heeft staat in **`templates.js`**. Daar pas je
aan, nergens anders:

| Wat                                  | Waar in `templates.js` |
| ------------------------------------ | ---------------------- |
| Kleuren                              | `HUISSTIJL`            |
| Lettertype                           | `LETTERTYPE`           |
| Marges, hoekafronding, tekstruimte   | `TEMPLATES.stramien`   |
| Tekstgroottes en regelhoogte         | `TEMPLATES.typografie` |
| De drie stijlen                      | `TEMPLATES.stijlen`    |
| De witte cirkellijnen over de foto   | `TEMPLATES.decoratie`  |
| Exportmaten per platform             | `TEMPLATES.platforms`  |

Maten staan in verhoudingen van de breedte (0–1), niet in pixels. Zo klopt
hetzelfde sjabloon zowel op 1080 als op 1200 pixels breed.

Een stijl toevoegen is één blok in `TEMPLATES.stijlen` plus één knop in
`index.html`. Verder niets.

### Nog te doen voor de echte huisstijl

- **Kleuren** vervangen door de officiële codes uit het huisstijldocument.
- **Lettertype**: de echte huisstijlletter is licentieplichtig en staat daarom
  niet in deze publieke repo. Staat hij geïnstalleerd op de computer van de
  redacteur, dan pakt de browser hem vanzelf — `LETTERTYPE` noemt hem al als
  eerste keuze. Anders valt hij terug op een vergelijkbare letter.
- **Logo en pictogrammen** ontbreken nog; in de voorbeeldposts zitten witte
  ronde icoonbadges die hier nog niet gemaakt worden.

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
opslaan, rechtstreeks posten, en een koppeling met een beeldbank.
