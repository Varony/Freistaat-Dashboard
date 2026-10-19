import type { Metadata } from "next";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Datenschutz",
};

export default function PrivacyPage() {
  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-text">
        Datenschutz
      </h1>
      <div className="law-prose mt-6">
        <p>
          Dieser Prototyp speichert keine personenbezogenen Daten auf einem
          Server. Abstimmungen und Unterschriften werden ausschließlich lokal im
          Browser simuliert.
        </p>
        <p>
          Beim späteren Livebetrieb werden Discord-ID, Anzeigename und Rollen
          verarbeitet, um die Wahlberechtigung zu prüfen. Dafür wird vor dem
          Livegang eine vollständige Datenschutzerklärung ergänzt.
        </p>
        <p>
          <strong>Platzhalter:</strong> Verantwortliche Person, Zwecke,
          Aufbewahrungsfristen, Rechtsgrundlagen und Kontakt für Löschanträge.
        </p>
      </div>
    </Container>
  );
}
