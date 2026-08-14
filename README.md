# THEGND

Premium-Verzeichnis für Escorts, Agenturen & Clubs — gebaut mit **Next.js 16.2.12** (App Router),
**Railway Postgres**, **Railway S3** und **Resend**.

Dark/Light Mode, komplett deutschsprachige Oberfläche, Server Actions statt REST-Wildwuchs,
strikt typisiert (Prisma + Zod), moderiert und DSGVO-orientiert.

---

## Feature-Überblick

**Öffentlich**
- Startseite mit Hero-Suche, Spotlight-, Online-, Neu- und Top-Rating-Rails
- Profilsuche mit über 20 Filtern (Stadt, Kategorie, Geschlecht, Alter, Preis, Figur, Haare, Herkunft,
  Cup, Services, Sprachen, Treffpunkt, online/verifiziert/mit Video/mit Bewertungen) + 7 Sortierungen
- Profildetailseite: Galerie mit Lightbox, Steckbrief, Services nach Kategorie, Preistabelle,
  Erreichbarkeitszeiten, Tourplan, Bewertungen mit Teilnoten, ähnliche Profile, JSON-LD
- Städteverzeichnis A–Z, Tourplan, Agentur-/Clubseiten, Community-Feed mit Stories, Magazin
- Command-Palette-Suche (⌘K) mit Live-Vorschlägen
- Altersverifikation (18+), RTA-Label, Sicherheits-Guide, Meldeformular, vollständige Rechtstexte

**Für Anbieter:innen**
- Onboarding-Wizard, Profileditor in 6 Tabs (Grunddaten, Aussehen, Standort, Preise,
  Services & Sprachen, Kontakt & SEO)
- Medienverwaltung: Drag-&-Drop-Upload direkt zu S3 (presigned PUT), Fortschrittsanzeige,
  Titelbild, private Alben mit Credit-Freischaltung
- Erreichbarkeitszeiten, Tourplan, Pinnwand/Feed-Beiträge
- Buchungsanfragen annehmen/ablehnen/abschließen, Messenger mit Polling
- Bewertungen öffentlich beantworten
- Statistiken: Aufrufe (30-Tage-Chart), Favoriten, Besucher, Herkunft
- Sichtbarkeit: Bump, Top-Platzierung, Spotlight, Highlight, Story-Pin, Banner (Credits)
- Kostenlose Verifizierung (Ausweis + Selfie-Code, verschlüsselt, Presigned-Download für Moderation)

**Für Mitglieder**
- Favoriten, gespeicherte Suchen mit E-Mail-Alarm, Benachrichtigungen
- Messenger, Buchungsanfragen, Bewertungen, Geschenke
- Credit-Wallet mit Paketen, Transaktionshistorie und Rechnungen

**Administration**
- Aufgaben-Dashboard, Profilfreigabe, Medien-Moderation, Verifizierungsprüfung,
  Bewertungs-Moderation, Meldungsbearbeitung, Nutzerverwaltung (sperren, Credits buchen), Audit-Log

---

## Stack

| Bereich | Technologie |
| --- | --- |
| Framework | Next.js 16.2.12 (App Router, Server Actions, Turbopack) |
| Sprache | TypeScript (strict) |
| Datenbank | PostgreSQL (Railway) via Prisma 6 |
| Speicher | Railway S3 Bucket (`@aws-sdk/client-s3`, presigned Uploads) |
| E-Mail | Resend |
| UI | Tailwind CSS v4, Radix Primitives, lucide-react, sonner |
| Auth | Eigene Session-Auth (bcrypt + httpOnly-Cookie, DB-Sessions) |
| Validierung | Zod |

---

## Schnellstart (lokal, mit Railway)

