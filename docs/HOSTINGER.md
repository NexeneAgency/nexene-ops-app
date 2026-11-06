# Hostinger: Aus URL erstellen

Die öffentliche Deployment-Konfiguration wird separat unter `NexeneAgency/nexene-ops-deploy` verwaltet. Dieses Repository enthält ausschließlich Compose, Beispielkonfiguration und Anleitung. App-Quellcode und Docker-Image bleiben privat.

Der Workflow `Checks` prüft zuerst die Anwendung einschließlich Browser-/Barrierefreiheitstests. Nur nach erfolgreicher Prüfung von `main` wird `ghcr.io/nexeneagency/nexene-ops-app:latest` veröffentlicht. Zusätzlich gibt es das unveränderliche Tag `sha-<vollständiger-Commit-SHA>`. Die erste Veröffentlichung bei GHCR ist privat; der Workflow prüft anschließend die Paket-Sichtbarkeit. Das Image ist für Linux/amd64 gebaut.

Hostinger benötigt die öffentliche Compose-Datei. Der Docker-Daemon auf dem VPS muss zusätzlich die Berechtigung zum Lesen des privaten Images erhalten. Registry-Token, SMTP-Zugang und erlaubte Admin-Adressen gehören ausschließlich auf den VPS.

Die öffentlichen Dateien und die vollständige Anleitung werden separat veröffentlicht. Nach deren Veröffentlichung lautet die Import-Adresse:

`https://raw.githubusercontent.com/NexeneAgency/nexene-ops-deploy/main/compose.yaml`

Die Datei verwendet `/opt/nexene-ops/.env` auf dem VPS und zwei dauerhafte, benannte Volumes. Die App ist an `127.0.0.1:3000` gebunden; die öffentliche Domain benötigt HTTPS über den vorhandenen Reverse Proxy. Es wird kein zusätzlicher Proxy gestartet und kein öffentlicher Port 80/443 beansprucht.
