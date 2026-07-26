# Dincolo de Granițe

Site oficial al podcastului **Dincolo de Granițe** — poveștile românilor din întreaga lume.
Live: **https://www.dincolodegranite.com**

Lansare planificată: **septembrie 2026**. Gazdă: Peter Baghiu. Filmat în studioul din Kent sau pe Zoom.

---

## Cum funcționează (pe scurt)

Site static, fără build. Scrii în `site/`, dai push pe `main`, Vercel publică singur în ~40 secunde.
Conținutul care se schimbă des (episoade, setări, countdown) vine din Supabase și se editează din `/admin` — fără cod.

---

## Infrastructură

| Ce | Unde | Detalii |
|---|---|---|
| Cod | GitHub `Dincolodegranite/podcast` | branch `main` |
| Hosting | Vercel | root directory `site`, `cleanUrls` activ |
| Domeniu | GoDaddy | `www.dincolodegranite.com` |
| Bază de date | Supabase `fgwsmrwhuzkvrixcgovk` | regiune eu-west-1 |
| Email | Microsoft 365 | `contact@dincolodegranite.com` |

### ⚠️ De nu atins în DNS la GoDaddy
- **Nu șterge și nu modifica înregistrările MX** — pe ele merge emailul (Microsoft 365).
- **Nu schimba nameserverele.**

---

## Structura fișierelor

```
site/
├── index.html      pagina principală (tot conținutul + dicționarele RO/EN)
├── despre.html     povestea ta și formatul emisiunii
├── episoade.html   arhiva completă, se încarcă din Supabase
├── invitati.html   formularul de propuneri
├── contact.html
├── termeni.html    termeni și condiții
├── privacy.html    politica de confidențialitate (GDPR)
├── 404.html
├── admin.html      consola de administrare (→ /admin)
├── enhance.js      harta diasporei, countdown, ceasuri, animații scroll
├── social.js       aduce linkurile și textele editabile din Supabase
├── pages.css       stilurile comune ale paginilor secundare
├── sitemap.xml     pentru Google
└── robots.txt      blochează /admin la indexare
```

---

## Consola de administrare

Intri la **https://www.dincolodegranite.com/admin** cu contul de Supabase.
Ca să vezi date, emailul tău trebuie să existe în tabela `admins`.

**Episoade** — adaugi, editezi, publici. Când pui linkul de YouTube, eticheta de pe pagina principală trece automat din „ÎN CURÂND" în „VIZIONEAZĂ".

**Abonați** — lista de emailuri strânse din formularul de newsletter.

**Invitați** — propunerile primite. Poți compune un răspuns direct de aici (acceptare / amânare / refuz, personalizat cu numele lor); răspunsul se salvează în istoric și se deschide în clientul tău de email.

**Setări** — toate se aplică pe site în câteva secunde după salvare:
- linkuri social media (YouTube, Instagram, TikTok, Facebook, Apple Podcasts, Spotify)
- fișa tehnică din cardul „Despre" (format, eticheta sezonului, data, locul filmării, gazda)
- **data și ora următorului episod** → countdown-ul de pe prima pagină

> Butoanele Apple Podcasts și Spotify sunt ascunse până completezi linkurile.

---

## Tabele Supabase

| Tabelă | Rol |
|---|---|
| `episodes` | episoadele; se citesc public doar cele cu `published = true` |
| `subscribers` | abonații la newsletter |
| `guest_applications` | propunerile de invitați |
| `guest_replies` | istoricul răspunsurilor trimise |
| `site_settings` | linkuri + texte editabile + data countdown-ului |
| `admins` | cine are acces la `/admin` |

Securitate: RLS activ. Publicul poate doar să **insereze** (formulare) și să citească `site_settings` + episoadele publicate. Restul e vizibil numai adminilor, prin funcția `is_admin()`.
Harta folosește `get_guest_cities()`, care returnează doar oraș + număr — niciun nume, niciun email.

---

## Ce e pe prima pagină

1. **Hero** — titlu, sloganul „Fiecare om are o poveste. Unele schimbă vieți."
2. **Marquee** — antreprenori · profesioniști · investitori
3. **Despre** — citat, buton spre povestea completă, fișă tehnică (editabilă din admin)
4. **Harta diasporei** — scrii orașul, vezi distanța până acasă și drumul desenat pe hartă
5. **Explorează conversațiile** — primele trei episoade
6. **Comunitate** — countdown + abonare la newsletter
7. **Urmărește-ne pe YouTube** — tabloul de plecări, în stil aeroport
8. **Footer** — invitație la comunitate + social media

---

## Lucruri de știut înainte să modifici

**Textele stau în două locuri.** Fiecare text de pe prima pagină apare atât în dicționarele RO/EN de la începutul `index.html`, cât și în markup. Dacă schimbi doar unul, textul revine la vechea variantă când se încarcă pagina. Schimbă-le pe amândouă.

**Harta desenează doar orașe pe care le cunoaște.** Coordonatele sunt într-o listă fixă de ~181 de locuri din `enhance.js`. Dacă un invitat scrie un oraș care nu e în listă, punctul **nu apare și nu primești nicio eroare** — codul ignoră în silențiu ce nu găsește. Fiecare intrare acceptă și numele țării ca alias („Maldives", „Israel", „Malta").

**Butoanele aurii au un singur stil.** Gradient `#e3c07d → #c9a25a → #b89350`, cu o linie albă subtilă în partea de sus. Dacă adaugi un buton principal nou, copiază stilul de la „POVESTEA COMPLETĂ" sau folosește clasa `.btn-gold` pe paginile secundare.

**Titlurile de secțiune apar cu majuscule** indiferent cum le scrii — fontul Bebas Neue are doar litere mari.

**Spațiul titlu–card e 16px** la toate secțiunile. E măsurat, nu aproximat.

---

## Ce a mai rămas de făcut

**De partea ta**
- [ ] Setează data countdown-ului în admin → Setări
- [ ] Șterge episodul de test „Test 2026"
- [ ] Trimite pagina principală la reindexare în Google Search Console (descrierea veche menționa doar Marea Britanie)
- [ ] Pune un portret real pe pagina Despre, în locul plăcuței „PORTRET ÎN CURÂND"
- [ ] Activează Vercel Analytics, dacă vrei statistici
- [ ] Confirmă conturile de social media și pune linkurile în admin

**Pentru mai târziu**
- [ ] Trimiterea emailurilor direct din site, la răspunsurile către invitați. Acum se deschide clientul tău de email, pentru că un site static nu poate trimite singur. Ar fi nevoie de un cont Resend și de o cheie API introdusă de tine în Supabase.
- [ ] Semnalarea în admin a locațiilor pe care harta nu le recunoaște, ca să nu mai descoperi întâmplător că lipsește un punct.
- [ ] Primele mesaje de invitație. Lista de invitați potriviți e pregătită.

---

## Poziționare

Podcast despre **românii din întreaga lume** care își spun povestea — România, Marea Britanie, Europa, America, Canada, Australia, oriunde.

Teme: viață, antreprenoriat, carieră, investiții, educație, familie, credință, cultură, provocări.
Accentul e pe **drumul până la reușită**, nu doar pe rezultat. Explicit nu varianta lustruită de LinkedIn.

Structura unui episod, în trei acte: **drumul → construcția → lecțiile**.

> Mențiunile despre Marea Britanie rămase pe site sunt intenționate: biografia ta (fotograf stabilit în Kent), studioul, și operatorul legal din Termeni și Confidențialitate. Nu sunt afirmații despre invitați.
