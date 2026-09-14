/*
 * templates.js — het sjabloonsysteem.
 *
 * Alle waarden hieronder komen uit de officiële PowerPoint-toolkit
 * (NWW_PPT_template_Posten_toolkit_socials_v1). Het PPT-canvas is 1440 × 1800 px
 * (4:5); maten zijn daaruit omgerekend naar verhoudingen van de breedte, zodat
 * hetzelfde sjabloon klopt op 1080, 1200 of welke exportmaat dan ook.
 *
 * Waarom een .js en geen .json: de pagina moet ook werken als je index.html
 * gewoon dubbelklikt (file://). Browsers blokkeren dan fetch() naar een los
 * JSON-bestand. Als JS-bestand werkt het overal, en het blijft even leesbaar.
 */

/* Themakleuren uit de toolkit. */
const HUISSTIJL = {
  blauw: '#007BC7',        // hoofdkleur; koptekst en het diepblauwe vlak
  lichtblauw: '#C7E5F3',   // het tekstvlak in de toolkit
  donkerblauw: '#154173',  // bodytekst
  middenblauw: '#01689B',
  zacht: '#8FCAE7',
  wit: '#FFFFFF',
};

/*
 * De toolkit gebruikt RijksSansVF. Dat lettertype is licentieplichtig en staat
 * daarom niet in deze publieke repo. Heeft de redacteur het geïnstalleerd — wat
 * op een werklaptop met de huisstijlpakketten zo is — dan pakt de browser het
 * vanzelf. Anders valt hij terug op een vergelijkbare schreefloze.
 */
const LETTERTYPE =
  '"RijksSansVF", "Rijksoverheid Sans", "Segoe UI", system-ui, ' +
  '-apple-system, "Helvetica Neue", Arial, sans-serif';

/*
 * Decoratie: de dunne witte cirkellijnen met icoonbadges die over de foto lopen.
 * Maten en onderlinge plaatsing komen uit de toolkitpagina "Mededeling/event":
 * drie ringen van 56,23% van de breedte met een witte lijn van 3 px, en twee
 * witte badges van 15,96% en 12,42%. De posities zijn hier gerekend vanaf de
 * LINKERONDERHOEK van de foto, in eenheden van de fotobreedte.
 */
const DECORATIE = {
  aan: true,
  lijndikte: 0.00208,
  lijnkleur: 'rgba(255,255,255,0.9)',
  badgeKleur: '#FFFFFF',
  icoonKleur: HUISSTIJL.blauw,
  icoonDeel: 0.65,          // deel van de badgediameter
  ringen: [
    { x: 0.1399, y: -0.1379, d: 0.5623 },
    { x: 0.5428, y: -0.0240, d: 0.5623 },
    { x: -0.0748, y: -0.3073, d: 0.5623 },
  ],
  badges: [
    { x: 0.1850, y: -0.4017, d: 0.1596 },
    { x: 0.3942, y: -0.2563, d: 0.1242 },
  ],
};

/*
 * Pictogrammen voor de badges.
 *
 * Een icoon is of een kant-en-klare data-URI, of SVG-tekst waarin {kleur} wordt
 * vervangen door de huisstijlkleur.
 *
 * BELANGRIJK voor SVG: zet altijd width en height op het <svg>-element, niet
 * alleen een viewBox. Chrome vult een ontbrekende maat aan, maar Edge en Firefox
 * tekenen zo'n SVG helemaal niet in een canvas — dan blijven de badges leeg.
 *
 * De eerste drie komen uit de PowerPoint-toolkit. De rest zijn eenvoudige eigen
 * tekeningen, bedoeld om uit te breiden zolang de officiele set niet compleet is.
 */
