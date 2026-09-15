# vendor/

## supabase-js.js

De officiële Supabase-client, versie **2.116.0**, UMD-bouwsel.

Opgehaald van:
`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.js`

### Waarom hier en niet van een CDN

De pagina laadde dit bestand eerst rechtstreeks van `cdn.jsdelivr.net`. Op een
werknetwerk worden zulke CDN's vaak geblokkeerd, en dan laadt de client niet,
en dan is er geen inlogscherm — alleen een foutmelding. Precies dat gebeurde.

Door het bestand hier te zetten haalt de pagina alles van hetzelfde domein als
zichzelf. Er gaat nog één soort verzoek naar buiten: naar je eigen
Supabase-project, en dat moet ook wel.

### Bijwerken

Vervang het bestand door een nieuwe versie van dezelfde URL, pas het
versienummer hierboven aan, en draai `node tests/poort.test.js`.

Niet met de hand bewerken.

## rijkshuisstijl/

De Rijkshuisstijl Community: design tokens, componenten-CSS en het lettertype,
onveranderd uit npm. Om dezelfde reden hier en niet van een CDN. Zie
[rijkshuisstijl/LEESMIJ.md](rijkshuisstijl/LEESMIJ.md) voor versies, herkomst en
— belangrijk — de licenties, want die verschillen per pakket.
