# Nexene Ops

Erster funktionsfähiger Entwicklungsstand für den Nexene-Agenturworkspace. Next.js App Router, React, SQLite (Node.js 24), Tiptap. Kein separater Datenbankserver. Slack und Hermes sind V2.

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
npm run build
```

Die Tests verwenden temporäre SQLite-Datenbanken und echte Request-/Response-Aufrufe gegen dieselbe API-Implementierung wie Next.js. Sie prüfen fremde Kundenbereiche, interne Daten, Single-Use-Login, Kommentare, Freigaben und Wiederholungen.

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
docker compose up -d --build
```

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
docker compose exec ops node scripts/backup.mjs
```

Wiederherstellung: Anwendung stoppen, ausgewählte Sicherung als `ops.sqlite` in ein **leeres** Datenvolume kopieren, Dateirechte auf UID 1000 setzen, Anwendung starten. Alte `ops.sqlite-wal` und `ops.sqlite-shm` dürfen dabei nicht übernommen werden. Zuerst in einer separaten Instanz prüfen. Nach Wiederherstellung bei Bedarf `DELETE FROM sessions; DELETE FROM auth_tokens;` mit SQLite ausführen, um gesicherte Sitzungen/Links zu entwerten. Das Repository enthält keine Produktionsdaten.

## Struktur

`app/`: Oberfläche und Next.js-Routen. `lib/db.mjs`: Schema und Datenhaltung. `lib/api.mjs`: Validierung, Zugriffskontrolle und Fachabläufe. `lib/auth.mjs`: Anmeldung, Sitzungen und Mail. `scripts/backup.mjs`: konsistente Sicherung. Daten liegen zentral in SQLite. Ein späterer Datenbankwechsel erfordert eine geplante Datenmigration.
