import type { Candidate, Election, Initiative, Law, Party } from "./types";
import { deriveElectionStatus, deriveInitiativeStatus } from "./status";

export const parties: Party[] = [
  {
    id: "freie-buerger",
    name: "Freie Bürger",
    shortName: "FB",
    color: "#c9a86a",
    leader: "Tim",
    members: 9,
    program:
      "Weniger Regeln, mehr Eigenverantwortung. Transparente Abstimmungen und eine schlanke Verwaltung.",
  },
  {
    id: "soziale-liste",
    name: "Soziale Liste",
    shortName: "SL",
    color: "#7f9bb3",
    leader: "André",
    members: 7,
    program:
      "Gemeinschaftliche Projekte, faire Zugänge und ein starker Rat für alle Bürger.",
  },
  {
    id: "unabhaengige",
    name: "Unabhängige",
    shortName: "UNA",
    color: "#9c8fb3",
    leader: "Jakob",
    members: 4,
    program:
      "Überparteiliche Anträge, wechselnde Mehrheiten und keine Fraktionsdisziplin.",
  },
];

function candidate(
  id: string,
  name: string,
  initials: string,
  partyId: string | undefined,
  statement: string,
  listPosition?: number,
): Candidate {
  return { id, name, initials, partyId, statement, listPosition };
}

const tim = candidate(
  "tim",
  "Tim",
  "T",
  "freie-buerger",
  "Für einen Rat, der Entscheidungen erklärt, statt sie nur zu treffen.",
  1,
);
const jascha = candidate(
  "jascha",
  "Jascha",
  "J",
  "freie-buerger",
  "Bildung, Transparenz und ein offenes Ohr für alle Bürger.",
  2,
);
const mia = candidate(
  "mia",
  "Mia",
  "M",
  "freie-buerger",
  "Kurze Wege, klare Regeln und verlässliche Abstimmungen.",
  3,
);
const andre = candidate(
  "andre",
  "André",
  "A",
  "soziale-liste",
  "Mehr Beteiligung, klarere Regeln und offene Ausschüsse.",
  1,
);
const lea = candidate(
  "lea",
  "Lea",
  "L",
  "soziale-liste",
  "Soziale Projekte gehören ins Zentrum der Simulation.",
  2,
);
const jonas = candidate(
  "jonas",
  "Jonas",
  "J",
  "soziale-liste",
  "Wir wollen Debatten, die zu Entscheidungen führen.",
  3,
);
const jakob = candidate(
  "jakob",
  "Jakob",
  "J",
  "unabhaengige",
  "Unabhängig, direkt und ohne Fraktionszwang.",
  1,
);
const sam = candidate(
  "sam",
  "Sam",
  "S",
  "unabhaengige",
  "Neue Ideen für eine lebendige Simulation.",
  2,
);
const lorenz = candidate(
  "lorenz",
  "Lorenz",
  "L",
  undefined,
  "Ruhe, Verfahrenstreue und nachvollziehbare Urteile.",
);
const sprit = candidate(
  "spritzk1ng",
  "Spr1tzk1ng",
  "S",
  "unabhaengige",
  "Frische Perspektiven und kurze Wege zur Basis.",
);

