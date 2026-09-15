# Supabase inrichten — stap voor stap in de browser

Alles hieronder doe je in `https://supabase.com/dashboard`. Je hebt geen
terminal, geen CLI en geen lokale installatie nodig.

## Stand van zaken

Via de Supabase-connector is het meeste al uitgevoerd op project
`bsaltminmhvdsdkaqkag`. Wat jij nog zelf moet doen staat hieronder met
**NOG TE DOEN** ervoor: dat zijn stap 3 en stap 4. Voor die twee bestaat geen
API — ze kunnen alleen via het dashboard.

| Stap | Wat | Status |
| --- | --- | --- |
| 1 | Tabellen, RLS en policies | Gedaan |
| 2 | Huisstijl gevuld (11 sleutels, 8 iconen) | Gedaan, md5 gecontroleerd |
| 3 | Registratie uitzetten | **NOG TE DOEN — alleen jij** |
| 4 | Twee testaccounts aanmaken | **NOG TE DOEN — alleen jij** |
| 5 | `redacteur@example.org` op de allowlist | Gedaan |
| 6 | URL en publishable key opgehaald | Gedaan |
| 7 | `config.js` ingevuld | Gedaan |
| 8 | Controle en RLS-test | Gedaan, 12 van 12 goed |

---

> Het dashboard verandert af en toe van indeling. Staat een menu-item niet waar
> ik het beschrijf, gebruik dan de zoekbalk bovenin (`Ctrl+K`) en typ de naam
> tussen aanhalingstekens. De namen zelf zijn stabieler dan de plek.

---

## Stap 1 — Tabellen en toegangsregels aanmaken *(gedaan)*

Al uitgevoerd als migratie `toegangsregels_allowlist_huisstijl_concepten`.
Hieronder staat hoe je het zou herhalen, bijvoorbeeld in een nieuw project.

1. Open je project.
2. Klik links op **SQL Editor**.
3. Klik **New query**.
4. Open `supabase/01_schema.sql` uit deze repo, selecteer alles, kopieer.
5. Plak in de editor en klik **Run** (of `Ctrl+Enter`).

Je hoort onderin `Success. No rows returned` te zien. Dit bestand maakt drie
tabellen aan, zet RLS aan en legt de policies vast.

---

## Stap 2 — De huisstijl vullen *(gedaan)*

De 11 sleutels staan erin en zijn per waarde met md5 vergeleken met het
oorspronkelijke `templates.js`; alle acht iconen komen exact overeen.

Dit bestand staat **niet** in de repo, met opzet: het bevat precies de config
die we achter de allowlist zetten. Je hebt het los van mij gekregen als
`02_huisstijl_vullen.sql`.

1. **SQL Editor** → **New query**.
2. Plak de inhoud van `02_huisstijl_vullen.sql`.
3. **Run**.

Onderin verschijnt een tabel met 11 rijen (`kleuren`, `stijlen`, `iconen`, …).
Zie je die, dan staat de huisstijl erin.

Bewaar dat bestand ergens buiten de repo — bijvoorbeeld in de teamopslag. Zet
het niet terug in GitHub.

---

## Stap 3 — Registratie uitzetten — **NOG TE DOEN**

> Dit kan ik niet voor je doen: de Supabase-connector heeft geen tool om de
> auth-instellingen te wijzigen. Het is een paar klikken.

Dit is de echte grendel op "geen vrije registratie". Niet een verborgen knop in
de frontend, maar een serverinstelling: Supabase weigert daarna elk
`signUp`-verzoek, ongeacht waar het vandaan komt.

1. Links op **Authentication**.
2. **Sign In / Providers** (heette eerder *Providers*).
3. Zoek het blok **User Signups**.
4. Zet **Allow new users to sign up** **uit**.
5. Controleer in hetzelfde scherm dat **Allow anonymous sign-ins** uit staat.
6. **Save**.

Laat **Confirm email** staan zoals het staat. Die instelling raken we niet aan;
in stap 4 lossen we de bevestigingsmail anders op.

---

## Stap 4 — De twee testaccounts aanmaken — **NOG TE DOEN**

> Ook dit kan ik niet voor je doen. Accounts rechtstreeks in `auth.users`
> schrijven met SQL is een bekende maar broze truc — je omzeilt dan de
> wachtwoordafhandeling van Supabase Auth en loopt kans op half werkende
> accounts. Twee klikken in het dashboard is veiliger.

Handmatig aangemaakte accounts kun je meteen bevestigen. Zo heb je geen
bevestigingsmail nodig en hoef je de e-mailinstellingen van het project niet te
verzwakken.

Gebruik fictieve adressen op een domein dat gegarandeerd van niemand is —
`example.org` is daar door de IETF voor gereserveerd. Verzin wachtwoorden van
minstens 12 tekens; zet ze in je wachtwoordmanager, niet in een chat of in
GitHub.

1. **Authentication** → **Users**.
2. Knop **Add user** → **Create new user**.
3. Vul in:
   - Email: `redacteur@example.org`
   - Password: *een sterk wachtwoord dat jij verzint*
   - **Auto Confirm User**: **aan**
