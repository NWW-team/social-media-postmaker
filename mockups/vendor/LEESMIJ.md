# vendor — Rijkshuisstijl Community, onveranderd overgenomen

Deze map bevat de officiële, **ongewijzigde** uitvoerbestanden van
[nl-design-system/rijkshuisstijl-community](https://github.com/nl-design-system/rijkshuisstijl-community).
Ze staan hier zodat de mockups op elke laptop hetzelfde tonen, ook op een
werknetwerk dat npm en CDN's blokkeert — dezelfde reden waarom
`vendor/supabase-js.js` in deze repo staat.

| Bestand | Uit welk pakket | Versie |
| --- | --- | --- |
| `rhc-components.css` | `@rijkshuisstijl-community/components-css` → `dist/index.css` | 18.0.2 |
| `rhc-tokens-hemelblauw.css` | `@rijkshuisstijl-community/design-tokens` → `dist/hemelblauw/index.css` | 18.0.1 |
| `rhc-tokens-hemelblauw-dense.css` | `@rijkshuisstijl-community/design-tokens` → `dist/hemelblauw-information-dense/index.css` | 18.0.1 |
| `fonts/fira-sans-latin*.woff2` | `@rijkshuisstijl-community/font` → `dist/files/` | 1.1.6 |
| `font.css` | zelf geschreven, alleen de `@font-face`-regels voor die zes bestanden | — |

Opnieuw ophalen:

```sh
npm pack @rijkshuisstijl-community/components-css
npm pack @rijkshuisstijl-community/design-tokens
npm pack @rijkshuisstijl-community/font
```

## Waarom hemelblauw

De toolkit gebruikt `#007BC7` als hoofdkleur. Van de zes lintkleuren in de
Rijkshuisstijl (lintblauw, hemelblauw, groen, oranje, paars, robijnrood) ligt
**hemelblauw** daar het dichtst bij. Een andere lintkleur kiezen is één klasse
op `<body>` en één ander tokenbestand; de rest van de opmaak verandert niet.

## Licenties

- `components-css` en `font`: **EUPL-1.2**.
- `design-tokens`: **niet** open source. `LICENSE.md` van dat pakket zegt het
  zo: op het logo en de huisstijl rust auteursrecht, en gebruik is voorbehouden
  aan de Rijksoverheid zelf en aan partijen die voor de Rijksoverheid werken.
  Voor deze tool is dat in orde; voor hergebruik buiten die kring niet.
- Het huisstijllettertype **RijksSansVF zit hier bewust niet in** — dat is
  licentieplichtig. De Rijkshuisstijl Community levert zelf Fira Sans mee als
  open terugval, en dat is wat hier staat. Staat RijksSansVF op de werklaptop,
  dan pakt de browser hem vanzelf: de tokens noemen hem als eerste keuze.
