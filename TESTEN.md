# Testdraaiboek — toegangscontrole

Zes tests. De eerste vijf doe je in de browser; de zesde is de belangrijkste,
want die gaat langs de frontend heen.

Gebruik uitsluitend de testaccounts uit `supabase/LEESMIJ.md` stap 4 en
verzonnen tekst. Zet geen echte redactionele inhoud in een prototype.

Noteer per test wat je ziet. Wijkt iets af, stop dan en meld het — een
afwijking hier betekent dat de toegangsregels niet doen wat ze beloven.

---

## Voorbereiding

Het meeste staat al klaar. Wat nog moet gebeuren voordat je kunt testen, zijn
**stap 3 en stap 4** uit `supabase/LEESMIJ.md`: registratie uitzetten en de
twee testaccounts aanmaken. Beide kunnen alleen via het dashboard.

De tabellen, policies, huisstijl, allowlist en `config.js` zijn al ingericht en
gecontroleerd (zie de statustabel in `supabase/LEESMIJ.md`).

Open daarna de gepubliceerde pagina in een **privévenster** (`Ctrl+Shift+N`).
Zo weet je zeker dat je met een schone sessie begint.

> Zonder stap 3 en 4 lopen de tests vast op het eerste inlogscherm: er bestaat
> dan nog geen account om mee in te loggen.

---

## Test 1 — Uitgelogd

1. Open de pagina in een privévenster.

**Verwacht:** je ziet het inlogscherm. Geen platformknoppen, geen stijlen, geen
canvas, geen concepten.

---

## Test 2 — Toegestaan account

1. Log in als `redacteur@example.org`.

**Verwacht:** het werkblad verschijnt, met vijf stijlknoppen en een getekend
canvas. Rechtsboven staat je e-mailadres met een uitlogknop.

2. Klik **Voorbeeldfoto**, typ een kop, en bewaar een concept onder een naam.

**Verwacht:** melding dat het concept bewaard is, en het verschijnt in de lijst.

3. Herlaad de pagina (`F5`), open het concept.

**Verwacht:** platform, formaat, stijl en tekst staan terug. De **foto niet** —
die is met opzet niet bewaard.

---

## Test 3 — Niet-toegestaan account

1. Log uit. Log in als `buitenstaander@example.org`, met het wachtwoord dat je
   voor dat account hebt ingesteld.

**Verwacht:** inloggen **lukt** — het account bestaat immers — maar je krijgt
het scherm **"Geen toegang"** met je e-mailadres erin. Geen werkblad.

Dat inloggen lukt is geen fout. Authenticatie en autorisatie zijn twee dingen:
Supabase stelt vast wie je bent, de RLS-policies bepalen dat je niets mag zien.

---

## Test 4 — Directe URL

Blijf ingelogd als `buitenstaander@example.org`.

1. Plak de URL van de pagina rechtstreeks in de adresbalk en druk op Enter.
2. Probeer ook een diepe verwijzing, bijvoorbeeld met `#stap5` erachter.

**Verwacht:** opnieuw "Geen toegang". Er is geen URL die het werkblad opent,
want het werkblad hangt niet aan de URL maar aan wat de database teruggeeft.

---

## Test 5 — Het scherm forceren

Nog steeds als `buitenstaander@example.org`.

1. Druk op `F12` voor de ontwikkelaarsconsole, tab **Console**.
2. Plak en voer uit:

```js
document.getElementById('geentoegang').hidden = true;
document.getElementById('werkblad').hidden = false;
```

**Verwacht:** je ziet het werkblad — **en het is leeg**. Geen stijlknoppen, een
blanco canvas, geen concepten.

3. Typ nu `TEMPLATES` en druk op Enter.

**Verwacht:** `null`.

Dit is het verschil tussen een inlogscherm en toegangscontrole. Het scherm is
weg te klikken. De gegevens niet, want die zijn er nooit geweest.

---

## Test 6 — Direct gegevensverzoek (de echte test)

De vorige tests gingen allemaal door de app heen. Deze niet: hier doe je je
voor als een aanvaller die de pagina helemaal negeert en de database
rechtstreeks aanspreekt met de publieke sleutel uit `config.js`.

Bouw deze URL. Neem `<PROJECT>` en `<KEY>` letterlijk over uit `config.js`:

```
https://<PROJECT>.supabase.co/rest/v1/huisstijl?select=*&apikey=<KEY>
```

### 6a — Zonder in te loggen

1. Open een **nieuw privévenster** (dus zonder sessie).
2. Plak de URL en druk op Enter.

**Verwacht:** `[]` — een lege lijst. Geen kleuren, geen stijlen, geen iconen.

Krijg je hier wél gegevens terug, dan staat RLS uit op die tabel. Stop dan en
draai `supabase/03_controle.sql`; blok 3 wijst de tabel aan.

3. Herhaal met `concepten` en met `toegestane_gebruikers` in plaats van
   `huisstijl`.

