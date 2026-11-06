# Prüfung des ersten Entwicklungsstands

6. November 2026, isolierte Entwicklungsumgebung; keine echten Kundendaten.

- Elf API-Tests bestanden: Anmeldung, Ursprungsprüfung, Kundentrennung, interne Daten, Kommentare und verlinkte Anhänge, Kundenfreigaben, einmalige/ablaufende Magic Links, Wiederholungen, Validierung, Zugriffsentzug und SQLite-Wiederherstellung.
- Chromium-Test bestanden: Magic-Link-Login, Dashboard, vier Aufgabenansichten, Aufgabe anlegen, Dokument schreiben/speichern/neuladen, DE/EN und Kundenfreigabe mit separatem Kundenlogin.
- Next.js-Produktionsbuild bestanden.
- Abschließendes Docker-Image erfolgreich gebaut und gestartet. Healthcheck-Endpunkt erfolgreich; Datenmarker nach Container-Neustart erhalten. Backup-Skript im Container erfolgreich ausgeführt und Integrität geprüft.
- `npm audit --omit=dev`: keine gemeldeten Schwachstellen zum Prüfzeitpunkt.
- Testcontainer und Testvolume nach Abschluss entfernt. Der lokale Entwicklungsserver verwendet ausschließlich fiktive Daten außerhalb des Git-Repositorys.

Noch nicht geprüft: tatsächliche E-Mail-Zustellung über den Nexene-SMTP-Anbieter, Betrieb auf dem Hostinger-VPS und Vergleich mit dem Figma-Original. Kein GitHub-Remote angelegt, da keine gültige GitHub-Verbindung verfügbar war.

## Überarbeitung nach CI-Vorgaben, 6. November 2026

- Nexene-Farben, größere Schrift und Bedienelemente, bessere Kontraste und Fokuszustände umgesetzt.
- Oberfläche in Feature-Komponenten aufgeteilt; TypeScript mit `strict` für UI und Datenverträge bestanden.
- 13 API-/Datenbanktests bestanden, einschließlich konkurrierender Dokumentänderungen und verlustfreier, wiederholbarer Migration vom vorherigen Schema.
- Vollständiger Browser-Smoke-Test sowie zusätzliche Prüfungen für Tab-Umlauf, Escape, Fokusrückgabe, erhaltene Formulareingaben nach einem Serverfehler und erhaltene Entwürfe bei einem Speicherkonflikt bestanden.
- axe: keine Verstöße in 15 geprüften Ansichten und Zuständen gegen die ausgewählten WCAG-A/AA-Regeln. Einschließlich zweier Kundenansichten und eines schmaleren Viewports.
- Abschließendes Docker-Image mit der überarbeiteten Oberfläche gebaut und gestartet; Produktionsschema 2, Health-Endpunkt, Sicherung und erhaltene Daten nach Neustart geprüft. Temporärer Testcontainer und Testvolume anschließend entfernt.
- Testbefehle und Grenzen der Prüfung: [QUALITY.md](QUALITY.md).

## Vercel-Vorbereitung, 6. November 2026

- Asynchroner Datenbankzugriff mit `@libsql/client`, gemeinsamen Schema und echten Transaktionen ergänzt. Turso ist über `TURSO_DATABASE_URL` und `TURSO_AUTH_TOKEN` konfigurierbar.
- Auf Vercel ist ein lokaler Datenbank-Fallback gesperrt. Login-Limits, Token-Einlösung, Freigaben und Dokumentrevisionen werden atomar in der zentralen Datenbank behandelt.
- Je 20 API-/Datenbanktests im lokalen Modus und mit ausdrücklich konfiguriertem libSQL-Treiber bestanden. Der externe Treiber wurde gegen isolierte lokale libSQL-Dateidatenbanken geprüft; ein echter Turso-Cloud-Endpunkt war dabei nicht verbunden.
- TypeScript, Build mit `VERCEL=1` sowie Browser-/Tastatur- und die bestehenden 15 axe-Prüfzustände bestanden.
- Tatsächlicher Vercel-/Turso-Betrieb und SMTP-Zustellung benötigen die Verbindung zum Benutzerkonto und zur Cloud-Datenbank. Es wurde keine bestehende Kundendatenbank automatisch übertragen; ein Neustart ohne echte Bestandsdaten wurde bestätigt.
