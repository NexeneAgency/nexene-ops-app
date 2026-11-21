# Leads-CRM

Interner Admin-Bereich in Nexene Ops. Kunden sehen weder den Menüpunkt noch Lead-Daten. Es gibt keinen E-Mail-Versand; der Outreach-Text bleibt ein Entwurf.

## Datenbank

Migration **8** wird von `lib/db.mjs` (SQLite) und `lib/database.mjs` (libSQL/Turso) eingebunden. Die Migration liegt gemeinsam in `lib/leads.mjs`; Migrationen 1–7 bleiben unverändert. Neue Installationen und das Upgrade von Version 7 sind lokal mit beiden Adaptern getestet. Keine produktive Datenbank wurde verändert.

Boolesche Werte liegen als SQLite-Integer mit CHECK-Constraint vor und werden in der API als JSON-Booleans ausgegeben. Statuswerte: `neu`, `kontaktiert`, `geantwortet`, `gewonnen`, `verloren`. `company_name` ist Pflicht, sonstige Textfelder sind optional. URLs erlauben nur HTTP/HTTPS. Bei Änderung einer Kontaktadresse/-nummer ohne explizites Verifikationsfeld setzt PATCH deren Verifikation zurück.

## API

Alle Endpunkte erfordern einen Admin oder einen bestehenden Agent-API-Key. Session-Requests unterliegen den vorhandenen Origin-Prüfungen. Antworten sind nicht cachebar.

| Methode | Pfad | Ergebnis |
| --- | --- | --- |
| GET | `/api/leads` | Alle Leads, neueste zuerst |
| GET | `/api/leads?status=neu` | Leads mit diesem Status |
| POST | `/api/leads` | Neuen Lead speichern; vollständiger Datensatz, HTTP 201 |
| GET | `/api/leads/:id` | Einzelnen Lead lesen |
| PATCH | `/api/leads/:id` | Übergebene bearbeitbare Felder ändern |
| PATCH | `/api/leads/:id/status` | Nur `{ "status": "kontaktiert" }` ändern |
| DELETE | `/api/leads/:id` | Dauerhaft löschen; `{ "ok": true }` |

Unbekannte IDs: 404. Ungültige Eingaben/Statusfilter: 400. Nicht angemeldet: 401. Kundenrolle: 403. IDs und Zeitstempel lassen sich per PATCH nicht überschreiben.

## Oberfläche

Sidebar → **Leads**: Tabelle, Statusfilter, Suche über das vorhandene Suchfeld, Anlegen/Bearbeiten aller fachlichen Felder, direkte Statusänderung und Löschdialog. DE/EN-Texte. Auf schmalen Displays scrollt die Tabelle horizontal innerhalb ihres Containers.

## Ausgeführte Prüfungen

Lauf mit Node **24.22.3**, passend zu `engines.node: 24.x`:

- `node --test --test-isolation=none tests/*.test.mjs`: **35/35 bestanden**, einschließlich Upgrade 7 → 8, wiederholter Migration und Bestandsdatenerhalt für beide DB-Adapter.
- `node tests/libsql.mjs`: **34/34 bestanden**, echte lokale libSQL-Datei, keine API-Mocks.
- `node node_modules/typescript/bin/tsc --noEmit`: bestanden.
- `node node_modules/next/dist/bin/next build`: bestanden.
- `TEST_SCRIPT=tests/leads-browser.mjs node tests/run-browser.mjs`: bestanden. Persistiertes Anlegen, Lesen, Bearbeiten, Status, Filter, Reload und Löschen; Axe ohne Verstöße; Desktop-/Mobil-Screenshots.
- Vorhandene Browser-Skripte `browser.mjs`, `v11-browser.mjs`, `v14-browser.mjs`, `v16-browser.mjs`: bestanden.
- `TEST_SCRIPT=tests/browser.mjs,tests/accessibility.mjs node tests/run-browser.mjs`: bestanden. Der Accessibility-Test benötigt den vom Smoke-Test angelegten Kundenkontakt.
- `git diff --check`: bestanden.

**Bekannter Bestandsfehler:** Der unveränderte Gesamt-Runner stoppt in `tests/v13-browser.mjs:86` am nicht geöffneten PDF-Uploadformular. Derselbe Timeout wurde auf dem unveränderten Basis-Commit **170b57c** reproduziert. Kein neuer Leads-Fehler. Die Produktivlogik für Reports wurde nicht verändert; der Test braucht einen separaten Folgeauftrag.

Für einen einzelnen Browser-Test unterstützt der Runner `TEST_SCRIPT`; mehrere Skripte werden kommasepariert angegeben. Auf diesem Server lag Playwrights Standardpfad außerhalb des beschreibbaren Bereichs. Tests wurden deshalb mit `PLAYWRIGHT_BROWSERS_PATH` auf ein Browser-Verzeichnis im Task-Workspace ausgeführt.

## Freigabe und Grenzen

Branch: `feat/leads-crm-t_a2b02805`. Vor Merge muss der Koordinator prüfen. Kein Merge nach main, kein Produktions-Deployment, keine produktive Migration und keine Outreach-Nachricht wurden ausgeführt. Remote-Turso wurde nicht beschrieben; dessen Adapter wurde lokal gegen libSQL geprüft. Gleichzeitige Änderungen desselben Feldes folgen wie bei einfachen CRUD-Formularen dem letzten Schreibzugriff; keine neue Revisionsverwaltung oder automatische Lead-Recherche enthalten.