4. **Create user**.
5. Herhaal stap 2–4 voor het tweede account:
   - Email: `buitenstaander@example.org`
   - **Auto Confirm User**: **aan**

Je hebt nu twee bestaande, bevestigde accounts. Beide kunnen straks inloggen.
Slechts één van de twee krijgt toegang tot gegevens — dat regelt stap 5.

---

## Stap 5 — Eén account op de allowlist zetten *(gedaan)*

`redacteur@example.org` staat op de lijst. `buitenstaander@example.org`
bewust niet. De regels hieronder heb je nodig om later echte collega's toe
te voegen.

1. **SQL Editor** → **New query**.
2. Plak en **Run**:

```sql
insert into public.toegestane_gebruikers (email, notitie)
values ('redacteur@example.org', 'Testaccount — mag alles')
on conflict (email) do nothing;

select * from public.toegestane_gebruikers;
```

`buitenstaander@example.org` voeg je **niet** toe. Dat is het punt van de test:
dat account bestaat, kan inloggen, en krijgt daarna nul rijen terug omdat de
policies in stap 1 zijn eis op de allowlist leggen.

Later een echte collega toegang geven gaat zo:

```sql
insert into public.toegestane_gebruikers (email, notitie)
values ('voornaam.achternaam@organisatie.nl', 'Redactie')
on conflict (email) do nothing;
```

Daarna maak je voor dat adres een account aan via **Authentication → Users →
Add user**. Beide stappen zijn nodig: een account zonder allowlist-rij ziet
niets, en een allowlist-rij zonder account kan niet inloggen.

Toegang intrekken is één regel — en werkt direct, ook als de sessie nog loopt,
want elke policy toetst opnieuw bij elk verzoek:

```sql
delete from public.toegestane_gebruikers where email = 'iemand@organisatie.nl';
```

---

## Stap 6 — De publieke projectconfiguratie ophalen *(gedaan)*

Project-URL en publishable key staan inmiddels in `config.js`. De tabel met
sleutels-die-nooit-in-de-frontend-horen blijft belangrijk om te kennen.

1. Klik linksonder op het tandwiel (**Project Settings**).
2. Ga naar **Data API**. Kopieer de **Project URL**
   (`https://xxxxxxxxxxxx.supabase.co`).
3. Ga naar **API Keys**. Kopieer de **Publishable key** (`sb_publishable_…`).
   Heeft jouw project die nog niet, neem dan de legacy **anon public** key.

Deze twee horen in de frontend. Ze zijn daarvoor gemaakt: de publishable/anon
key zegt alleen *welk project* je aanspreekt, niet *wie* je bent. Wat je mag,
bepalen de policies uit stap 1.

Wat **nooit** in de frontend, in een prompt of in GitHub komt:

| Niet gebruiken | Waar hij staat | Waarom niet |
| --- | --- | --- |
| `service_role` / Secret key (`sb_secret_…`) | Settings → API Keys | Negeert álle RLS-policies. Wie hem heeft, heeft je hele database. |
| Databasewachtwoord | Settings → Database | Directe Postgres-toegang, langs de API om. |
| JWT-secret | Settings → API | Waarmee je zelf geldige tokens kunt ondertekenen. |

Ziet iemand per ongeluk een van deze drie: draai hem meteen om in datzelfde
scherm. Een weggehaalde commit is niet genoeg — GitHub bewaart de geschiedenis.

---

## Stap 7 — De sleutels in de app zetten *(gedaan)*

`config.js` bevat nu:

```
url:            https://bsaltminmhvdsdkaqkag.supabase.co
publishableKey: sb_publishable_...
```

Dat bestand mag gewoon in de publieke repo staan — zie de tabel bij stap 6
voor wat er níét in mag.

---

## Stap 8 — Controleren *(gedaan)*

Uitgevoerd: alle drie de tabellen hebben RLS aan met expliciete policies, de
beveiligingsadviezen van Supabase staan op nul, en `supabase/04_rls_test.sql`
gaf 12 van de 12 goed.

Zo herhaal je het zelf, bijvoorbeeld na een wijziging aan de policies:

1. **SQL Editor** → **New query** → plak `supabase/03_controle.sql` → **Run**.
2. Loop de vijf resultaatblokken langs:
   - blok 1: alle drie de tabellen `rls_aan = true`, elk met minstens één policy;
   - blok 3: **moet leeg zijn** — hier verschijnt elke tabel zonder bescherming;
   - blok 4: `redacteur@example.org`, `heeft_account = true`, `bevestigd = true`;
   - blok 5: `buitenstaander@example.org` — bestaat wel, staat niet op de lijst.

Klopt dit, dan staan de toegangsregels goed.

3. Draai daarna `supabase/04_rls_test.sql`. Dat bestand schakelt naar de rollen
   `anon` en `authenticated` en beproeft de policies écht — in de SQL Editor ben
   je namelijk een rol die RLS omzeilt, dus een gewone `select` bewijst niets.
   Elke regel hoort `ja` te geven in de kolom `goed`.
