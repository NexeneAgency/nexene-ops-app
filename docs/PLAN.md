# Nexene Ops

Bestätigt: drei interne Admins, Kunden mit erlaubten E-Mail-Adressen, keine öffentliche Registrierung. Deutsch/Englisch, klare Gestaltung, Desktop zuerst. Next.js, SQLite, Docker auf Hostinger-VPS. Original-Logos vom Auftraggeber. Figma konnte bislang nicht ausgelesen werden; Farben und Typografie sind zunächst eine gestalterische Annäherung.

## V1 – Reihenfolge

1. Neues Repository und Grundlage.
2. Next.js, SQLite, DE/EN, Magic-Link-Login und serverseitige Kundentrennung.
3. Durchgehender Ablauf: Kunde → Projekt → Aufgabe/Dokument → Kundenlogin → Feedback/Freigabe.
4. Liste, Kanban, Kalender, Zeitplan, Unteraufgaben, Kommentare, Prioritäten, Wiederholungen; Projekt-/Dokumentvorlagen, manuelle Zeiten, Festpreis und Stundenbudget; verschachtelte Dokumentseiten mit Markdown-Kürzeln und internen Links.
5. Docker, Persistenz, Sicherung und Wiederherstellung.

## V2

6. Slack und anschließend Hermes anbinden. Hermes soll nur Dokumente ablegen; Schnittstellenvertrag und Veröffentlichungsregeln sind noch offen.

## Projektvorlage

Kick-off → Inhalte → Freigabe Inhalte → Design → Freigabe Design → Entwicklung → Abnahme → Launch → Betreuung.

## Grenzen des ersten Entwicklungsstands

- Standard-Projektvorlage vorhanden; ein Editor für eigene Projektvorlagen fehlt noch.
- Anmeldelinks laufen nach 15 Minuten ab. Separate Einladungslinks gibt es noch nicht; Admins schalten E-Mail-Adressen frei und teilen die Login-Adresse.
- Ein Kundenkontakt gehört derzeit einem Kunden und sieht dessen Projekte. Einzelne Projekte innerhalb dieses Kunden separat zuzuweisen ist noch nicht implementiert.
- Dokumente speichern Editor-JSON in SQLite; Markdown-Kürzel werden direkt formatiert. Markdown-Dateiexport ist noch nicht implementiert. Externe Dateien werden verlinkt.
- Freigaben halten eine benannte Version/Referenz fest. Es gibt keine automatisch unveränderliche Kopie eines Dokuments; eindeutige Versionen/Referenzlinks verwenden.
- Vor dem Echtbetrieb erforderlich: SMTP-Zustellung mit echtem Anbieter, HTTPS und Domain, VPS-/Docker-Buildtest und Endabnahme.
- CRM, Timer, Dokumenthistorie, vollständige mobile Nutzung und Google-Docs-Import sind nicht Teil von V1.
