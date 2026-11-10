# Nexene Ops

Aktuelle Version: **v1.6.0**. Änderungen und Bedienung der Phasengewichtung: [CHANGELOG.md](CHANGELOG.md).

**Hosting auf Vercel:** [Einrichtung mit Turso-Datenbank](docs/VERCEL.md). Kein Docker, VPS oder eigener Reverse Proxy nötig.

Die bisherige [Hostinger-Anleitung](docs/HOSTINGER.md) bleibt für den alternativen Docker-Betrieb verfügbar.

Funktionsfähiger Entwicklungsstand für den Nexene-Agenturworkspace. Next.js App Router, React mit streng geprüftem TypeScript, SQLite/Turso-libSQL (Node.js 24), Tiptap. Die serverseitige Fachlogik bleibt in getesteten JavaScript-Modulen; gemeinsame API-Datenverträge sind typisiert. Kein separater Datenbankserver. Slack und Hermes sind V2.

Die Oberfläche verwendet die Nexene-CI: Vermillion Grey 1 `#F8F1F1`, Night Black `#0C0910`, Vermillion `#F64740`. Kleine Akzenttexte verwenden einen dunkleren Rotton für ausreichenden Kontrast. Die Hauptnavigation, Dialoge und Aufgaben sind per Tastatur bedienbar. Native modale Dialoge begrenzen den Fokus, schließen mit Escape und geben den Fokus an den Auslöser zurück.

## Lokal starten

Voraussetzung: Node.js 24 oder neuer.

```sh
npm ci
cp .env.example .env.local
# ADMIN_EMAILS auf die eigenen Adressen setzen.
npm run dev
```

http://localhost:3000 öffnen. Freigeschaltete Admin-Adresse eingeben; bei `DEV_MAIL_LOG=true` steht der Anmeldelink ausschließlich im lokalen Serverterminal. Mit `SEED_DEMO=true` werden beim ersten Start drei ausdrücklich fiktive Beispielkunden angelegt. Ohne diese Einstellung startet der Workspace leer. Keine öffentliche Registrierung und kein Demo-Login im Produktionsbetrieb.

## Was funktioniert

- Kunden und mehrere erlaubte Kundenkontakte anlegen, Zugriff entziehen.
- Projekte mit Standardvorlage und Projektphasen, Aufgaben und Unteraufgaben anlegen.
- Aufgabenliste, verschiebbares Kanban, Monatskalender und einfacher Zeitplan.
- Zuweisungen an Admins, Prioritäten, interne/kundensichtbare Kommentare, wöchentliche/monatliche Folgeaufgaben bei Abschluss.
- Verschachtelte Dokumente mit Markdown-Kürzeln, Formatierungsleiste, internen Links und Dokumentvorlagen. Explizites Speichern schützt vor überraschender Veröffentlichung während des Schreibens.
- Geführtes [Kunden-Onboarding](docs/ONBOARDING.md) mit gespeicherten Zwischenständen und Zusammenfassung unter Dokumente.
- Eigenständiges Kundenportal ohne Admin-Navigation. SEO-/GEO-Projekte mit privaten PDF-Reports bis 3 MB statt Projektfortschritt.
- Ressourcenlinks, manuelle Zeiteinträge, Festpreis-/Stundenbudget. Zeiten und Budgets sind ausschließlich intern.
- Kunden können sichtbare Inhalte ansehen, kommentieren und angeforderte Freigaben mit Feedback entscheiden. Entscheidungen sind mit Kontakt und Zeit gespeichert.
- Deutsch/Englisch umschalten; redaktionelle Inhalte und Projektphasennamen bleiben in ihrer eingegebenen Sprache.

Offene Teile und Abgrenzung: [docs/PLAN.md](docs/PLAN.md).

## E-Mail und Anmeldung

`APP_URL` muss exakt dem Browser-Ursprung entsprechen. SMTP, Absender und Admin-Adressen über Umgebungsvariablen konfigurieren. Port 587 nutzt verpflichtend STARTTLS; für Port 465 `SMTP_SECURE=true`. Keine selbstsignierten Zertifikate ohne korrekt konfigurierte Vertrauenskette. Kein Login-Link wird an den Browser zurückgegeben. Fehlermeldungen unterscheiden unbekannte und bekannte Adressen nicht. Magic Links laufen nach 15 Minuten ab, sind einmalig nutzbar und werden nur gehasht gespeichert. Sitzungen gelten sieben Tage; unter HTTPS sind Cookies Secure und immer HttpOnly/SameSite=Lax.

E-Mail-Adressen werden durch Admins freigeschaltet. Kontakte verwenden anschließend die normale Login-Seite. Kundenrechte werden bei jedem API-Zugriff geprüft. Eine spätere Einschränkung auf einzelne Projekte desselben Kunden benötigt ein erweitertes Berechtigungsmodell.

## Prüfen

```sh
npm test
npm run test:libsql
npm run typecheck
npm run build
npm run test:browser
```

Die Tests verwenden temporäre SQLite-Datenbanken und echte Request-/Response-Aufrufe gegen dieselbe API-Implementierung wie Next.js. Sie prüfen fremde Kundenbereiche, interne Daten, Single-Use-Login, Kommentare, Freigaben, Wiederholungen und konkurrierende Dokumentänderungen.

