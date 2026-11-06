# Hostinger: Aus URL erstellen

Die zentrale Deployment-Datei ist direkt im App-Repository:

```text
https://raw.githubusercontent.com/NexeneAgency/nexene-ops-app/main/compose.yaml
```

Voraussetzung: Das App-Repository ist öffentlich. Hostinger importiert die Compose-Datei; Docker lädt den öffentlichen Git-Quellcode und baut das Image auf dem VPS. Der erste Start dauert deshalb länger als das Abrufen eines fertigen Images. Es sind weder ein Registry-Token noch ein separates Deployment-Repository nötig.

## 1. Einstellungen einmalig auf dem VPS speichern

In Hostingers Webkonsole als root (gegebenenfalls zuerst `sudo -i`):

```sh
install -d -m 700 /opt/nexene-ops
curl --fail --show-error --location \
  https://raw.githubusercontent.com/NexeneAgency/nexene-ops-app/main/deploy/env.example \
  -o /opt/nexene-ops/.env
chmod 600 /opt/nexene-ops/.env
nano /opt/nexene-ops/.env
```

Alle Beispiele durch die echte HTTPS-Adresse, die freigeschalteten Admin-E-Mail-Adressen und SMTP-Zugangsdaten ersetzen. Mehrere Admin-Adressen mit Komma trennen. Port 587 verwendet STARTTLS mit `SMTP_SECURE=false`, Port 465 verwendet `SMTP_SECURE=true`. Zugangsdaten nicht in GitHub hochladen.

## 2. In Hostinger bereitstellen

**URL:** `https://raw.githubusercontent.com/NexeneAgency/nexene-ops-app/main/compose.yaml`

**Anwendungsname:** `nexene-ops`

Dann **Bereitstellen** auswählen. Der Build benötigt den öffentlichen Quellcode und Zugriff auf Docker Hub und npm. Es wird kein Image aus der GitHub Container Registry benötigt.

## 3. Domain und HTTPS

Die App lauscht nur auf `127.0.0.1:3000`. Eure Domain muss per DNS auf den VPS zeigen und der vorhandene Reverse Proxy HTTPS auf diesen Port weiterleiten. Ein Beispiel für einen auf dem Host installierten Caddy:

```caddy
ops.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

Die Domain identisch in `APP_URL` hinterlegen. Ein in Docker laufender Proxy benötigt ein gemeinsames Docker-Netzwerk statt `127.0.0.1`. Die Compose-Datei startet keinen weiteren Proxy und beansprucht keine öffentlichen Ports 80/443.

Prüfen:

```sh
curl --fail http://127.0.0.1:3000/api/health
```

Erwartet: `{"ok":true}`. Danach über die HTTPS-Adresse einen Anmeldelink für eine hinterlegte Admin-Adresse anfordern.

## Daten, Sicherungen und Updates

Die festen Volumes `nexene_ops_data` und `nexene_ops_backups` bleiben bei Container-Updates erhalten. Nur eine Instanz mit diesen Volumes betreiben. In der Container-Konsole erzeugt `node scripts/backup.mjs` eine konsistente Sicherung im Backup-Volume. Zusätzlich regelmäßige Sicherungen außerhalb des VPS einrichten.

Für ein Update den aktuellen Quellcode erneut bauen. Bei einem lokalen Checkout: `docker compose up -d --build`. In Hostinger die Funktion zum erneuten Bauen/Bereitstellen verwenden. Vor Updates sichern; Volumes nicht löschen.

## Später wieder privat

Das Repository kann später wieder privat gestellt werden. Der bereits gebaute Container läuft weiter. Neue Builds aus der anonymen Git-URL und neue URL-Importe funktionieren dann nicht mehr. Für spätere Updates ist wieder ein authentifizierter Zugriff oder das bereits vorhandene private GHCR-Image nötig.

Das GHCR-Paket bleibt bei diesem Deployment-Weg privat. Ein einmal öffentliches GHCR-Paket kann laut GitHub nicht zurück auf privat gestellt werden. Bereits heruntergeladener Quellcode oder Images lassen sich durch einen späteren Sichtbarkeitswechsel nicht zurückholen.

## Build aus einem lokalen Checkout

Die bisherige Compose-Datei für einen lokalen Checkout heißt `compose.local.yaml`. Sie verwendet `build: .` und die lokale `.env`. Start: `docker compose -f compose.local.yaml up -d --build`. Die Hauptdatei `compose.yaml` ist für Hostingers URL-Import vorgesehen.
