# Überarbeitetes Nexene-Ops-Frontend

Referenz: [Nexene Ops in Figma](https://www.figma.com/design/rFmaJnMwhA6mwV2ZM7ZPNt/Nexene-Ops).

Die gemeinsamen Designvorgaben liegen in `app/design.css`, nach den vorhandenen Grundstilen geladen. Arimo in den Gewichten 400 und 700 wird einschließlich Lizenz lokal ausgeliefert. Das vorhandene Nexene-Logo und die Lucide-Komponenten werden weiterverwendet; die Figma-Komponenten stammen laut ihren Beschreibungen aus demselben App-Quellcode.

Berücksichtigt sind:

- Adminbereich: Übersicht, Projekte, Aufgabenliste, Board, Kalender, Zeitplan, Dokumente, Freigaben, Ressourcen, Zeit und Budget, Kunden und Einstellungen.
- Kundenportal mit eigenem Header, Projektinformationen, Onboarding-Hinweis, Tabs, Tabellen und Leerzuständen.
- SEO-/GEO-Reports mit Veröffentlichung, PDF-Karten, Download und Leerzustand.
- Beide Onboarding-Varianten mit fünf Schritten, Fortschrittsanzeige und Abschluss.
- Gemeinsame Formulare, Zugangsverwaltung, Löschdialoge, Phasengewichtung und Aufgabendetails.
- Schmale Bildschirme mit umbrechenden Bedienelementen und horizontal scrollbar bleibenden Tabellen.

Die vorhandenen API-Aufrufe, Berechtigungen, Datenverträge, Speichermechanismen und Bestätigungen bleiben erhalten. Daher bleiben beispielsweise unmittelbare Änderungen an Aufgabeneigenschaften unmittelbar gespeichert; ein zusätzlicher Speichern-Schritt aus dem statischen Entwurf wird nicht eingeführt. Bestehende Browser-Bestätigungen und der Schutz ungespeicherter Dokumente bleiben erhalten.

Es gibt keine Schemaänderung, Datenmigration, Änderung der Produktionskonfiguration oder Initialisierung von Kundendaten durch diese Frontend-Anpassung. Lokale Prüfungen verwenden getrennte Testdatenbanken. Ein produktives Update erfolgt über den bestehenden Hosting-Prozess; eine Sicherung vor dem Update bleibt empfohlen.

GitHub Actions werden für diese Änderung nicht verwendet. Der bisherige Workflow wurde auf GitHub deaktiviert und seine Definition aus dem Repository entfernt. Die lokalen Prüfungen stehen in der README.
