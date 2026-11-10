# Änderungen

## v1.5.0 · 10. November 2026

- Admins können Projekte in den Projektdetails dauerhaft löschen. Der vollständige Projektname muss vor dem Löschen bestätigt werden.
- Aufgaben, Dokumente, Reports, Zeiteinträge, Freigaben, Verknüpfungen und Onboarding-Daten werden gemeinsam entfernt. Kunde und Kontakte bleiben erhalten.
- Kunden erhalten keine Löschfunktion; der Server verlangt die Adminrolle. Es ist keine Datenbankmigration erforderlich.

## v1.4.0 · 10. November 2026

- Kunden-Onboarding mit fünf Schritten für Webdesign und SEO + GEO ergänzt. Lokale Unternehmen erhalten eine zusätzliche Abfrage zum Google-Unternehmensprofil.
- Zentrale Einladungsadresse über `ONBOARDING_EMAIL`, Rechtehinweise und Status pro System. Das Formular erfasst Informationen und meldet Einladungen; Nexene prüft die Zugriffe anschließend.
- Zwischenstände speichern, später fortsetzen, Angaben prüfen und ein gemeinsames Projektdokument erzeugen. Nach dem Abschluss öffnet „Onboarding abgeschlossen“ dieses Dokument.
- Revisionsprüfung verhindert Überschreiben durch andere Ansprechpartner. Abschluss und Dokument werden gemeinsam gespeichert; wiederholtes Abschließen bleibt ohne Duplikate.
- Schema 5 ergänzt gespeicherte Onboardings. Lokale Schreibtransaktionen werden pro Verbindung geordnet ausgeführt.

## v1.3.0 · 10. November 2026

- Eigenständiges Kundenportal: direkter Projekteinstieg ohne Admin-Seitenleiste, globale Suche, Breadcrumbs oder Zurück-Links. Kunden mit mehreren eigenen Projekten erhalten eine Auswahl innerhalb des Portals.
- Projekttyp „SEO + GEO“ für laufende Betreuung ergänzt. Diese Projekte zeigen Reports statt eines Projektfortschritts und erhalten beim Anlegen keine Webdesign-Phasenaufgaben. Der Typ lässt sich in den Admin-Projektdetails ändern.
- PDF-Reports mit Titel, Berichtsmonat und Beschreibung veröffentlichen, herunterladen und entfernen. Die Reports sind nach Veröffentlichung im jeweiligen Kundenportal sichtbar.
- PDFs bis 3 MB liegen dauerhaft in der vorhandenen Datenbank, aufgeteilt in kleine Binärblöcke. Download und Löschung prüfen serverseitig Anmeldung, Kundenrechte und Adminrolle. Es gibt keine öffentlichen Dateilinks und keinen zusätzlichen Speicherdienst.
- Schema 4 ergänzt Projekttyp und Reporttabellen. Bestehende Projekte bleiben zunächst Webdesign-Projekte; eine Typänderung erhält bestehende Aufgaben und Dokumente.
- Kontrast der heutigen Datumsmarkierung im Kalender korrigiert.

## v1.2.0 · 7. November 2026

- Dropdown-Pfeile haben einheitlich 16 px Abstand zum rechten Rand und ausreichend Platz zum Text. Native Auswahlmenüs bleiben erhalten.
- Gemeinsame Hover-Rückmeldung für Schaltflächen, Links und aufklappbare Bereiche ergänzt, einschließlich aktiver Tabs, Sprachumschalter, Kalenderaufgaben und Unteraufgaben.
- Auswahlfelder, Texteingaben und Checkboxen erhalten sichtbare Hover-Zustände. Tastaturfokus bleibt klar erkennbar; aufklappbare Bereiche erhalten einen eigenen Fokusrahmen.
- Deaktivierte Schaltflächen erhalten keinen Hover-Effekt. Bewegungseinstellungen und Windows-Kontrastmodus werden berücksichtigt.
- Tabellenzeilen ohne Aktion zeigen keinen Handcursor mehr.

## v1.1.0 · 7. November 2026

- Kennzahlen in der Übersicht zeigen 0 und 1 ohne führende Null.
- Jedes Projekt hat eigene Phasenanteile, die zusammen 100 % ergeben. Die Anteile lassen sich beim Anlegen und später über „Phasen gewichten“ einstellen.
- Der Projektfortschritt ergibt sich aus den erledigten Hauptaufgaben pro Phase und deren Anteil am Projekt. Unteraufgaben zählen über ihre Hauptaufgabe. Phasen mit 0 % zählen nicht zum Gesamtfortschritt; Phasen ohne Aufgaben bleiben bei 0 %.
- Neue Aufgaben erhalten eine Projektphase. Die Zuordnung lässt sich in den Aufgabendetails ändern. Kunden und Admins sehen denselben Gesamtfortschritt, während interne Aufgaben intern bleiben.
- Im Kundenfeld des Projektformulars lässt sich direkt ein neuer Kunde anlegen. Kunde und Projekt werden gemeinsam gespeichert.
- Deutsche und englische Oberflächentexte überarbeitet: verständliche Platzhalter, konkrete Anmeldehinweise und keine Gedankenstriche.

### Startwerte für die Phasen

| Phase            | Anteil |
| ---------------- | -----: |
| Kick-off         |    5 % |
| Inhalte          |   15 % |
| Freigabe Inhalte |    5 % |
| Design           |   20 % |
| Freigabe Design  |    5 % |
| Entwicklung      |   30 % |
| Abnahme          |   10 % |
| Launch           |   10 % |
| Betreuung        |    0 % |

Das sind anpassbare Startwerte, keine Vorgabe für euren Projektablauf. Betreuung läuft standardmäßig außerhalb des Projektabschlusses.

### Bestehende Daten

Schema 3 ergänzt Phasenanteile und Aufgabenzuordnungen in einer Transaktion. Bestehende Projekte erhalten die Startwerte. Aufgaben mit dem Namen einer Projektphase werden dieser Phase zugeordnet. Andere Hauptaufgaben erhalten zunächst die aktuelle Projektphase. Prüft diese Zuordnungen nach dem Update in den Aufgabendetails. Dokumente, Kunden und Aufgabenstatus bleiben erhalten.

### Texte

Die Überarbeitung folgt dem vom Nutzer gewählten [AI-Copywriter-Skill](https://github.com/mikiarlo3/ai-copywriter/blob/claude/humanizer-copywriting-skill-u5x4vd/SKILL.md), Version 1.6.0. Maßgeblich sind klare Handlungsanweisungen, konkrete Aussagen und der Verzicht auf Gedankenstriche und Werbefloskeln. Bestehende Kundeninhalte werden nicht umgeschrieben.
