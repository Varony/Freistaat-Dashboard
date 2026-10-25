import type { Metadata } from "next";
import { Placeholder } from "@/components/placeholder";
import { Badge, Card, Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Impressum",
  description:
    "Anbieterkennzeichnung und Kontakt für den Freistaat-Prototyp.",
};

export default function ImprintPage() {
  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <Badge tone="warning">Platzhalter</Badge>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text">
        Impressum
      </h1>

      <Card className="mt-6 border-warning/30 bg-warning/5 p-5">
        <p className="text-sm font-medium text-text">
          Diese Angaben sind noch nicht vollständig.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Der Freistaat ist ein privates Prototyp-Projekt und kein Angebot einer
          Behörde. Vor dem Livebetrieb müssen die markierten Angaben ersetzt und
          rechtlich geprüft werden.
        </p>
      </Card>

      <div className="law-prose mt-10">
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          <Placeholder>Name der verantwortlichen Person</Placeholder>
          <br />
          <Placeholder>Straße und Hausnummer</Placeholder>
          <br />
          <Placeholder>Postleitzahl und Ort</Placeholder>
        </p>

        <h2>Kontakt</h2>
        <p>
          E-Mail: <Placeholder>E-Mail-Adresse</Placeholder>
        </p>
        <p>
          Ein Kontaktformular gibt es nicht. Anfragen zum Projekt laufen über den
          Discord-Server.
        </p>

        <h2>Verantwortlich für den Inhalt</h2>
        <p>
          <Placeholder>Name der verantwortlichen Person</Placeholder>, Anschrift
          wie oben.
        </p>

        <h2>Art des Angebots</h2>
        <p>
          Der Freistaat ist eine private Demokratie-Simulation auf Discord. Die
          Website dokumentiert Wahlen, Bürgerbegehren, Parteien und Gesetze
          dieser Simulation. Sie ist kein Angebot einer Regierung, Behörde oder
          öffentlichen Einrichtung.
        </p>

        <h2>Haftung für Inhalte</h2>
        <p>
          Die Inhalte werden mit Sorgfalt erstellt, erheben aber keinen Anspruch
          auf Vollständigkeit oder rechtliche Verbindlichkeit. Verbindlich sind
          die Beschlüsse und Regeln im Discord-Server. Für Schäden aus der
          Nutzung der Simulation wird keine Haftung übernommen, soweit dies
          gesetzlich zulässig ist.
        </p>

        <h2>Haftung für Links</h2>
        <p>
          Die Website verlinkt auf externe Angebote, insbesondere Discord. Für
          deren Inhalte und Datenverarbeitung sind die jeweiligen Anbieter
          verantwortlich. Zum Zeitpunkt der Verlinkung waren keine
          rechtswidrigen Inhalte erkennbar.
        </p>

        <h2>Urheberrecht</h2>
        <p>
          Texte und Gestaltung des Prototyps dürfen ohne Zustimmung nicht
          außerhalb der Simulation veröffentlicht werden. Gesetzestexte und
          Beschlüsse der Simulation bleiben Teil des gemeinsamen Projekts.
        </p>

        <p className="text-xs text-faint">Stand: 25. Oktober 2026</p>
      </div>
    </Container>
  );
}
