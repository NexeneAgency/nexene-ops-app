# Nexene Ops auf Vercel

Vercel ist der vorgesehene Hosting-Weg. Ein Docker-Container, VPS-Zugang, Portfreigaben und ein eigener Reverse Proxy sind dafür nicht erforderlich.

Die Next.js-Anwendung läuft auf Node.js 24. Daten werden in einer externen, SQLite-kompatiblen Turso/libSQL-Datenbank gespeichert. Eine lokale SQLite-Datei ist auf Vercel ausdrücklich gesperrt: Serverless-Dateisysteme sind kein dauerhafter, gemeinsam genutzter Speicher. Dokumente, Kunden, Aufgaben, Freigaben, Login-Links und Sitzungen werden zentral in Turso gespeichert. PDF-Reports bis 3 MB werden ebenfalls dauerhaft in Turso gespeichert, in kleinen Binärblöcken mit separaten Metadaten. Andere Dateien bleiben Links; ein zusätzlicher Blob-Speicher wird für den aktuellen Umfang nicht benötigt.

## 1. Projekt importieren

In Vercel **Add New → Project** wählen und `NexeneAgency/nexene-ops-app` aus GitHub importieren. Das passende Agentur-Team auswählen.

- Framework: **Next.js**
- Root Directory: Repository-Wurzel, kein Unterordner
- Node.js: **24.x**
- Install/Build: Vercel-Standardwerte (`npm install`/`npm run build` beziehungsweise Lockfile-Installation)
- Keine eigene Output Directory oder Docker-Konfiguration eintragen.

## 2. Turso verbinden

Im Vercel Marketplace die Integration **Turso** auswählen, eine Datenbank erstellen und mit diesem Projekt verbinden. Eine passende EU-Region möglichst nahe Frankfurt wählen. Das konkrete Tarifangebot im eigenen Konto prüfen, bevor ein kostenpflichtiger Plan bestätigt wird.

Die Integration stellt typischerweise diese serverseitigen Variablen bereit:

```dotenv
TURSO_DATABASE_URL=libsql://DEINE-DATENBANK.turso.io
TURSO_AUTH_TOKEN=DEIN-DATENBANK-TOKEN
```

Diese Werte gehören ausschließlich in Vercels Environment Variables. Kein `NEXT_PUBLIC_` voranstellen, nichts davon in GitHub oder im Chat posten.

Falls die Turso-Integration nicht verfügbar ist: eine Turso-Datenbank im Anbieter-Dashboard anlegen und URL sowie Datenbanktoken in Vercel hinterlegen. Die App unterstützt beide Wege über dieselben Variablennamen.

Die Tabellen und die vorhandene Dokumentrevision-Migration werden beim ersten Datenbankzugriff transaktional initialisiert. Die konfigurierten Admin-Adressen werden dabei angelegt. Es wird keine lokale Datenbank automatisch hochgeladen oder mit vorhandenen Cloud-Daten überschrieben. Für diesen Wechsel wurde ein Neustart ohne bestehende Kundendaten gewählt.

## 3. Anwendung konfigurieren

Unter **Project → Settings → Environment Variables** für **Production** eintragen:

| Name           | Wert                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `ADMIN_EMAILS` | Eure drei zugelassenen Adressen, mit Komma getrennt                    |
| `SMTP_HOST`    | SMTP-Server                                                            |
| `SMTP_PORT`    | `587` für STARTTLS oder `465` für direktes TLS                         |
| `SMTP_SECURE`  | `false` bei 587, `true` bei 465                                        |
| `SMTP_USER`    | SMTP-Benutzername                                                      |
| `SMTP_PASS`    | SMTP-Passwort                                                          |
| `MAIL_FROM`    | Beim Anbieter erlaubter Absender, z. B. `Nexene Ops <ops@example.com>` |
| `DEV_MAIL_LOG` | `false`                                                                |
| `SEED_DEMO`    | `false`                                                                |

