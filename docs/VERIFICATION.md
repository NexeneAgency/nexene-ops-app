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

## v1.1, 7. November 2026

- Je 23 API-/Datenbanktests mit lokalem SQLite und dem konfigurierten libSQL-Treiber bestanden. Neue Prüfungen decken die gewichtete Berechnung, gemeinsame Kunden-/Projektanlage mit Rollback, Kundenrechte und wiederholbare Migration vorhandener Daten ab.
- TypeScript und Vercel-Produktionsbuild bestanden.
- Bestehende Browser-, Tastatur- und Konfliktprüfungen bestanden. Zusätzlich: Kennzahlen ohne führende Null, Kundenanlage im Projektformular, Gewichtung mit 100-%-Validierung, Speicherung nach Neuladen, DE/EN und Aufgabenzuordnung zu Phasen.
- axe meldet keine Verstöße gegen die ausgewählten WCAG-A/AA-Regeln in den bisherigen 15 Prüfzuständen und den beiden neuen Dialogzuständen.
- Screenshots der neuen Dialoge visuell geprüft. Anwendungsquellen in `app/` und `lib/` enthalten keine Gedankenstriche. Bereits gespeicherte Kundeninhalte bleiben unverändert.
- Die automatisierten Funktionstests verwenden isolierte Datenbanken. Der Produktions-Healthcheck nach Veröffentlichung prüft zusätzlich die Verbindung zur Turso-Datenbank.

## v1.2, 7. November 2026

- Dropdown-Pfeile und reservierter Textabstand visuell im Projektformular geprüft. Browsermessung bestätigt 16 px rechten Abstand und 48 px rechten Innenabstand der Auswahlfelder.
- Zusätzliche Hover-Prüfung: 341 Interaktionen in 15 Ansichten und Zuständen, darunter aktive Navigation, Aufgabenansichten, Formulare, Editor und Kundenportal. Für alle geprüften Bedienelemente änderte sich der sichtbare Zustand beim Überfahren.
- Deaktivierte Anmeldeschaltfläche bleibt beim Überfahren unverändert. Reduzierte Bewegung wird berücksichtigt.
- Vollständige bestehende Browser-, Tastatur- und Barrierefreiheitsprüfungen bestanden. Die ausgewählten axe-Regeln melden keine Verstöße.
- Vercel-Produktionsbuild bestanden. Keine Datenbankänderung erforderlich.

## v1.3, 10. November 2026

- Je 25 API-/Datenbanktests mit SQLite und dem konfigurierten libSQL-Treiber bestanden. Neue Prüfungen: SEO-Projekttyp ohne Phasenaufgaben oder Prozentwert, PDF-Upload und Wiederherstellung nach Verbindungswechsel, Größen-/Formatprüfung, Downloadrechte, fremde Kunden, entzogene Zugänge und vollständige Löschung der Binärblöcke.
- Browserprüfung bestanden: eigenständiges Kundenportal ohne Sidebar, Breadcrumbs, globale Suche und Zurück-Link; SEO-Reports als Startansicht, Upload durch Admin, bytegleicher Download durch Kunden, Neuladen, Dokument-Direktlinks und DE/EN.
- Die bisherigen Tastatur-/Konfliktprüfungen und alle ausgewählten axe-Regeln bestehen. Das SEO-Kundenportal wurde zusätzlich in zwei Breiten geprüft; keine gemeldeten Verstöße.
- Produktionsbuild und TypeScript bestanden. Portal-Screenshot visuell geprüft.
- Schema 4 ist additiv. PDF-Dateien liegen in der vorhandenen Datenbank, höchstens 3 MB pro Datei. Es wurde kein zusätzlicher Cloud-Dienst eingerichtet.

## v1.4, 10. November 2026

- Je 27 API-/Datenbanktests mit SQLite und dem konfigurierten libSQL-Treiber bestanden. Neue Prüfungen: geschützte Onboarding-Entwürfe, Konflikte paralleler Änderungen, Pflichtfelder, bedingte Zugriffe und genau ein sichtbares Dokument auch bei gleichzeitigem oder wiederholtem Abschluss.
- Browserablauf mit Kundenkonto bestanden: fünf Schritte, speichern/schließen, nach Neuladen fortsetzen, lokales Unternehmensprofil, Bestätigung, Abschlussdokument, erneutes Öffnen und DE/EN.
- Zusätzlich drei Formularzustände mit axe geprüft, ohne gemeldete Verstöße. Die bisherigen Browser-, Tastatur-, Konflikt- und Portalprüfungen bestehen ebenfalls.
- TypeScript und Vercel-Produktionsbuild bestanden. Zugriffsformular visuell geprüft.
- Schema 5 ergänzt Onboarding-Daten, ohne bestehende Inhalte zu ändern. Die Einladungsadresse wird über `ONBOARDING_EMAIL` gepflegt. Angaben werden gespeichert; Einladungen und Prüfung erfolgen in den jeweiligen Systemen durch Kunde und Nexene.

## v1.5, 10. November 2026

- Je 28 API-/Datenbanktests mit SQLite und dem konfigurierten libSQL-Treiber bestanden. Die Projektlöschung entfernt auch verschachtelte Aufgaben/Dokumente, Wiederholungen, Onboardings, PDF-Blöcke, Kommentare, Verknüpfungen, Freigaben und Zeiten. Andere Projekte und der Kunde bleiben erhalten; die Fremdschlüsselprüfung besteht.
- Browserprüfung bestanden: Kunden erhalten keine Löschfunktion. Admins müssen den genauen Projektnamen eingeben; ein falscher Name lässt die Löschaktion deaktiviert. Nach dem Löschen erscheint die Projektübersicht, ein Kunde ohne weitere Projekte sieht den leeren Projektzustand.
- Löschdialog mit axe ohne gemeldete Verstöße geprüft. Die bisherigen Browser-, Tastatur- und Konfliktprüfungen sowie Produktionsbuild und TypeScript bestehen.

## v1.6, 10. November 2026

- Je 31 API-/Datenbanktests mit SQLite und libSQL bestanden. Neue Prüfungen: Loginzeitpunkt nur bei erfolgreicher Anmeldung, „nie angemeldet“, Benutzeränderungen mit Revisionsprüfung, Sitzungs-/Tokenentzug, Löschung/Wiederfreischaltung und parallele Adminänderungen ohne Verlust des letzten Admins.
- Geänderte und gelöschte Startkonten erscheinen nach erneuter Initialisierung nicht unter der alten Adresse wieder.
- Browserprüfung bestanden: Login-Spalte, Drei-Punkte-Menü, Escape und Fokus-Rückgabe, Bearbeiten, bestätigte Löschung und Sperren eines bereits angemeldeten Kunden. Drei zusätzliche Zustände mit axe geprüft, ohne gemeldete Verstöße. Die bisherigen Prüfungen bestehen ebenfalls.
- TypeScript und Produktionsbuild bestanden.
- Schema 6 kennzeichnet historische Sitzungszeitpunkte als Schätzwerte. Fehlende historische Daten werden nicht als „nie angemeldet“ ausgegeben. Erfolgreiche neue Anmeldungen werden exakt erfasst.
