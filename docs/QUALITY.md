# Qualitätsüberarbeitung und Nexene-CI

## Gestaltung

- Hauptfläche: Vermillion Grey 1 `#F8F1F1`.
- Text, Navigation und dunkle Flächen: Night Black `#0C0910`.
- Akzente, Fortschritt und primäre Erstellungsaktionen: Vermillion `#F64740`.
- Weiß `#FFFFFF` für Karten und Formulare. Graustufen aus der bereitgestellten CI für Umrandungen und sekundäre Inhalte.
- Auf Vermillion stehen dunkle Beschriftungen. Kleine rote Texte verwenden einen dunkleren Rotton `#A32924`, weil Weiß oder helles Rot als kleine Schrift nicht in jeder Kombination ausreichend kontrastreich sind.
- Größere Schriftgrößen, klarere Abstände, abgerundete Hauptkomponenten mit 12 px Radius, sichtbare Fokusmarkierungen. Bewegung wird bei `prefers-reduced-motion` reduziert.

## Code und Daten

Die frühere zentrale Workspace-Datei mit über 2.300 Zeilen wurde in eigenständige Feature-Komponenten zerlegt. Die zentrale Ansicht umfasst rund 170 Zeilen; Zustand, UI-Texte, HTTP-Client, Dialoge und Datenverträge liegen getrennt. Oberfläche und Datenverträge werden mit TypeScript `strict` geprüft. Die bereits vorhandene serverseitige Fachlogik bleibt JavaScript und wird über API-Tests geprüft; eine vollständige Backend-TypeScript-Migration wird nicht behauptet.

Dokumente haben eine Revisionsnummer. Jede Aktualisierung muss den erwarteten Stand mitsenden; ein atomisches SQL-Update verhindert das Überschreiben einer anderen Bearbeitung. Bei HTTP 409 bleibt der Entwurf im Editor. Neuladen erfordert bei ungespeicherten Änderungen eine Bestätigung. Die Revision des ursprünglichen Entwurfs wird unabhängig von sonstigen Aktualisierungen des Workspace gehalten. Während eines Entwurfs ist das Ändern der Kundensichtbarkeit gesperrt.

Schema 2 ergänzt die Revisionsspalte durch eine wiederholbar startbare Migration. Ein Test erzeugt eine Datenbank im vorherigen Schema, migriert sie zweimal und prüft, dass die Dokumentinhalte unverändert erhalten bleiben.

## Bedienung und Fehlerrückmeldungen

- Native modale Dialoge machen den Hintergrund inaktiv. Zusätzlich werden Tab und Umschalt+Tab innerhalb des Dialogs geführt; Escape schließt, der Fokus kehrt zum Auslöser zurück.
- Aufgabentitel sind per Tastatur aktivierbare Buttons. Der Status lässt sich im Detaildialog ohne Drag-and-drop ändern.
- Navigation und ausgewählte Ansichten haben zugängliche Zustände. Icon-Buttons und Editorwerkzeuge haben sprechende Beschriftungen. Der Editor hat einen benannten, mehrzeiligen Textbereich und kennzeichnet schreibgeschützte Ansichten.
- Ein Sprunglink führt zum Hauptinhalt. Bei Navigation wird die Seitenüberschrift fokussiert.
- Formulare erhalten ihre Eingaben nach fehlgeschlagenen Speicheranfragen. Fehler werden als solche angekündigt; Fehlermeldungen lassen sich bewusst schließen. Erfolgsmeldungen verwenden eine höfliche Statusankündigung.
- HTTP-Anfragen haben ein Zeitlimit. Schreibanfragen werden bei Fehlern nicht automatisch wiederholt.
- Ungespeicherte Änderungen werden beim Verlassen, Projektwechsel und Abmelden berücksichtigt.

## Nachprüfbare Tests

```sh
npm test
npm run typecheck
npm run build
npm run test:browser
```

Der Browserlauf prüft Anmeldung, Aufgabenansichten, Dokumentpersistenz, Sprachwechsel und Kundenfreigaben. Ergänzt sind Tab-Umlauf, Escape, Fokuswiederherstellung, fehlgeschlagene Formularanfragen sowie zwei gleichzeitig geöffnete Dokumentstände mit Erhalt des abgewiesenen Entwurfs.

axe prüft 15 Ansichten/Zustände mit Regeln für WCAG 2 A/AA, 2.1 AA und 2.2 AA: Login, Dashboard, Kunden, Verwaltung, Aufgabenliste, Aufgabendialog, fehlgeschlagene Übermittlung, Board, Aufgabendetails, Kalender, Zeitplan, Editor, schmaleres Dashboard, Kundendashboard und Kundenprojekt. Das ist keine vollständige WCAG-Zertifizierung.

## Noch durch Menschen beziehungsweise im Zielbetrieb zu prüfen

Eure tatsächlichen Arbeitsabläufe und Verständlichkeit der Oberfläche müssen mit euch erprobt werden. Eine vollständige manuelle Prüfung mit VoiceOver oder NVDA wurde nicht durchgeführt. SMTP-Zustellung, Domain/HTTPS und der Hostinger-VPS benötigen weiterhin die Einrichtung und Prüfung mit der echten Infrastruktur. Die Farben entsprechen dem gelieferten CI-Screenshot; die exakte Figma-Typografie und Gestaltung weiterer Komponenten sind ohne Zugriff auf das Original nicht abschließend abgeglichen.