Voraussetzung: [Railway CLI](https://docs.railway.com/guides/cli) installiert.

```bash
npm install
railway login
railway link -p TheGND

# Postgres von außen erreichbar machen (einmalig)
railway tcp-proxy create --port 5432 --service Postgres

# Bucket anlegen, falls noch keiner existiert
railway bucket create thegnd

# Zugangsdaten für Postgres + Bucket nach .env schreiben
npm run railway:env

npm run db:deploy      # Migrationen anwenden
npm run db:seed        # Stammdaten + Demo-Inhalte
npm run s3:setup       # CORS setzen und Bucket verifizieren
npm run dev
```

Demo-Zugänge nach dem Seed:

| Rolle | E-Mail | Passwort |
| --- | --- | --- |
| Admin | `admin@thegnd.net` | `Admin1234!` |
| Mitglied | `demo@thegnd.net` | `Demo1234!` |
| Escort | `sophia0@demo.thegnd.net` | `Demo1234!` |

> Ändere diese Zugangsdaten vor dem ersten Deployment.

---

## Railway Postgres

- **Lokal** läuft die Verbindung über den öffentlichen TCP-Proxy
  (`xxx.proxy.rlwy.net:PORT`). Der Proxy ist die einzige Möglichkeit, von außen
  auf die Datenbank zuzugreifen — er lässt sich jederzeit wieder entfernen:
  ```bash
  railway tcp-proxy list --service Postgres
  railway tcp-proxy delete <proxy-id> --yes
  ```
- **Im Deployment** wird `postgres.railway.internal:5432` verwendet: privates
  Netz, kein Egress-Traffic, kein öffentlicher Zugang nötig. Am einfachsten per
  Variablen-Referenz im App-Service:
  ```
  DATABASE_URL = ${{Postgres.DATABASE_URL}}
  ```
- Das Schema wird über Prisma-Migrationen verwaltet
  (`prisma/migrations/`). Beim Deploy läuft automatisch `prisma migrate deploy`.

## Railway Bucket

Der Bucket ist S3-kompatibel (Tigris, `*.storageapi.dev`) und wird über
`railway bucket` verwaltet:

```bash
railway bucket list
railway bucket credentials --bucket thegnd --json
```

Wichtige Eigenheiten und wie die App damit umgeht:

| Eigenschaft | Umsetzung |
| --- | --- |
| **Virtual-Host-URLs** | `S3_FORCE_PATH_STYLE="false"` |
| **Buckets sind privat** — weder `PutBucketPolicy` noch `public-read`-ACL werden unterstützt | Medien laufen über die App-Route `/media/<key>`, die mit eigener Zugriffskontrolle streamt |
| **Direkt-Upload aus dem Browser** | Presigned `PUT` über `/api/uploads/presign`; `npm run s3:setup` setzt die nötigen CORS-Regeln |
| **Ausweisdokumente** | Präfix `verification/`, nur für Eigentümer:in und Moderation; zusätzlich kurzlebige presigned Links in der Admin-Ansicht |

Schlüssel-Schema: `<scope>/<userId>/<datum>/<zufallshash>.<ext>`

| Präfix | Zugriff | Cache |
| --- | --- | --- |
| `gallery/`, `profile/`, `post/`, `story/`, `blog/` | öffentlich | `max-age=31536000, immutable` |
| `verification/` | Eigentümer:in + Moderation | `no-store` |
| `message/` | Beteiligte der Unterhaltung | `no-store` |

Hängt später ein CDN mit öffentlichem Lesezugriff vor dem Bucket, genügt es,
`S3_PUBLIC_URL` zu setzen — dann werden direkte URLs statt `/media` gespeichert.
Neue CORS-Origins nachziehen mit:

```bash
S3_EXTRA_CORS_ORIGINS="https://thegnd.net" npm run s3:setup
```

---

## Deployment auf Railway

```bash
railway add --service thegnd-web        # Service anlegen
railway up --service thegnd-web         # Code deployen
```

Variablen für den Web-Service (Dashboard oder `railway variables --set`):

```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
NEXT_PUBLIC_APP_URL = https://<deine-domain>
AUTH_SECRET = <openssl rand -base64 48>
S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION
S3_FORCE_PATH_STYLE = false
RESEND_API_KEY, EMAIL_FROM
```

`railway.json` ist bereits hinterlegt:
Build `npm run build`, Start `npx prisma migrate deploy && npm run start`,
Healthcheck `/api/health` (prüft Datenbank **und** Bucket).

---

## Farbsystem

Die Marke hat **genau eine Farbe**, definiert an **einer einzigen Stelle** —
`src/app/globals.css`:

```css
:root {
  --brand-h: 345.3;
  --brand-s: 82.7%;
  --brand-l: 40.8%;
}
```

Daraus wird alles Weitere abgeleitet — Marke ändern heißt: diese drei Zahlen ändern.

| Token | Ableitung | Verwendung |
| --- | --- | --- |
| `--brand` | `hsl(h s l)` | Buttons, Logo, Links, aktive Zustände |
| `--brand-hover` | `l + 6%` | Hover |
| `--brand-active` | `l − 5%` | Klick |
| `--brand-soft` | 12 % Deckkraft | Flächen, Hintergrundschimmer |
| `--brand-ring` / `--brand-glow` | 45 % / 32 % Deckkraft | Fokusring, Schatten |
| `--brand-foreground` | Weiß | Text auf Markenflächen |

`--primary` und `--ring` zeigen auf `--brand`; Light- und Dark-Mode nutzen
denselben Wert.

**Verläufe gibt es nicht mehr.** Was früher `primary → accent` war, ist jetzt
Vollton: die Button-Variante heißt `brand` (vorher `gradient`), Logo-Marken und
Schritt-Icons nutzen `.brand-surface`, der Hintergrundschimmer `.surface-glow`.

Komponenten enthalten **keine Farbwerte**, nur Tokens:

| Token | Zweck |
| --- | --- |
| `--info` | Verifiziert-Badge |
| `--rating` | Bewertungssterne |
| `--success` `--warning` `--danger` | Statusmeldungen |
| `--accent` | Gold für Premium-/TOP-Marker |
| `--surface` `--surface-invert` `--overlay` | Flächen |

Für Kanäle ohne CSS-Variablen (E-Mail-Templates, `theme-color`-Meta-Tag) liegt
derselbe Wert in [`src/lib/brand.ts`](src/lib/brand.ts); der Hex-Wert wird dort
aus den HSL-Kanälen **berechnet**, nicht abgetippt.

**Eckenradien statt Pillen.** Nichts auf der Seite ist vollständig rund —
kein `rounded-full`. Der Radius richtet sich nach der Elementgröße:
`rounded-xl` für Buttons, Eingaben und Karten-Innenflächen, `rounded-2xl` für
Karten, `rounded-lg` für Chips und Icon-Buttons, `rounded-md` für Badges und
Zähler, `rounded-xs` für Punkte, Fortschritts- und Skeleton-Balken. Auch
Avatare, Schalter, Radio-Buttons und Slider-Griffe sind abgerundete Rechtecke.

**Auswahlfelder sind eigene Komponenten.** Kein `<select>` des Browsers mehr —
[`Select`](src/components/ui/select.tsx) auf Radix-Basis zeichnet Trigger und
Liste selbst, damit die Darstellung auf macOS, Windows, Android und iOS
identisch ist und dem Dark Mode folgt. Die API bleibt an `<select>` angelehnt
(`<option>`-Kinder, `name`, `defaultValue`, `value`/`onChange`); der Wert geht
über ein verstecktes Feld ins FormData, Server Actions bleiben unverändert.
Pflichtfelder validiert der Server (Zod), nicht der Browser.

**Flaggen sind Grafiken, keine Emojis.** Länder- und Sprachflaggen laufen über
[`FlagAvatar`](src/components/ui/flag-avatar.tsx): eine gefüllte Kachel mit
abgerundeten Ecken, darin ein quadratisches SVG aus `public/flags`
(Satz von `flag-icons`, MIT). Das Länderkürzel wird aus dem in der Datenbank
hinterlegten Flaggen-Emoji abgeleitet (🇬🇧 → `GB`), sodass Sprachen wie Englisch
oder Tschechisch die richtige Flagge bekommen. Emojis wären keine Lösung: sie
sehen auf jedem System anders aus und fehlen unter Windows ganz.
Flaggensatz aktualisieren: `npm run flags:sync`.

**Karten sind flach und ruhig.** Keine Schlagschatten, kein Anheben beim
Hover, kein Zoom auf den Bildern — Karten
werden ausschließlich über `border` und `bg-card` vom Hintergrund abgesetzt.
Schatten bleiben nur dort, wo eine Ebene tatsächlich über dem Inhalt schwebt:
Dialog, Dropdown, Popover, Tooltip, Toast und die mobile Navigation.

Ausgenommen sind bewusst Bild-Overlays (`bg-black/60`, `text-white` über Fotos) —
das sind Abdunklungen für Lesbarkeit auf Bildern, keine Markenfarben.

---

## Projektstruktur

```
prisma/
  schema.prisma        Datenmodell (35 Modelle, 25 Enums)
  seed.ts              Stammdaten, Magazin, Demo-Profile
src/
  app/
    (site)/            Öffentliche Seiten inkl. Escort-Detailseite
    (auth)/            Login, Registrierung, Passwort, E-Mail-Bestätigung
    dashboard/         Bereich für Mitglieder und Anbieter:innen
    admin/             Moderation & Verwaltung
    api/               Presign-Upload, Suche, Messaging-Poll, Presence, Health
    media/[...key]/    Geschützte Auslieferung der Bucket-Objekte
  components/
    ui/                Button, Input, Card, Badge, Radix-Primitives
    layout/            Header, Footer, Navigation
    profile/           Karte, Galerie, Kontaktkarte, Bewertungen
    dashboard/         Editor, Medienmanager, Chat, Boost-Shop …
    admin/             Moderationskomponenten
  lib/                 db, auth, s3, mail, utils, constants, validators
  server/
    actions/           Server Actions (auth, profile, interactions, payments, admin)
    queries/           Lesende Datenbankzugriffe
scripts/
  setup-bucket.ts      CORS setzen, Bucket verifizieren   (npm run s3:setup)
  sync-railway-env.ts  Railway-Zugangsdaten nach .env     (npm run railway:env)
```

---

## Sicherheit & Compliance

- Passwörter mit bcrypt (Cost 12), Sessions in der Datenbank, httpOnly/SameSite-Cookies
- Rate-Limiting für Login, Registrierung, Passwort-Reset, Nachrichten und Meldungen
- Ausweisdokumente ausschließlich über presigned URLs, nie öffentlich, Löschfrist 90 Tage
- Meldefunktion auf Profilen, Nachrichten, Bewertungen und Beiträgen; Audit-Log für Team-Aktionen
- Altersgate (18+), RTA-Meta-Tag, `robots.txt` sperrt Dashboard, Admin und KI-Crawler
- Sicherheits-Header (nosniff, Referrer-Policy, Frame-Options, Permissions-Policy)

Die Rechtstexte unter `/agb`, `/datenschutz`, `/impressum`, `/richtlinien` und `/2257` sind
sorgfältig ausgearbeitete Vorlagen — **vor dem Livegang anwaltlich prüfen und an den
Unternehmenssitz anpassen.**

---

## Nützliche Befehle

```bash
npm run dev          # Entwicklungsserver
npm run build        # Produktionsbuild (inkl. prisma generate)
npm run start        # Produktionsserver
npm run typecheck    # TypeScript ohne Emit
npm run db:push      # Schema ohne Migration übernehmen
npm run db:migrate   # Migration erstellen
npm run db:deploy    # Migrationen im Deployment anwenden
npm run db:studio    # Prisma Studio
npm run db:seed      # Seed erneut ausführen
npm run railway:env  # Zugangsdaten aus Railway nach .env holen
npm run s3:setup     # Bucket-CORS setzen und Verbindung prüfen
npm run icons        # App-Symbole neu erzeugen (nach Farbwechsel)
```

---

## Als App installierbar (PWA)

Die Seite lässt sich auf Handy und Rechner installieren: eigenes Symbol, Start ohne Browserleiste,
Kurzbefehle für Escorts, Häuser, Feed und Nachrichten.

| Baustein | Ort |
| --- | --- |
| Manifest | `src/app/manifest.ts` → `/manifest.webmanifest` |
| Service Worker | `public/sw.js` (angemeldet von `src/components/pwa/pwa-provider.tsx`) |
| Offline-Seite | `src/app/offline/page.tsx` |
| Symbole | `public/icons/*`, `src/app/icon.svg`, `src/app/apple-icon.png` — erzeugt mit `npm run icons` |

**Was zwischengespeichert wird:** zuletzt besuchte öffentliche Seiten, gebaute Dateien, Bilder.
**Was nie:** Dashboard, Admin, Anmeldung und alle Schnittstellen — auf geteilten Geräten sollen keine
persönlichen Inhalte im Zwischenspeicher liegen bleiben.

Im Entwicklungsbetrieb meldet sich der Service Worker mit `?modus=dev` an und speichert nur die
Offline-Seite — sonst hinge man nach jeder Änderung an alten Bündeln. Zum Prüfen der echten
Installation:

```bash
npm run build && npm run start
```

Installierbar ist die App nur über HTTPS (`localhost` ausgenommen) — in der Produktion also über die
eigene Domain. Für iOS-Startbildschirme fehlen bewusst die vielen einzelnen Startgrafiken; Safari
zeigt dort die Hintergrundfarbe aus dem Manifest.

---

## Nächste Ausbaustufen

- Zahlungsanbieter anbinden (`createOrderAction` erzeugt bereits Bestellungen mit Rechnungsnummer;
  der Webhook muss nur noch `completeOrderAction` aufrufen)
- WebSockets statt Polling für den Messenger
- Bild-Pipeline mit `sharp`: Thumbnails, Blurhash, Wasserzeichen beim Upload
- Zwei-Faktor-Authentifizierung (Felder liegen bereits im Schema)
- Cronjob für Suchauftrags-Benachrichtigungen und ablaufende Boosts