**Verwacht:** beide keren `[]` of een foutmelding over ontbrekende rechten.
Nooit inhoud.

### 6b — Ingelogd als niet-toegestaan account

Hetzelfde verzoek, nu mét een geldig token van `buitenstaander@example.org`.

1. Log in het venster van test 5 in als `buitenstaander@example.org`.
2. `F12` → **Console** → plak en voer uit:

```js
sb.auth.getSession().then(({ data }) => {
  const t = data.session.access_token;
  fetch(SUPABASE_CONFIG.url + '/rest/v1/huisstijl?select=*', {
    headers: { apikey: SUPABASE_CONFIG.publishableKey, Authorization: 'Bearer ' + t },
  })
    .then((r) => r.json())
    .then((x) => console.log('huisstijl:', JSON.stringify(x)));
});
```

**Verwacht:** `huisstijl: []`.

Dit is het scherpste bewijs dat je kunt leveren. Een geldig, bevestigd account,
een echt token, een rechtstreeks verzoek buiten de app om — en nog steeds niets,
omdat het adres niet op de allowlist staat.

3. Herhaal dezelfde code met `concepten`. **Verwacht:** `[]`.

### 6c — Registratie is echt dicht

Nog steeds in de console, in een privévenster zonder sessie:

```js
sb.auth.signUp({ email: 'indringer@example.org', password: 'ditmoetmislukken123' })
  .then(({ data, error }) => console.log('signUp:', error ? error.message : data));
```

**Verwacht:** een foutmelding, bijvoorbeeld `Signups not allowed for this instance`.

Controleer daarna in **Authentication → Users** dat `indringer@example.org`
**niet** in de lijst staat.

### 6d — Jezelf op de allowlist zetten

Als `redacteur@example.org` (dus mét toegang), in de console:

```js
sb.from('toegestane_gebruikers')
  .insert({ email: 'indringer@example.org' })
  .then(({ error }) => console.log('insert:', error ? error.message : 'GELUKT — DIT IS FOUT'));
```

**Verwacht:** een foutmelding over het schenden van row-level security.

Zie je `GELUKT`, dan is er per ongeluk een schrijfpolicy op de allowlist
gekomen en kan elke toegelaten gebruiker collega's binnenlaten. Meld dat.

---

## Test 7 — Opnieuw proberen na uitloggen

1. Log in als `redacteur@example.org`, bewaar een concept.
2. Klik **Uitloggen**.

**Verwacht:** je bent terug op het inlogscherm; de pagina is herladen.

3. Druk op de terugknop van de browser.

**Verwacht:** het inlogscherm, niet het werkblad.

4. `F12` → **Console** → typ `TEMPLATES`.

**Verwacht:** `null`. De huisstijl van de vorige gebruiker is uit het geheugen.

5. Plak de URL uit test 6 opnieuw in een tabblad.

**Verwacht:** `[]`.

---

## Al uitgevoerd vanuit de database

De policies zijn al beproefd met `supabase/04_rls_test.sql`, dat expliciet naar
de rollen `anon` en `authenticated` schakelt: 12 van de 12 goed. Dat toetst hoe
Postgres de policies evalueert.

Test 6 hieronder toetst de schakel die dáár niet in zit: of PostgREST een
publishable key op de rol `anon` afbeeldt en een ingelogd token op
`authenticated`. Die moet je vanuit de browser doen.

## Wat deze tests niet aantonen

- **Dat de pagina zelf privé is.** Dat is hij niet, en dat kan ook niet op
  GitHub Pages. `index.html`, `app.js`, `auth.js` en `config.js` zijn voor
  iedereen op te vragen. Dat is geen lek: er staat niets geheims in. Wil je ook
  de bestanden afschermen, dan is een andere hosting nodig — zie de README.
- **Dat de huisstijl nooit gelekt is.** Hij heeft in een openbare repo gestaan
  en staat nog in de Git-geschiedenis. Zie de README.
- **Dat een toegelaten gebruiker niets kan kopiëren.** Wie de huisstijl mag
  zien, kan hem overschrijven. Toegangscontrole regelt wie erbij mag, niet wat
  die persoon daarna met de gegevens doet.

---

## Uitslag noteren

| Test | Verwacht | Gezien | Akkoord |
| --- | --- | --- | --- |
| 1. Uitgelogd | inlogscherm, geen werkblad | | |
| 2. Toegestaan account | werkblad, concept bewaart en opent | | |
| 3. Niet-toegestaan account | inloggen lukt, "Geen toegang" | | |
| 4. Directe URL | "Geen toegang" | | |
| 5. Scherm forceren | leeg werkblad, `TEMPLATES` is `null` | | |
| 6a. Direct verzoek, uitgelogd | `[]` op alle drie de tabellen | | |
| 6b. Direct verzoek, niet toegestaan | `[]` | | |
| 6c. Zelf registreren | geweigerd | | |
| 6d. Zelf op allowlist zetten | geweigerd | | |
| 7. Na uitloggen | inlogscherm, `TEMPLATES` is `null` | | |
