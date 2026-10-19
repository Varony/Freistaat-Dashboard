import type { Metadata } from "next";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Impressum",
};

export default function ImprintPage() {
  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-text">Impressum</h1>
      <div className="law-prose mt-6">
        <p>
          Dies ist ein Prototyp. Vor dem Livegang müssen hier die vollständigen
          Angaben zur verantwortlichen Person stehen.
        </p>
        <p>
          <strong>Platzhalter:</strong> Name, Anschrift und Kontaktadresse der
          verantwortlichen Person.
        </p>
        <p>
          Der Freistaat ist eine private Demokratie-Simulation auf Discord und
          kein Angebot einer Behörde oder Regierung.
        </p>
      </div>
    </Container>
  );
}