`npm run test:browser` startet selbst einen isolierten Entwicklungsserver mit temporärer Datenbank, führt Browserabläufe sowie axe-Prüfungen für WCAG 2 A/AA, 2.1 AA und 2.2 AA aus und beendet die Instanz anschließend. Chromium wird unter `/usr/bin/chromium` erwartet; der Pfad lässt sich mit `CHROMIUM_PATH` konfigurieren. Die Testausgabe unterscheidet automatisierte Prüfungen von der weiterhin notwendigen Nutzerabnahme und manuellen Screenreader-Prüfung.

Dokumentänderungen benötigen die geladene `expected_revision`. Der Server weist überholte Änderungen mit HTTP 409 ab; der Editor behält den lokalen Entwurf und bietet bewusstes Neuladen an. Es gibt keine automatische Zusammenführung und keine Versionshistorie. Die Datenbankmigration auf Schema 2 ergänzt Revisionsnummern ohne bestehende Inhalte zu löschen. Vor einem produktiven Update eine Sicherung erstellen.

Ein zusätzlicher Browser-Smoke-Test prüft mit Chromium den Login, alle Aufgabenansichten, das Erstellen einer Aufgabe, das Speichern/Neuladen eines Dokuments, den Sprachwechsel und eine echte Kundenfreigabe. Nur gegen eine isolierte Entwicklungsinstanz ausführen, weil Testkontakte und Testinhalte angelegt werden:

```sh
# Entwicklungsserver separat mit DATA_DIR=/tmp/nexene-preview starten.
# Einmal die Login-Seite aufrufen, damit die Datenbank initialisiert wird.
TEST_DATA_DIR=/tmp/nexene-preview CHROMIUM_PATH=/usr/bin/chromium node tests/browser.mjs
```

## Docker auf dem VPS

```sh
cp .env.example .env
# APP_URL=https://ops.eure-domain.at, ADMIN_EMAILS und SMTP eintragen.
mkdir -p backups
# Container läuft als node (UID 1000); Backup-Verzeichnis für diese UID schreibbar machen.
sudo chown 1000:1000 backups
docker compose -f compose.local.yaml up -d --build
```

Diese Befehle verwenden die Variante für einen lokalen Checkout (`compose.local.yaml`). Für den URL-Import die oben verlinkte Hostinger-Anleitung verwenden.

Ein bestehender Reverse Proxy (z. B. Caddy/Nginx) terminiert HTTPS und leitet auf `127.0.0.1:3000` weiter. Eine einzelne App-Instanz betreiben; SQLite liegt lokal im benannten Volume `ops_data`. Das Volume bei Updates behalten. `docker compose down -v` löscht die Daten und darf nicht für normale Updates verwendet werden. Geheimnisse ausschließlich auf dem Server konfigurieren.

Im verwalteten Codex-Environment kann der Build mit dessen Proxy-CA erfolgen:

```sh
docker build --secret id=proxy_ca,src="$CODEX_PROXY_CERT" -t nexene-ops .
```

## Backup und Wiederherstellung

SQLite-Online-Backup ist auch bei laufender Anwendung konsistent; das Skript prüft die Integrität. Regelmäßig ausführen und Sicherungen zusätzlich außerhalb des VPS speichern. Backups enthalten Kundendaten und aktive Login-Sitzungen und müssen entsprechend geschützt werden.

```sh
# Lokal (DATA_DIR ggf. setzen):
npm run backup
# Im Container:
docker compose -f compose.local.yaml exec ops node scripts/backup.mjs
```

Wiederherstellung: Anwendung stoppen, ausgewählte Sicherung als `ops.sqlite` in ein **leeres** Datenvolume kopieren, Dateirechte auf UID 1000 setzen, Anwendung starten. Alte `ops.sqlite-wal` und `ops.sqlite-shm` dürfen dabei nicht übernommen werden. Zuerst in einer separaten Instanz prüfen. Nach Wiederherstellung bei Bedarf `DELETE FROM sessions; DELETE FROM auth_tokens;` mit SQLite ausführen, um gesicherte Sitzungen/Links zu entwerten. Das Repository enthält keine Produktionsdaten.

## Struktur

`app/features/`: eigenständige Bereiche für Projekte, Aufgaben, Dokumente, Kunden und Verwaltung. `app/ui/`: gemeinsame UI-Bausteine und modale Dialoge. `app/use-workspace.tsx`: gemeinsamer Anwendungszustand. `lib/types.ts`: Datenverträge. `lib/client.ts`: HTTP-Client mit Zeitlimit und Fehlerbehandlung. `lib/i18n.ts`: UI-Texte. `lib/database.mjs`: asynchroner libSQL-Zugriff und transaktionale Initialisierung für Turso/Vercel. `lib/schema.mjs`: gemeinsames Schema. `lib/db.mjs`: lokale SQLite-Initialisierung. `lib/api.mjs`: Validierung, Zugriffskontrolle und Fachabläufe. `lib/auth.mjs`: Anmeldung, Sitzungen und Mail. `scripts/backup.mjs`: konsistente Sicherung. Daten liegen zentral in SQLite. Ein späterer Datenbankwechsel erfordert eine geplante Datenmigration.
