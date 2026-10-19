export type Party = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  leader: string;
  members: number;
  program: string;
};

export type Candidate = {
  id: string;
  name: string;
  initials: string;
  partyId?: string;
  statement?: string;
  listPosition?: number;
};

export type ElectionType = "person" | "rat" | "referendum";
export type ElectionStatus = "candidacy" | "open" | "closed" | "published";

export type ElectionResult = {
  candidateId: string;
  votes: number;
};

export type Election = {
  id: string;
  slug: string;
  title: string;
  office: string;
  description: string;
  type: ElectionType;
  status: ElectionStatus;
  seats?: number;
  eligibleVoters: number;
  turnout?: number;
  candidacyEndsAt: string;
  votingEndsAt: string;
  candidates: Candidate[];
  parties?: string[];
  result?: ElectionResult[];
};

export type InitiativeStatus = "collecting" | "qualified" | "expired" | "rejected";

export type Initiative = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  text: string;
  author: string;
  status: InitiativeStatus;
  signatures: number;
  threshold: number;
  createdAt: string;
  endsAt: string;
  referendumSlug?: string;
};

export type Law = {
  id: string;
  title: string;
  body: string;
  passedAt?: string;
};
