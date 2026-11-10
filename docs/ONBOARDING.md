# Kunden-Onboarding

Im Projekt startet „Onboarding starten“ ein Formular mit fünf Schritten. Bereits gespeicherte Angaben lassen sich über „Onboarding fortsetzen“ öffnen. Nach dem Abschluss zeigt der Button „Onboarding abgeschlossen“ und öffnet die Zusammenfassung unter „Dokumente“.

## Ablauf

1. Unternehmen, Ansprechperson, Website und CMS erfassen. Bei neuen Webdesign-Projekten kann angegeben werden, dass noch keine Website-Adresse existiert.
2. Projektziele, Angebote und Zielgruppe beschreiben. Je nach Projekttyp folgen Seiten/Funktionen und Termine oder Suchbegriffe, Wettbewerber und Zielregionen. Lokale Unternehmen erhalten zusätzlich eine Abfrage zum Google-Unternehmensprofil.
3. Für jedes relevante System den Status auswählen: Einladung gesendet, Nexene hat bereits Zugriff, Konto/Zugriff noch nicht vorhanden oder System wird nicht verwendet. Hinweise sind optional. Das Formular erklärt die benötigten Rechte pro System.
4. Links zu Branding, Inhalten und freigegebenen Rechtstexten sowie Hinweise auf weitere Integrationen hinterlegen.
5. Angaben prüfen und bestätigen. Der Server speichert die Zusammenfassung als sichtbares Projektdokument in einer Transaktion mit dem Abschlussstatus.

„Weiter“, „Zurück“ und „Speichern und schließen“ sichern den Stand. Ein noch nicht gespeicherter Text geht bei einem direkten Browserabbruch möglicherweise verloren. Gleichzeitige Änderungen überschreiben sich nicht: Der zweite Bearbeiter erhält einen Konflikthinweis und kann den aktuellen Stand bewusst laden. Wiederholtes Abschließen erzeugt kein zweites Dokument.

## Zugriffe

| Projekttyp | Abgefragte Systeme                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Webdesign  | CMS, Domain/DNS, Hosting/CDN, Analytics, Search Console, Tag Manager, Consent-Tool                                                 |
| SEO + GEO  | CMS, Search Console, Analytics, Tag Manager, Consent-Tool, Bing Webmaster Tools; bei lokalen Unternehmen Google-Unternehmensprofil |

Systeme ohne bestehendes Konto dürfen ausdrücklich als fehlend markiert werden. Domain-/Hosting-Zugänge für spätere technische SEO-Änderungen werden erst bei Bedarf abgestimmt. Weitere Systeme können im Integrationsfeld genannt werden.

Für Auswertungen genügen meist Leserechte. Search Console fragt einen vollständigen Nutzer ohne Eigentumsübertragung ab; Google Analytics zunächst Betrachter, CMS zunächst Editor. Technische Administrations- und Veröffentlichungsrechte werden nur bei vereinbarten Änderungen benötigt. Die Inhaberschaft der Konten bleibt beim Kunden.

## Einladungsadresse

`ONBOARDING_EMAIL` enthält das zentrale Nexene-Konto. Die Variable wird für Production in Vercel gepflegt. Ohne eigenen Wert verwendet die App die erste konfigurierte Admin-Adresse. Bei einer Änderung ist ein neues Deployment erforderlich.

Die Adresse sollte Post empfangen und als echte Identität bei den verwendeten Diensten funktionieren. Ein Alias oder Verteiler ersetzt nicht bei allen Diensten ein Nutzerkonto. Das Formular gewährt selbst keine Zugriffsrechte und sendet keine Einladungen: Diese erfolgen in den jeweiligen Systemen.

## Dokument und Prüfung

Das Dokument enthält die eingegebenen Informationen, gemeldete Zugriffsstatus, Hinweise, Einladungsadresse, Absender und Zeitpunkt. Es ist für Nexene und die berechtigten Kontakte dieses Kunden sichtbar. Fremde Kunden können weder Entwürfe lesen noch Angaben speichern.

„Onboarding abgeschlossen“ bedeutet, dass die Angaben übermittelt wurden. Es bestätigt keine technische Prüfung von Einladungen. Nexene prüft die Zugriffe anschließend; fehlende Konten bleiben im Dokument erkennbar. Passwörter, API-Schlüssel und Wiederherstellungscodes gehören nicht in das Formular.