const ICONEN = {
  'Wereld (toolkit)': `<svg viewBox="0 0 59.08 59.36" width="59.08" height="59.36" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="Laag_1" overflow="hidden"><defs></defs><path d="M45.51 22.84C43.4 22.84 41.64 21.42 41.12 19.5 39.45 19.71 37.82 20.05 36.26 20.54 37.22 23.42 37.75 26.49 37.75 29.69 37.75 33.21 37.1 36.58 35.94 39.71 36.48 40.18 36.92 40.76 37.19 41.43 39.29 41.11 41.32 40.55 43.23 39.78 43.23 39.76 43.23 39.74 43.23 39.72 43.23 37.86 44.76 36.34 46.66 36.34 47.37 36.34 48.03 36.55 48.57 36.92 51.98 34.58 54.83 31.49 56.87 27.9 56.73 25.71 56.34 23.59 55.7 21.57 53.84 20.76 51.87 20.15 49.82 19.76 49.21 21.54 47.52 22.84 45.51 22.84" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4" fill="{kleur}" fill-opacity="0.62111"/><path d="M34.97 47.11C34.36 47.41 33.68 47.59 32.95 47.59 32.5 47.59 32.07 47.51 31.65 47.38 29.05 50.74 25.73 53.53 21.91 55.53 24.33 56.22 26.88 56.59 29.52 56.59 34.17 56.59 38.56 55.44 42.39 53.43 39.64 51.66 37.14 49.52 34.96 47.11" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4" fill="{kleur}" fill-opacity="0.62111"/><path d="M49.91 38.74C50 39.05 50.07 39.38 50.07 39.72 50.07 41.58 48.54 43.1 46.64 43.1 45.59 43.1 44.65 42.62 44.03 41.88 41.94 42.71 39.74 43.32 37.45 43.66 37.36 44.39 37.1 45.07 36.69 45.65 38.99 48.17 41.63 50.37 44.59 52.14 51.34 47.75 56 40.5 56.79 32.14 54.87 34.69 52.54 36.92 49.9 38.74" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4" fill="{kleur}" fill-opacity="0.62111"/><path d="M29.69 46.24C29.01 45.56 28.57 44.66 28.44 43.66 24.66 43.09 21.12 41.83 17.95 39.99 17.47 42.01 17.2 44.1 17.2 46.26 17.2 49.06 17.65 51.75 18.45 54.29L18.89 54.49C23.17 52.67 26.87 49.81 29.7 46.24" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4" fill="{kleur}" fill-opacity="0.62111"/><path d="M24.42 28.02C21.83 30.8 19.83 34.11 18.59 37.77 21.62 39.61 25.05 40.87 28.71 41.43 28.95 40.83 29.32 40.3 29.79 39.85 27.9 36.35 26.57 32.51 25.91 28.45 25.37 28.42 24.86 28.27 24.41 28.02" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4" fill="{kleur}" fill-opacity="0.62111"/><path d="M33.97 2.95C33.03 4.28 32.2 5.69 31.45 7.15 32.36 7.97 32.95 9.15 32.95 10.46 32.95 11.32 32.69 12.12 32.26 12.81 33.52 14.56 34.61 16.43 35.46 18.44 37.27 17.86 39.15 17.47 41.09 17.24 41.59 15.29 43.37 13.84 45.5 13.84 47.63 13.84 49.59 15.42 49.98 17.51 51.57 17.8 53.11 18.21 54.6 18.74 50.93 10.52 43.23 4.44 33.95 2.95" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4" fill="{kleur}" fill-opacity="0.62111"/><path d="M28.59 14.95C28.06 17.27 27.76 19.68 27.73 22.15L27.79 22.18C29.51 21.01 31.36 20.01 33.32 19.21 32.59 17.5 31.67 15.88 30.61 14.37 30.01 14.71 29.32 14.91 28.59 14.95" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4" fill="{kleur}" fill-opacity="0.62111"/><path d="M32.95 38.6C33.27 38.6 33.59 38.64 33.89 38.7 34.9 35.89 35.47 32.86 35.47 29.7 35.47 26.78 34.99 23.96 34.12 21.33 32.41 22.03 30.8 22.89 29.29 23.89 29.44 24.27 29.53 24.67 29.53 25.1 29.53 26.21 28.98 27.19 28.14 27.8 28.74 31.71 29.99 35.4 31.8 38.76 32.17 38.67 32.55 38.6 32.96 38.6" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4" fill="{kleur}" fill-opacity="0.62111"/><path d="M22.67 25.09C22.67 23.44 23.87 22.08 25.45 21.78 25.51 19.28 25.82 16.84 26.37 14.49 24.86 13.76 23.81 12.24 23.81 10.47 23.81 9.61 24.07 8.81 24.49 8.13 22.7 6.8 20.76 5.66 18.66 4.8 13.11 7.16 8.52 11.28 5.59 16.44 5.83 20.37 6.94 24.08 8.71 27.38 8.79 27.38 8.87 27.36 8.96 27.36 11.48 27.36 13.53 29.37 13.53 31.86 13.53 32.45 13.41 33 13.2 33.51 14.26 34.59 15.4 35.59 16.62 36.48 18 32.67 20.16 29.24 22.9 26.35 22.75 25.97 22.66 25.55 22.66 25.11" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4" fill="{kleur}" fill-opacity="0.62111"/><path d="M11.85 35.31C11.06 35.95 10.07 36.35 8.97 36.35 6.45 36.35 4.4 34.33 4.4 31.85 4.4 30.26 5.25 28.86 6.52 28.06 5.26 25.64 4.33 23.03 3.79 20.28 2.71 23.18 2.12 26.32 2.12 29.59 2.12 39.54 7.58 48.22 15.7 52.91 15.19 50.77 14.91 48.55 14.91 46.27 14.91 43.65 15.26 41.12 15.92 38.71 14.46 37.7 13.1 36.56 11.85 35.31" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4" fill="{kleur}" fill-opacity="0.62111"/><path d="M28.38 5.97C28.74 5.97 29.09 6.02 29.43 6.1 30.04 4.92 30.7 3.77 31.43 2.66 30.8 2.62 30.16 2.59 29.52 2.59 26.79 2.59 24.15 2.99 21.66 3.72 23.25 4.53 24.74 5.49 26.15 6.55 26.81 6.18 27.56 5.96 28.37 5.96" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4" fill="{kleur}" fill-opacity="0.62111"/></svg>`,

  'Gesprek (toolkit)': 'data:image/png;base64,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',

  'Megafoon (toolkit)': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQsAAAELCAYAAADOVaNSAAAACXBIWXMAAC4jAAAuIwF4pT92AAAQNUlEQVR4nO3dT3LcRprG4RcT3ot9AsEnaPaudoJOMPQJRJ3A7D0iDEfUftgnmNIJTJ9goB12LZ2gSydo8QSYRWXZJXWRTKDyQ/7B74lwOCyVEp8l6uWXiUSiGsdRAPCS/4pdAIA8EBYAvBAWALwQFgC8EBYAvBAWALwQFgC8EBYAvBAWALwQFgC8EBYAvBAWALwQFgC8EBYAvBAWALz8ELsAYI2qdriS1Ei6dj/Uj9tNH60gDxWH3wDLcSFxL+ndmZ9+dD93P243XxctzANhASykaocbSTtJr1746BdJN+N288m8qAkIC2ABVTvcSvrfCb/kUVKTUmCwwAkYmxEU0qH76Kt2uH7xkwuhswAMzQyKU4+S6hTWMOgsACMBgkI6dBgPl1dzOcICMBAoKI7eVO1wF2is2ZiGAIFV7XAv6efAw0afjtBZAAFV7bBT+KCQDtORe4NxvdFZAIG4oDi32SqkH8ftZm98jbPoLIAAFgoKSeoWuMZZdBbAhRYMiqMo3QWdBXCBCEEhReou6CyAmSIFxdFflr4zQmcBzBA5KCTpdukLEhbARAkEhRQhLJiGABMkEhRHi05F6CwAT4kFhSTdLHkxwgLwkGBQSIQFkJZEg0I6nOG5GMICeEbCQSFJr6p2aJa6GGEBPCHxoDhqlroQYQGckUlQSAuGBe8NAU68cFR/it4sdSE6C8BxQdErn6CQJC21bkFYAPomKP4auZQ5miUuQlhg9TIPComwAOxV7VAr76CQFlq3ICywWu4FPp+Ud1BI+uP/xRRhgVVyf7l6vfze0Vw01hcgLLA67p0evcoJCkky7yzYZ4FVCfzyn5QwDQFCcS//KTEopAXWXQgLrILhy3+SYb05i2kIilbAHoopjou2JugsUKySbo16Ml23ICxQpKodbnT4Lvs6cilLIiyAKap2uJP0m8q6NerDtIPidG8UI8PHyy38bdxuPlkMTGeBIpw847HmoJAMpyKEBbLn1ifWtJD5nNpqYMICWavaodM61yee0lgNzD4LZMmtTzxowWPlMlFbDUxngey4acdeBMU5ZreKCQtkxT3fwbTjGVbbvpmGIAtuN+ZOLGL6qC0GpbNA8twi5j9FUPiqLQals0Cy3N6JnVibmKqxGJTOAklyW7Y/iaCY48piUDoLJIW1iSBMfu94NgRJcPsm7iT9EruWQvw4bjf7kAMyDUF0J9u1CYpw6tADMg1BNCxgmgp+ahZhgcW5KUenws/EjCz4IifTECzK3eXYi6Cw1oQekM4Ci3Dv6+i0rmPuikJYwJR7TmEnQmJpwdeBCAuYcCHRicXLYrDPAkG56catCIkUvB23mz7UYHQWuJi7u3Ej1iSKRlhgNrdP4k6HToLzJdLTKOBeC8ICkzHVWCfCAl7cA153Okw36CLyEPS1AIQFnuQC4laHgGAtIj9Bd3ESFviGu+V5IwKiBHXIwQiLlXOLlI0O4dCIKUZJgoY9YbFi7mxLHguHFx4kWzeTF+giHSFfC0BYFKJqh3rGF0ZvUAoKxXbvTLi1hdr9Z3Py7yt9e+biX8bt5uuEcXuxX6Jk78ftZhdioMXXLNzW4GsZvsA1M80zP3et6QuONzo85emL94WWrQ410CJhcbItuBGnNltrNC0sepMqUBzTsOAx5SiaKR8et5tPVTs8ilumpapDDWSywFm1w1XVDg+S/k8ExdJeu05uit6gDqShDjVQ8LBwx7rvJf136LHhrZn4+d6gBhQmaFi4w1h/Ey1tbFMfIGK/RbnqUAMFC4uqHXaS/ifUeLhIM+XDIU9TQnKCbfkOEhauo3gXYiwEMeeO08fgVaAoF4eFW6Ogo0jMjN2cTEUK5fY2XeyisHBF7EIUguBYt8BRkENwLu0sdmIxM1X1xM/vDWpAQWaHhWtzuT2arknfTVjkxEsu6Sy6UEXAxJzNcJ+DV4EUxFuzcDsE2ZmZuBkLW95PqyIrUdcs7kJcHOamfpH0FkWgDHPDoglZBMxMDYu9RREow+SwcK0tj5nnYeo0ZG9RBMowp7MI+uISmGKvBaSIaxZNiAtjEZM6iynH8SEr8XdwInlzvqN8CV4FikBYlG3O7tp96CJQBqYhhZtxahZTEZxFZ1G+euLnWeTEWYQFUL4knjpF+pqJn6ezKE+QJ8MJC3yPNQucRVgA8EJYlK+e+Hk6C5xFWJSvnvLhcbthzQJnERYAvBAWALwQFgC8EBYAvBAW5ZtzVipvJ8N/ICwAeCEsAHghLAB4ISwAeCEsAHghLAB4ISwAeCEsAHghLHBOkPdMoCyERfnm7Mbk9ZT4D4QFAC+EBQAvhAUAL4QFAC+ERfn2Uz5ctUOQF9KgPIRF+fYTP89tU5xFWADwQliUb+p7QGqLIpA/wqJ8U98DUlsUgageQwxCWADlC/LiqDlhwevt8rKf+HnuhuCsOWHB6+0yMm43+4m/hLshOItpSNnmzFXr0EWgDIRF2eZ0ga+DV4EizAmLPnQRMDNpfalqh9qoDsQVZJ2RNYuycdsUUqy7IeN281XS5xAXh7n9xM9zJwRPmrtm0YcsAmb2Ez/PnRA8aW5Y3AetAlamtp+NRREow6ywcPfuedN22h7dlHGK2qIQRBdtB+dRF6IAmOG2KY6i3Q2RJI3bTS/p9xBFwMSksKjaoTGqA4W4dFPWrQI90YbgpnYW3AnBsy4KCzcnvg1TCgIjLHAUfc1CkjRuNw+S/h6gFgQ0bjeEBST98U39YkGeDRm3m3tJH0KMhSB4CxmCC/Yg2bjd3IoOIxX9lA+zuFm0L6EGCvrUqeswfhKLnrGxGQtH+1ADBX9E3a1h1OK2akz9xM+zXoEXmZxnMW43X8ft5kbSW7HTc2mfZyxoNRaFIAn7UAOZHn4zbjf9uN00kn6U9A/xtOoS+ikfdm8ge2VTChKwDzXQD6EGeo57luROkqp2uNKh7W0mDNFIehO6Lh0Wf3YG4/o6/l48Zc5f5H7i528mfh4rtUhYnHItcq8JX9TuBKd/GZRzJWk341Dbxbnfg9r9Z3Py7yud3PZ0a0ZTEBZl24caqBrHMdRYpqp22El6ZzT8Z0kPkh5mbGZKgguTqyn1uy7v32ZFIQVv3XNcF1u8s7hAJ7uw+Kv755eqHR516HoeJPU5dB3SrCP/JboKTJBNZyGZdxdP+Sw3bZrR4ietaod7ST/HrgN2xu2mCjVWbmFRy2btYorf9Wd4ZDllOeV+TxsduoxG3BkpymrDQorWXTzli/5crH0I9cBOTG7r9437h8Nw8vZl3G7qUIPlGBa14ncXTzlOWR5CLSrF5PZg3IrgyNVHt88piOzCQkquu3jOccrykMtC6VNccNzpEBxMVfLwu9tJHUSuYVEr3e7iKccpy/EuS7ZTlqodbnXoOCw2yiGcX8ftpgs1WJZhIWXVXTzluLejz3XK4kL7TofgoNtID2EhZdtdPOW4t6NXhlMWt7nrRoe9MKxtpCPYhiwp47CQiugunnKcsuxy6zqYoiSFsDhyi27/jF2HoUdJdY7rG+4WbCdCI5qQeywk40fUrblNUSWfl/FK7mnd3JwcT/BWAY92QzxZh4XTxS7A2J1bE8iSC41a0nsRGksK/k00+7BwczK6i8SN283OhcbfxRmtWco+LJwudgHGsu4uTrlDnWsdTk6DnT70gEWEBd1FXtwZrXc6HLdY8p9bTMEXxYsIC6eLXYCxYrqLo3G72btF0J/EekZowZ+ILiYsVtJd3MYuwoI7J+Ra0q+xaynIPvSAxYSF08UuwFgxU5HvualJJ+lv4hT4i1nsAi4qLFbQXbx2OySLNW43n8bt5thlcNdkHpOwLSosnC52Aca62AUswXUZ1yo7/K2Y7PgtLizoLspxsgDKWsY0vcWgxYWF08UuwFgXu4AlsZYx2d5i0CLDgu6iPCdrGWzmetneYtAiw8LpYhdgrItdQAxuM9dPYvHzSVbHGhQbFnQX5XL7MmqV/ec7l9nmtmLDwuliF2Csi11ALG5fRiMWP7+3txq46LCguyifW/xkWvKn3mrgosPC6WIXYKyLXUBsJ9vFuVtCZzEf3cU6uO3NjaQPcSuJzuyVmsWHhdPFLsBYF7uAFLh1jFsdDthZJcv3764iLOgu1sUdsLPGdQzTadgqwsLpYhdgrItdQErcOkajdZ2TYdZVSCsKC7qL9XEt+ZoWPgmLgLrYBRjrYheQGreOca11LHyahkXWLxmao2qHvcp+xd77cbvZxS4iRVU73Ev6OXYdVkK/VOh7a+sspPK/+3axC0iVe67kfew6jJhPtVYXFu67bsmLXqxdPMP9+b9XeXdKTKcg0grDwuliF2Csi11AylxgNCorMAgLC3QXcHdKGpUTGL31BVYZFk4XuwBjXewCUlfQrdVHy52bR6sNC7oLSN88U5JzYJgHhbTisHC62AUY62IXkINxu/mqvAOjX+Iiqw6LlXQXN7GLyEHmgdEvcZFVh4XTxS7AWLFvMQvtJDCy2u1pdebm91a3g/OcFezqfLvUF1QpqnbYSXoXuw4PH93xguboLA662AUY62IXkBt3LkYOHUa/1IUIC61i7eJN1Q5N7CJyk0lg9EtdiLD4Uxe7AGNd7AJylHhgPC45vSQsHLoLPCXhwOiXvBhh8a0udgHGutgF5CrRwHhY8mKExQm6CzwnwcAgLCLrYhdgrItdQM4SCozPbl/IYgiL76yku6hjF5GzRAJjt/QFCYvzutgFGLuNXUDuEgiM3dIXJCzOWEF30cQuoAQRA+PD0lMQibB4The7AENvYhdQikiB0S18PUmExZNK7y5Ytwhn4cD44M7gWBxh8bwudgGG6tgFlGTBwOgWuMZZhMUzSu8uENYCgRGtq5AICx+72AUgH4ZvcX9U5LNJCIuX3aucE6BPLXJu4xq5t7iHfplRF+MOyCnC4gXuD+g+dh2hxf7CK93Jy4xC+OgCKCrCwk9p3UXJb5NPRqDAeJSUxDmqhIWHAruLRR9AWrMLA+NRUpNKF0hY+CupuyAsFjQzMI5BkczaEmHhqaDu4veYt9/WygXGT/L7hvNFiQWFRFhMVUJ3UULgZWncbh502Az31F6MR0m/SrpOLSgkXgUwWdUOnaRfYtcx0z/G7Yb3iCSgaocrHR7ou3Y/1Ev6lMr6xDmExUTuD3kv6VXkUqb6osN3rGS/GJE2piETZbp28SjphqDAJQiLeXJau0huVR15IixmyKi7SHJVHXkiLOZLvbv4oERX1ZEnFjgvkOidkY86PHTUxy4EZfkhdgGZu9fhseEU7owQEjBFZ3Ghqh1uJP0WsQRCAosgLAKo2uFe0s8LX5aQwKIIi0CqdthJerfApT7oEBL7Ba4F/IGwCMg4MAgJREVYBFa1w60OC5+hFj0JCSSBsDDg3snR6bIug5BAUggLQy407nQ4Fu21xy/5osPBNPeEBFJDWCykaodrHR5Hrt0PNTo8liwdnmL9xG5LpIywAOCFZ0MAeCEsAHghLAB4ISwAeCEsAHghLAB4ISwAeCEsAHghLAB4ISwAeCEsAHghLAB4ISwAeCEsAHghLAB4ISwAeCEsAHj5fxuY+A/8ruP6AAAAAElFTkSuQmCC',

  'Gezondheid': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <path fill="{kleur}" d="M42 16h16v26h26v16H58v26H42V58H16V42h26z"/></svg>`,

  'Document': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <g fill="none" stroke="{kleur}" stroke-width="7" stroke-linejoin="round">
      <path d="M26 14h30l18 18v54H26z"/>
      <path d="M56 14v18h18"/>
      <path d="M38 52h24M38 66h24"/>
    </g></svg>`,

  'Locatie': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <path fill="{kleur}" d="M50 12c-14 0-25 11-25 25 0 18 25 51 25 51s25-33 25-51c0-14-11-25-25-25zm0 34a9 9 0 1 1 0-18 9 9 0 0 1 0 18z"/></svg>`,

  'Koffer': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <g fill="none" stroke="{kleur}" stroke-width="7" stroke-linejoin="round">
      <rect x="16" y="34" width="68" height="50" rx="6"/>
      <path d="M38 34V24h24v10M50 34v50"/>
    </g></svg>`,

  'Paspoort': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <g fill="none" stroke="{kleur}" stroke-width="7" stroke-linejoin="round">
      <rect x="24" y="14" width="52" height="72" rx="6"/>
      <circle cx="50" cy="42" r="11"/>
      <path d="M38 68h24"/>
    </g></svg>`,
};

const TEMPLATES = {
  lettertype: LETTERTYPE,
  papier: HUISSTIJL.wit,
  decoratie: DECORATIE,
  iconen: ICONEN,
  kleuren: HUISSTIJL,

  /* Exportmaten per platform. Instagram schaalt alles boven 1080 px breed zelf
     terug; Facebook adviseert minimaal 1200 px breed. */
  platforms: {
    instagram: {
      label: 'Instagram',
      maten: { staand: [1080, 1350], vierkant: [1080, 1080] },
    },
    facebook: {
      label: 'Facebook',
      maten: { staand: [1200, 1500], vierkant: [1200, 1200] },
    },
  },

  formats: {
    staand: { label: 'Staand', verhoudingLabel: '4:5', uitToolkit: true },
    // De toolkit beschrijft alleen 4:5. Bij vierkant houden we het tekstvlak
    // even hoog in pixels en levert de foto de ruimte in.
    vierkant: { label: 'Vierkant', verhoudingLabel: '1:1', uitToolkit: false },
  },

  /* Stramien, als deel van de breedte. Uit de toolkit: marge 51 px en
     tekstinspringing 83 px op een canvas van 1440 px breed. */
  stramien: {
    marge: 0.035417,
    paddingZij: 0.057639,
    tussenKopEnSub: 0.022,
    // round1Rect met adj 9492/100000: de straal is 9,492% van de kortste zijde
    // van de vorm. Precies één hoek is afgerond — rechtsonder.
    hoekFactor: 0.09492,
    // De toolkit tekent een vast tekstvlak van een halve pagina. In de
    // echte posts hugt het vlak de tekst. Met true groeit het vlak mee met
    // de tekst, met de toolkithoogte als plafond; met false krijg je exact
    // de vaste hoogte uit de toolkit.
    vlakKrimpt: true,
  },

  /* Korpsgroottes uit de toolkit, omgerekend van punten naar deel van de
     breedte (66pt = 88px op 1440px breed). De toolkit schrijft voor: hou je
     aan deze groottes en aan het maximum aantal regels. */
  korps: {
    pt66: 0.061111,
    pt54: 0.05,
    pt40: 0.037037,
    pt30: 0.027778,
    pt24: 0.022222,
  },

  regelhoogte: { kop: 1.15, sub: 1.2 },

  /*
   * De stijlen, één op één overgenomen uit de sjabloonpagina's van de toolkit.
   * `vlakHoogte` is de hoogte van het tekstvlak als deel van de BREEDTE, zodat
   * het vlak bij elk formaat even hoog blijft en de foto de rest krijgt.
   */
  stijlen: {
    fotoBovenVlak: {
      label: 'Foto boven, lichtblauw vlak',
      bron: 'Photo + Text + Link',
      positie: 'onder',
      vlakHoogte: 0.591667,
      vlakKleur: HUISSTIJL.lichtblauw,
      paddingBoven: 0.059028,
      paddingOnder: 0.0625,
      kop: { grootte: 0.05, maxRegels: 3, kleur: HUISSTIJL.blauw, gewicht: 700 },
      sub: { grootte: 0.027778, maxRegels: 1, kleur: HUISSTIJL.blauw, gewicht: 400 },
    },

    fotoBovenDiepblauw: {
      label: 'Foto boven, diepblauw vlak',
      bron: 'Variant zoals op het Instagramaccount',
      positie: 'onder',
      vlakHoogte: 0.591667,
      vlakKleur: HUISSTIJL.blauw,
      paddingBoven: 0.059028,
      paddingOnder: 0.0625,
      kop: { grootte: 0.05, maxRegels: 3, kleur: HUISSTIJL.wit, gewicht: 700 },
      sub: { grootte: 0.037037, maxRegels: 2, kleur: HUISSTIJL.wit, gewicht: 400 },
    },

    vlakBovenFoto: {
      label: 'Tekst boven, foto onder',
      bron: 'Text + photo_1',
      positie: 'boven',
      vlakHoogte: 0.39375,
      vlakKleur: HUISSTIJL.wit,
      paddingBoven: 0.120833,
      paddingOnder: 0.02,
      kop: { grootte: 0.05, maxRegels: 2, kleur: HUISSTIJL.blauw, gewicht: 700 },
      sub: { grootte: 0.037037, maxRegels: 2, kleur: HUISSTIJL.donkerblauw, gewicht: 400 },
    },

    fotoBovenWit: {
      label: 'Foto boven, tekst op wit',
      bron: 'Text + photo_2',
      positie: 'onder',
      vlakHoogte: 0.590972,
      vlakKleur: HUISSTIJL.wit,
      paddingBoven: 0.075,
      paddingOnder: 0.06,
      kop: { grootte: 0.061111, maxRegels: 2, kleur: HUISSTIJL.blauw, gewicht: 700 },
      sub: { grootte: 0.037037, maxRegels: 5, kleur: HUISSTIJL.donkerblauw, gewicht: 400 },
    },

    tekstOpFoto: {
      label: 'Tekst op de foto',
      bron: 'Text + big photo',
      positie: 'opFoto',
      vlakHoogte: 0,
      vlakKleur: null,
      paddingBoven: 0.077083,
      paddingOnder: 0,
      kop: { grootte: 0.05, maxRegels: 2, kleur: HUISSTIJL.wit, gewicht: 700 },
      sub: { grootte: 0.037037, maxRegels: 2, kleur: HUISSTIJL.wit, gewicht: 400 },
    },
  },
};
