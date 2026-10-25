import type { Metadata } from "next";
import { Placeholder } from "@/components/placeholder";
import { Badge, Card, Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Datenschutz",
  description:
    "Wie der Freistaat-Prototyp mit Daten umgeht: Hosting, lokale Demo-Daten und Discord-Links.",
};

export default function PrivacyPage() {
  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <Badge tone="warning">Entwurf</Badge>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text">
        Datenschutz
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted">
        Diese Erklärung beschreibt den aktuellen Prototyp. Es gibt noch keine
        Anmeldung und keine serverseitige Speicherung von Stimmen oder
        Unterschriften.
      </p>

      <Card className="mt-6 border-warning/30 bg-warning/5 p-5">
        <p className="text-sm font-medium text-text">
          Vor dem Livebetrieb ergänzen.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Verantwortliche Person, Kontakt und Auftragsverarbeitung sind noch
          Platzhalter. Sobald Discord-Login und Supabase aktiviert werden, muss
          diese Erklärung erweitert und rechtlich geprüft werden.
        </p>
      </Card>

      <div className="law-prose mt-10">
        <h2>1. Verantwortliche Person</h2>
        <p>
          Verantwortlich für die Datenverarbeitung auf dieser Website ist:
          <br />
          <Placeholder>Name der verantwortlichen Person</Placeholder>
          <br />
          <Placeholder>Straße und Hausnummer</Placeholder>
          <br />
          <Placeholder>Postleitzahl und Ort</Placeholder>
          <br />
          E-Mail: <Placeholder>E-Mail-Adresse</Placeholder>
        </p>

        <h2>2. Hosting bei Vercel</h2>
        <p>
          Die Website wird bei der Vercel Inc. (USA) gehostet. Beim Aufruf der
          Website verarbeitet Vercel technisch notwendige Verbindungsdaten,
          damit die Seite ausgeliefert und der Betrieb abgesichert werden kann.
        </p>
        <p>
          Dazu können IP-Adresse, Zeitpunkt des Zugriffs, aufgerufene Adresse,
          übertragene Datenmenge, Browser- und Betriebssystemkennung sowie die
          zuvor besuchte Seite gehören. Rechtsgrundlage ist unser berechtigtes
          Interesse an einem sicheren und stabilen Betrieb nach Art. 6 Abs. 1
          lit. f DSGVO.
        </p>
        <p>
          Vercel Inc. sitzt in den USA. Einzelheiten zur Übermittlung und zu den
          eingesetzten Garantien stehen in der{" "}
          <a
            href="https://vercel.com/legal/privacy-policy"
            target="_blank"
            rel="noreferrer"
          >
            Datenschutzerklärung von Vercel
          </a>
          . Vor dem Livebetrieb ist ein Auftragsverarbeitungsvertrag mit Vercel
          zu prüfen.
        </p>

        <h2>3. Server-Logfiles</h2>
        <p>
          Der Hosting-Anbieter speichert technische Logs für einen kurzen
          Zeitraum, um Angriffe und Störungen nachvollziehen zu können. Wir
          führen keine eigenen Logfiles und werten die Logs nicht zu
          Werbezwecken aus. Die genaue Speicherdauer richtet sich nach den
          Vorgaben von Vercel.
        </p>

        <h2>4. Cookies, Analyse und Werbung</h2>
        <p>
          Die Website setzt keine Cookies, kein Tracking und keine
          Analyse-Werkzeuge ein. Es gibt keine Werbung und keine Profile über
          Besucher.
        </p>

        <h2>5. Lokale Demo-Daten im Browser</h2>
        <p>
          Abstimmungen und Unterschriften sind im Prototyp nur eine Simulation.
          Wenn du abstimmst oder unterschreibst, speichert die Website einen
          Eintrag im <code>localStorage</code> deines Browsers – zum Beispiel
          unter <code>freistaat:vote:…</code> oder{" "}
          <code>freistaat:signature:…</code>.
        </p>
        <p>
          Diese Daten bleiben auf deinem Gerät und werden nicht an einen Server
          übertragen. Du kannst sie jederzeit über die Einstellungen deines
          Browsers oder die Zurücksetzen-Schaltflächen auf der Website löschen.
        </p>

        <h2>6. Discord</h2>
        <p>
          Die Website verlinkt auf den Discord-Server des Projekts. Erst wenn du
          einen solchen Link anklickst, werden Daten an die Discord Inc.
          übertragen. Welche Daten Discord verarbeitet, regelt die{" "}
          <a
            href="https://discord.com/privacy"
            target="_blank"
            rel="noreferrer"
          >
            Datenschutzerklärung von Discord
          </a>
          . Die Website selbst bindet Discord nicht als Iframe oder Widget ein.
        </p>

        <h2>7. Kontakt</h2>
        <p>
          Wenn du uns per E-Mail kontaktierst, verarbeiten wir deine Angaben zur
          Bearbeitung der Anfrage. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b
          DSGVO bei vertragsbezogenen Anfragen, sonst Art. 6 Abs. 1 lit. f
          DSGVO. Die Daten werden gelöscht, sobald die Anfrage erledigt ist und
          keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
        </p>

        <h2>8. Deine Rechte</h2>
        <p>
          Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16
          DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung
          (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO) und Widerspruch
          gegen die Verarbeitung (Art. 21 DSGVO). Außerdem kannst du dich bei
          einer Datenschutz-Aufsichtsbehörde beschweren, insbesondere in dem
          Bundesland deines Aufenthaltsorts, deines Arbeitsplatzes oder des Orts
          des mutmaßlichen Verstoßes.
        </p>

        <h2>9. Keine automatisierte Entscheidungsfindung</h2>
        <p>
          Es findet keine automatisierte Entscheidungsfindung mit rechtlicher
          Wirkung und kein Profiling im Sinne des Art. 22 DSGVO statt.
        </p>

        <h2>10. Geplanter Ausbau</h2>
        <p>
          Eine Anmeldung über Discord und eine echte Stimmabgabe mit Supabase
          sind noch nicht aktiv. Sobald sie eingeführt werden, verarbeitet die
          Website zusätzlich Discord-ID, Anzeigename und Rollen, um die
          Wahlberechtigung zu prüfen, sowie die abgegebenen Stimmen. Diese
          Erklärung wird vor der Aktivierung entsprechend ergänzt.
        </p>

        <p className="text-xs text-faint">Stand: 25. Oktober 2026</p>
      </div>
    </Container>
  );
}