`APP_URL` ist optional, solange die automatisch bereitgestellte Vercel-Adresse genutzt wird. Ohne expliziten Wert verwendet die App Vercels vertrauenswürdige Deployment-Variablen für Login-Links und die Ursprungsprüfung. Bei einer eigenen Domain `APP_URL=https://ops.eure-domain.at` setzen und genau diese Adresse verwenden. Kein Unterpfad und keine Zugangsdaten in dieser URL.

`DATA_DIR`, `BACKUP_DIR`, `OPS_CPUS` und `OPS_MEMORY` sind auf Vercel nicht erforderlich. Die Docker-Ressourcenlimits gelten dort nicht.

Änderungen an Environment Variables benötigen ein neues Deployment.

## 4. Bereitstellen und prüfen

**Deploy** beziehungsweise nach dem Konfigurieren **Redeploy** wählen. Anschließend:

1. `https://EURE-VERCEL-ADRESSE/api/health` öffnen. Erwartet: `{"ok":true}`. Ohne Remote-Datenbankkonfiguration meldet die API HTTP 503; Runtime Logs geben die fehlenden Variablennamen an.
2. Die App öffnen und eine freigeschaltete Admin-Adresse eingeben.
3. Den echten E-Mail-Empfang und einmaligen Login prüfen.
4. Einen Kunden, ein Projekt und ein Dokument anlegen und nach erneutem Laden beziehungsweise einem weiteren Deployment deren Persistenz prüfen.
5. Einen Kundenkontakt separat anmelden und dessen eigenen Portalzugriff prüfen.

Vercel stellt HTTPS für seine eigenen Domains bereit. Eine eigene Domain kann danach unter **Settings → Domains** hinzugefügt und gemäß Vercels DNS-Anzeige verbunden werden. Bei eigener Domain `APP_URL` anpassen und neu bereitstellen.

## Preview-Deployments

Produktionsdatenbank und SMTP-Geheimnisse nicht pauschal an Vorschau-Deployments oder fremde Pull Requests weiterreichen. Für Previews eine separate Testdatenbank und Testkonfiguration verwenden. Ein Preview ohne Datenbankkonfiguration ist nicht als nutzbare Testinstanz eingerichtet; die App fällt bewusst nicht auf flüchtigen lokalen Speicher zurück.

## Transaktionen und Parallelität

Der Datenbankzugriff ist asynchron. Mehrschrittige Projekt- und Aufgabenänderungen verwenden echte libSQL-Transaktionen. Login-Limits, einmaliges Einlösen von Anmeldelinks, Freigabeentscheidungen und Dokumentrevisionen verwenden atomische SQL-Operationen und verlassen sich nicht auf den Speicher einer einzelnen Vercel-Instanz.

## Sicherungen und bestehende Daten

Turso ist die maßgebliche Datenquelle. Sicherungs-/Export- und Wiederherstellungsfunktionen sowie Aufbewahrung beim Datenbankanbieter prüfen und einrichten. `npm run backup` ist ausschließlich für lokale SQLite-Dateien gedacht und bricht bei aktiver Turso-Konfiguration ab, damit keine falsche lokale Sicherung für eine Cloud-Datenbank gehalten wird.

Vercel-Deployments sichern die Datenbank nicht automatisch. Vor späteren Migrationen eine geeignete Datenbanksicherung erstellen.

## Lokale Entwicklung

Ohne `TURSO_DATABASE_URL` und außerhalb Vercels funktioniert weiterhin eine SQLite-Datei im lokalen `data/`-Verzeichnis. Mit gesetzter Turso-URL greift auch die lokale App auf die konfigurierte externe Datenbank zu; deshalb für Entwicklung eine eigene Testdatenbank verwenden.

Die Docker-Dateien bleiben als alternative Betriebsart im Repository. Der Docker-Image-Publish ist nur noch manuell über den Workflow-Parameter `publish_docker` vorgesehen; normale Pushes führen die Qualitätsprüfungen aus.
