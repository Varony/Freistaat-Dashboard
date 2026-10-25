import type { Metadata } from "next";
import { Placeholder } from "@/components/placeholder";
import { Badge, Card, Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Datenschutz",
  description:
    "Wie der Freistaat mit Daten umgeht: Hosting, Discord-Login, Stimmen, Unterschriften und lokale Demo-Daten.",
};

export default function PrivacyPage() {
  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <Badge tone="warning">Entwurf</Badge>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text">
        Datenschutz
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted">
        Diese Erklärung beschreibt den aktuellen Stand. Ist Supabase
        konfiguriert, werden Discord-Login, Stimmen und Unterschriften
        serverseitig verarbeitet. Ohne Konfiguration bleibt die Website bei
        Beispieldaten und lokalen Demo-Daten.
      </p>

      <Card className="mt-6 border-warning/30 bg-warning/5 p-5">
        <p className="text-sm font-medium text-text">
          Vor dem Livebetrieb ergänzen.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Verantwortliche Person und Kontakt sind noch Platzhalter. Sobald
          Supabase und Discord produktiv genutzt werden, muss diese Erklärung
          rechtlich geprüft und um die konkrete Datenbankregion ergänzt werden.
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
          Die Website wird bei der Vercel Inc. (USA) gehostet. Beim Aufruf
          verarbeitet Vercel technisch notwendige Verbindungsdaten, damit die
          Seite ausgeliefert und der Betrieb abgesichert werden kann.
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

        <h2>3. Anmeldung über Discord</h2>
        <p>
          Wenn du dich anmeldest, läuft der Login über den Discord-OAuth-Flow
          und Supabase Auth. Dabei werden deine Discord-ID, dein Anzeigename,
          dein Avatar und die Information, ob die Anmeldung erfolgreich war,
          verarbeitet. In der Datenbank speichern wir daraus ein Profil mit
          Discord-ID, Anzeigename, Avatar-URL, Rolle und Beitrittszeitpunkt.
        </p>
        <p>
          Rechtsgrundlage ist die Durchführung der Simulation nach Art. 6 Abs. 1
          lit. b DSGVO sowie unser berechtigtes Interesse an einem sicheren
          Login nach Art. 6 Abs. 1 lit. f DSGVO. Discord Inc. verarbeitet die
          Anmeldedaten als eigener Verantwortlicher; siehe{" "}
          <a
            href="https://discord.com/privacy"
            target="_blank"
            rel="noreferrer"
          >
            Datenschutzerklärung von Discord
          </a>
          .
        </p>

        <h2>4. Stimmen und Unterschriften</h2>
        <p>
          Bei einer Abstimmung speichern wir, welche Option du bei welcher Wahl
          gewählt hast, verknüpft mit deinem Profil und dem Zeitpunkt. Bei einem
          Bürgerbegehren speichern wir, dass du es unterstützt hast. So kann die
          Website eine Stimme pro Wahl und eine Unterschrift pro Begehren
          durchsetzen.
        </p>
        <p>
          Andere Besucher sehen diese Zuordnung nicht. Öffentlich sind nur
          aggregierte Unterschriftenzahlen und veröffentlichte
          Wahlergebnisse. Rechtsgrundlage ist die Durchführung der Simulation
          nach Art. 6 Abs. 1 lit. b DSGVO; die Sicherung gegen Mehrfachstimmen
          stützt sich zusätzlich auf Art. 6 Abs. 1 lit. f DSGVO.
        </p>
        <p>
          Die Daten werden bei Supabase gespeichert. Supabase handelt dabei als
          Auftragsverarbeiter; Einzelheiten stehen in der{" "}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noreferrer"
          >
            Datenschutzerklärung von Supabase
          </a>
          . Die konkrete Datenbankregion wird vor dem Livebetrieb ergänzt.
        </p>
        <p>
          Stimmen und Unterschriften bleiben bis zur Löschung deines Kontos oder
          bis zu einer berechtigten Löschanfrage gespeichert. Aggregierte
          Ergebnisse können auch danach als anonyme Summen erhalten bleiben.
        </p>

        <h2>5. Cookies und Session</h2>
        <p>
          Ohne Supabase-Konfiguration setzt die Website keine Cookies. Mit
          Supabase werden technisch notwendige Session-Cookies gesetzt, damit du
          angemeldet bleibst. Es gibt keine Marketing-, Tracking- oder
          Analyse-Cookies. Die Session-Cookies sind für den Login erforderlich;
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. b und lit. f DSGVO.
        </p>

        <h2>6. Lokale Demo-Daten</h2>
        <p>
          Ohne Supabase-Konfiguration sind Abstimmungen und Unterschriften nur
          eine Simulation. Die Website speichert dann einen Eintrag im{" "}
          <code>localStorage</code> deines Browsers – zum Beispiel unter{" "}
          <code>freistaat:vote:…</code> oder{" "}
          <code>freistaat:signature:…</code>. Diese Daten bleiben auf deinem
          Gerät und werden nicht an einen Server übertragen. Du kannst sie
          jederzeit über die Einstellungen deines Browsers oder die
          Zurücksetzen-Schaltflächen löschen.
        </p>

        <h2>7. Server-Logfiles</h2>
        <p>
          Der Hosting-Anbieter speichert technische Logs für einen kurzen
          Zeitraum, um Angriffe und Störungen nachvollziehen zu können. Wir
          führen keine eigenen Logfiles und werten die Logs nicht zu
          Werbezwecken aus. Die genaue Speicherdauer richtet sich nach den
          Vorgaben von Vercel.
        </p>

        <h2>8. Discord-Links</h2>
        <p>
          Die Website verlinkt auf den Discord-Server des Projekts. Erst wenn du
          einen solchen Link anklickst, werden Daten an die Discord Inc.
          übertragen. Die Website bindet Discord nicht als Iframe oder Widget
          ein.
        </p>

        <h2>9. Kontakt</h2>
        <p>
          Wenn du uns per E-Mail kontaktierst, verarbeiten wir deine Angaben zur
          Bearbeitung der Anfrage. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b
          DSGVO bei vertragsbezogenen Anfragen, sonst Art. 6 Abs. 1 lit. f
          DSGVO. Die Daten werden gelöscht, sobald die Anfrage erledigt ist und
          keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
        </p>

        <h2>10. Deine Rechte</h2>
        <p>
          Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16
          DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung
          (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO) und Widerspruch
          gegen die Verarbeitung (Art. 21 DSGVO). Außerdem kannst du dich bei
          einer Datenschutz-Aufsichtsbehörde beschweren, insbesondere in dem
          Bundesland deines Aufenthaltsorts, deines Arbeitsplatzes oder des Orts
          des mutmaßlichen Verstoßes.
        </p>

        <h2>11. Keine automatisierte Entscheidungsfindung</h2>
        <p>
          Es findet keine automatisierte Entscheidungsfindung mit rechtlicher
          Wirkung und kein Profiling im Sinne des Art. 22 DSGVO statt.
        </p>

        <h2>12. Weiterentwicklung</h2>
        <p>
          Geplant sind eine Prüfung der Discord-Rolle „Bürger“ und eine
          Oberfläche für die Wahlleitung. Sobald sich dadurch die
          Datenverarbeitung ändert, wird diese Erklärung vor der Aktivierung
          ergänzt.
        </p>

        <p className="text-xs text-faint">Stand: 25. Oktober 2026</p>
      </div>
    </Container>
  );
}
