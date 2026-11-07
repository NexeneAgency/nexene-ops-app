# Änderungen

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