export const elections: Election[] = [
  {
    id: "wahl-ministerpraesident-2026",
    slug: "ministerpraesident-2026",
    title: "Wahl des Ministerpräsidenten",
    office: "Ministerpräsident",
    description:
      "Die Bürger wählen das Staatsoberhaupt des Freistaats. Gewählt ist, wer die meisten Stimmen erhält.",
    type: "person",
    status: "open",
    eligibleVoters: 24,
    candidacyEndsAt: "2026-10-17T18:00:00.000Z",
    votingEndsAt: "2026-10-24T18:00:00.000Z",
    candidates: [tim, andre, jakob, jascha],
  },
  {
    id: "wahl-rat-2026",
    slug: "rat-2026",
    title: "Wahl des Rats der Republik",
    office: "Rat der Republik",
    description:
      "Fünf Sitze werden nach den Listen der Parteien vergeben. Jede Stimme zählt für eine Liste.",
    type: "rat",
    status: "open",
    seats: 5,
    eligibleVoters: 24,
    candidacyEndsAt: "2026-10-18T18:00:00.000Z",
    votingEndsAt: "2026-10-31T18:00:00.000Z",
    parties: ["freie-buerger", "soziale-liste", "unabhaengige"],
    candidates: [tim, jascha, mia, andre, lea, jonas, jakob, sam],
  },
  {
    id: "wahl-kultusminister-2026",
    slug: "kultusminister-2026",
    title: "Wahl des Kultusministers",
    office: "Kultusminister",
    description:
      "Das Amt verantwortet Bildung, Veranstaltungen und die Regeln des Miteinanders.",
    type: "person",
    status: "candidacy",
    eligibleVoters: 24,
    candidacyEndsAt: "2026-10-23T18:00:00.000Z",
    votingEndsAt: "2026-10-30T18:00:00.000Z",
    candidates: [jascha, jakob],
  },
  {
    id: "wahl-oberster-gerichtshof-2026",
    slug: "oberster-gerichtshof-2026",
    title: "Wahl des Obersten Gerichtshofs",
    office: "Oberster Gerichtshof",
    description:
      "Die Wahl ist abgeschlossen. Der Gerichtshof prüft Beschlüsse und Streitfälle der Simulation.",
    type: "person",
    status: "published",
    eligibleVoters: 7,
    turnout: 2,
    candidacyEndsAt: "2026-10-10T18:00:00.000Z",
    votingEndsAt: "2026-10-14T18:00:00.000Z",
    candidates: [lorenz],
    result: [{ candidateId: "lorenz", votes: 2 }],
  },
  {
    id: "volksabstimmung-titelverlust",
    slug: "titelverlust",
    title: "Volksabstimmung: Titelverlust bei Rücktritt",
    office: "Volksabstimmung",
    description:
      "Wer vom Amt des Ministerpräsidenten zurücktritt, soll den Titel sofort verlieren. Die Abstimmung geht auf ein qualifiziertes Bürgerbegehren zurück.",
    type: "referendum",
    status: "open",
    eligibleVoters: 24,
    candidacyEndsAt: "2026-10-20T18:00:00.000Z",
    votingEndsAt: "2026-10-27T18:00:00.000Z",
    candidates: [
      { id: "ja", name: "Ja", initials: "J" },
      { id: "nein", name: "Nein", initials: "N" },
    ],
  },
];

export const initiatives: Initiative[] = [
  {
    id: "initiative-wahlsystem",
    slug: "wahlsystem-eine-stimme",
    title: "Neues Wahlsystem: eine Stimme pro Person",
    summary:
      "Mehrfachstimmen sollen abgeschafft werden. Jede Person erhält bei jeder Wahl genau eine Stimme.",
    text: "Bei allen Wahlen des Freistaats soll jede wahlberechtigte Person genau eine Stimme erhalten. Mehrfachstimmen und Stimmübertragungen werden abgeschafft. Die Wahlleitung prüft die Einhaltung vor der Auszählung.\n\nDas Begehren richtet sich an den Rat. Wird die Schwelle erreicht, wird automatisch eine Volksabstimmung angesetzt.",
    author: "Jascha",
    status: "collecting",
    signatures: 7,
    threshold: 12,
    createdAt: "2026-10-12T10:00:00.000Z",
    endsAt: "2026-10-26T18:00:00.000Z",
  },
  {
    id: "initiative-titelverlust",
    slug: "titelverlust",
    title: "Titelverlust bei Rücktritt",
    summary:
      "Wer vom Amt des Ministerpräsidenten zurücktritt, verliert den Titel sofort.",
    text: "Tritt eine Person vom Amt des Ministerpräsidenten zurück, so verliert sie mit sofortiger Wirkung den Titel „Ministerpräsident“. Eine erneute Bewerbung bleibt möglich.\n\nDie Schwelle wurde erreicht. Das Begehren ist qualifiziert und wird als Volksabstimmung zur Entscheidung vorgelegt.",
    author: "André",
    status: "qualified",
    signatures: 14,
    threshold: 12,
    createdAt: "2026-10-05T09:00:00.000Z",
    endsAt: "2026-10-20T18:00:00.000Z",
    referendumSlug: "titelverlust",
  },
  {
    id: "initiative-spitznamen",
    slug: "spitznamen-minister",
    title: "Minister dürfen ihre Spitznamen anpassen",
    summary:
      "Amtsträger sollen ihren Anzeigenamen im Discord selbst ändern dürfen.",
    text: "Minister und Ministerinnen sollen ihren Anzeigenamen im Discord ohne Zustimmung der Wahlleitung anpassen dürfen. Die Amtsbezeichnung bleibt davon unberührt.\n\nDie Frist ist abgelaufen, ohne dass die Schwelle erreicht wurde.",
    author: "Spr1tzk1ng",
    status: "expired",
    signatures: 3,
    threshold: 12,
    createdAt: "2026-09-28T14:00:00.000Z",
    endsAt: "2026-10-12T18:00:00.000Z",
  },
  {
    id: "initiative-ministerbefragung",
    slug: "ministerbefragung",
    title: "Öffentliche Ministerbefragung",
    summary:
      "Jeden Monat soll eine öffentliche Fragerunde mit einem Minister stattfinden.",
    text: "Einmal im Monat findet eine öffentliche Fragerunde statt. Die Fragen werden vorab im Discord gesammelt, die Antworten im Anschluss veröffentlicht.\n\nDas Begehren sammelt noch Unterschriften.",
    author: "Lea",
    status: "collecting",
    signatures: 4,
    threshold: 12,
    createdAt: "2026-10-15T16:00:00.000Z",
    endsAt: "2026-11-02T18:00:00.000Z",
  },
];

