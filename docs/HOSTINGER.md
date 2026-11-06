# Hostinger: Aus URL erstellen

Die zentrale Deployment-Datei ist direkt im App-Repository:

```text
https://raw.githubusercontent.com/NexeneAgency/nexene-ops-app/main/compose.yaml
```

Voraussetzung: Das App-Repository ist öffentlich. Hostinger importiert die Compose-Datei; Docker lädt den öffentlichen Git-Quellcode und baut das Image auf dem VPS. Der erste Start dauert deshalb länger als das Abrufen eines fertigen Images. Es sind weder ein Registry-Token noch ein separates Deployment-Repository nötig.

## 1. Compose importieren

In Hostinger **Aus URL erstellen** auswählen und die oben genannte Compose-URL eintragen. Die Hauptdatei benötigt keine vorher angelegte Datei auf dem VPS und keinen SSH-Zugang.

## 2. Einstellungen in Hostinger hinterlegen

Im Anwendungseditor unter **Umgebung → + Umgebung** diese Variablen setzen. Die Compose-Datei reicht sie ausdrücklich an den Container `ops` weiter.

| Variable       | Wert                                                             |
| -------------- | ---------------------------------------------------------------- |
| `APP_URL`      | Eure tatsächliche HTTPS-Adresse, z. B. `https://ops.example.com` |
| `ADMIN_EMAILS` | Freigeschaltete E-Mail-Adressen, durch Komma getrennt            |
| `SMTP_HOST`    | SMTP-Server eures Anbieters                                      |
| `SMTP_PORT`    | `587` für STARTTLS oder `465` für direktes TLS                   |
| `SMTP_SECURE`  | `false` bei Port 587, `true` bei Port 465                        |
| `SMTP_USER`    | SMTP-Benutzername                                                |
| `SMTP_PASS`    | SMTP-Passwort                                                    |
| `MAIL_FROM`    | Erlaubter Absender, z. B. `Nexene Ops <ops@example.com>`         |

Dann **Bereitstellen** auswählen. Zugangsdaten nur in Hostinger speichern, nicht in GitHub oder im Chat. Die leeren Standardwerte in Compose ermöglichen den Import ohne vorherige Konfiguration; vor dem Einsatz müssen die tatsächlichen Werte gesetzt werden. Ohne freigeschaltete Admin-Adresse und SMTP funktioniert die Anmeldung nicht.

Falls die Anwendung schon angelegt ist: dieselben Umgebungsvariablen ergänzen und erneut bereitstellen. Bei einer bereits importierten älteren Compose-Datei im **.yaml-Editor** den Block `env_file: - /opt/nexene-ops/.env` entfernen und den `environment`-Block aus der aktuellen Compose-Datei übernehmen. Hostinger aktualisiert eine zuvor importierte Datei nicht zwingend automatisch aus GitHub. Vorhandene Portzuordnungen und Volumes dabei beibehalten.

Der Build läuft auf dem VPS und benötigt Zugriff auf den öffentlichen Quellcode, Docker Hub und npm. Ein Registry-Login ist nicht nötig.

Optional lassen sich unter **Umgebung** mit `OPS_CPUS` und `OPS_MEMORY` die Laufzeitlimits anpassen. Standard: eine CPU und 512 MB RAM. Diese Werte sind Ausgangswerte für die kleine Instanz, keine Messung eures VPS. Bei Speicherproblemen oder wachsender Nutzung anhand der RAM-Anzeige und der Protokolle anpassen. Die Limits gelten für den laufenden Container; der Image-Build benötigt zusätzlich freie Ressourcen auf dem VPS. Die Docker-Logs werden auf drei Dateien mit jeweils höchstens 10 MB begrenzt. Eigene Anwendungssicherungen fallen nicht unter diese Logrotation.

## 3. Domain und HTTPS

Die App lauscht nur auf `127.0.0.1:3000`. Eure Domain muss per DNS auf den VPS zeigen und der vorhandene Reverse Proxy HTTPS auf diesen Port weiterleiten. Ein Beispiel für einen auf dem Host installierten Caddy:

```caddy
ops.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

Die Domain identisch in `APP_URL` hinterlegen. Ein in Docker laufender Proxy benötigt ein gemeinsames Docker-Netzwerk statt `127.0.0.1`. Die Compose-Datei startet keinen weiteren Proxy und beansprucht keine öffentlichen Ports 80/443.

Der Port-Link in Hostingers Container-Karte ist bei dieser Bindung kein Nachweis für öffentlichen Browserzugriff. Auch **Running** allein bestätigt weder HTTPS noch erfolgreiche SMTP-Zustellung. Für die Abnahme separat prüfen: Healthcheck, Domain/HTTPS, tatsächliche Login-E-Mail und fortbestehende Daten nach einem erneuten Bereitstellen. Bei Fehlern zuerst Hostingers **Protokolle** des Containers ansehen. Eine Shell im Container benötigt keinen eigenen Docker-Daemon; deshalb ist ein dort fehlschlagendes `docker ps` allein kein Beleg, dass Docker auf dem VPS nicht läuft.

Prüfen:

```sh
curl --fail http://127.0.0.1:3000/api/health
```

Erwartet: `{"ok":true}`. Danach über die HTTPS-Adresse einen Anmeldelink für eine hinterlegte Admin-Adresse anfordern.

## Daten, Sicherungen und Updates

Die festen Volumes `nexene_ops_data` und `nexene_ops_backups` bleiben bei Container-Updates erhalten. Nur eine Instanz mit diesen Volumes betreiben. In der Container-Konsole erzeugt `node scripts/backup.mjs` eine konsistente Sicherung im Backup-Volume. Zusätzlich regelmäßige Sicherungen außerhalb des VPS einrichten.

Das Backup-Skript ist vorhanden, aber eine automatische Sicherungsplanung und die Kopie außerhalb des VPS werden durch diese Compose-Datei nicht eingerichtet. Dafür einen Zeitplan und ein externes Sicherungsziel ergänzen. Der feste Containerpfad `BACKUP_DIR=/app/backups` stellt sicher, dass Sicherungen im vorgesehenen Volume landen. Datenvolumes nicht über Bereinigungsfunktionen entfernen, solange sie gebraucht werden.

Für ein Update den aktuellen Quellcode erneut bauen. Bei einem lokalen Checkout: `docker compose up -d --build`. In Hostinger die Funktion zum erneuten Bauen/Bereitstellen verwenden. Vor Updates sichern; Volumes nicht löschen.

## Später wieder privat

Das Repository kann später wieder privat gestellt werden. Der bereits gebaute Container läuft weiter. Neue Builds aus der anonymen Git-URL und neue URL-Importe funktionieren dann nicht mehr. Für spätere Updates ist wieder ein authentifizierter Zugriff oder das bereits vorhandene private GHCR-Image nötig.

Das GHCR-Paket bleibt bei diesem Deployment-Weg privat. Ein einmal öffentliches GHCR-Paket kann laut GitHub nicht zurück auf privat gestellt werden. Bereits heruntergeladener Quellcode oder Images lassen sich durch einen späteren Sichtbarkeitswechsel nicht zurückholen.

## Build aus einem lokalen Checkout

Die bisherige Compose-Datei für einen lokalen Checkout heißt `compose.local.yaml`. Sie verwendet `build: .` und die lokale `.env`. Start: `docker compose -f compose.local.yaml up -d --build`. Die Hauptdatei `compose.yaml` ist für Hostingers URL-Import vorgesehen.