export const mockLaws: Law[] = [
  {
    id: "grundordnung",
    title: "§ 1 – Grundordnung",
    body: "Der Freistaat ist eine Demokratie-Simulation. Alle Ämter werden durch Wahlen vergeben. Beschlüsse werden veröffentlicht und können von jedem Bürger nachgelesen werden.\n\n**Grundsätze:**\n\n- Eine Person, eine Stimme.\n- Ämter sind zeitlich begrenzt.\n- Entscheidungen werden begründet.",
  },
  {
    id: "wahlrecht",
    title: "§ 2 – Wahlrecht",
    body: "Wahlberechtigt ist, wer die Rolle **Bürger** trägt und vor Beginn der Wahl dem Server beigetreten ist. Die Wahlleitung friert das Wählerverzeichnis beim Öffnen der Wahl ein.\n\nDie Auszählung erfolgt nachvollziehbar. Bei Ratswahlen werden die Sitze nach Sainte-Laguë verteilt.",
  },
  {
    id: "buergerbegehren",
    title: "§ 3 – Bürgerbegehren",
    body: "Jeder Bürger kann ein Bürgerbegehren einreichen. Erreicht es innerhalb der Frist die erforderliche Zahl an Unterschriften, wird automatisch eine Volksabstimmung angesetzt.\n\nDie Schwelle wird beim Anlegen als absolute Zahl festgehalten.",
  },
  {
    id: "geschaeftsordnung",
    title: "§ 4 – Geschäftsordnung des Rats",
    body: "Der Rat tagt öffentlich. Anträge werden vor der Abstimmung begründet. Die Sitzungsleitung achtet auf Redezeit und Ordnung.\n\nBeschlüsse des Rats treten mit ihrer Veröffentlichung im Gesetzblatt in Kraft.",
  },
];

export const statistics = {
  citizens: 24,
};

export function getParty(id?: string): Party | undefined {
  if (!id) return undefined;
  return parties.find((party) => party.id === id);
}

export function getElection(slug: string, now: Date = new Date()): Election | undefined {
  const election = elections.find((entry) => entry.slug === slug);
  return election
    ? { ...election, status: deriveElectionStatus(election, now) }
    : undefined;
}

export function getElections(now: Date = new Date()): Election[] {
  return elections.map((election) => ({
    ...election,
    status: deriveElectionStatus(election, now),
  }));
}

export function getInitiative(
  slug: string,
  now: Date = new Date(),
): Initiative | undefined {
  const initiative = initiatives.find((entry) => entry.slug === slug);
  return initiative
    ? { ...initiative, status: deriveInitiativeStatus(initiative, now) }
    : undefined;
}

export function getInitiatives(now: Date = new Date()): Initiative[] {
  return initiatives.map((initiative) => ({
    ...initiative,
    status: deriveInitiativeStatus(initiative, now),
  }));
}

export { tim, jascha, andre, jakob, lorenz, sprit };
