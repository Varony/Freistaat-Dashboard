import type { Election, Initiative, Party } from "./types";
import { deriveElectionStatus, deriveInitiativeStatus } from "./status";
import { isSupabaseConfigured } from "./supabase/config";
import { getSupabasePublicClient } from "./supabase/public";
import {
  getElection as getMockElection,
  getElections as getMockElections,
  getInitiative as getMockInitiative,
  getInitiatives as getMockInitiatives,
  getParty as getMockParty,
  parties as mockParties,
  statistics,
} from "./mock-data";

type DbParty = {
  id: string;
  name: string;
  short_name: string;
  color: string;
  leader: string;
  members: number;
  program: string;
};

type DbPerson = {
  id: string;
  name: string;
  initials: string;
  party_id: string | null;
  statement: string | null;
};

type DbCandidacy = {
  list_position: number | null;
  sort_order: number;
  people: DbPerson | DbPerson[] | null;
};

type DbPublishedResult = {
  option_id: string;
  votes: number;
};

type DbElection = {
  id: string;
  slug: string;
  title: string;
  office: string;
  description: string;
  type: Election["type"];
  seats: number | null;
  eligible_voters: number;
  turnout: number | null;
  candidacy_ends_at: string;
  voting_ends_at: string;
  parties: string[] | null;
  results_public: boolean;
  candidacies: DbCandidacy[] | null;
  published_results: DbPublishedResult[] | null;
};

type DbInitiative = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  text: string;
  author_name: string;
  status_override: "rejected" | null;
  threshold: number;
  signatures: number;
  created_at: string;
  ends_at: string;
  referendum_slug: string | null;
};

const PARTY_COLUMNS = "id, name, short_name, color, leader, members, program";

const ELECTION_COLUMNS = `
  id, slug, title, office, description, type, seats, eligible_voters, turnout,
  candidacy_ends_at, voting_ends_at, parties, results_public,
  candidacies ( list_position, sort_order, people ( id, name, initials, party_id, statement ) ),
  published_results ( option_id, votes )
`;

function mapParty(row: DbParty): Party {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    color: row.color,
    leader: row.leader,
    members: row.members,
    program: row.program,
  };
}

function mapElection(row: DbElection): Election {
  const candidates = [...(row.candidacies ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap((entry) => {
      const person = Array.isArray(entry.people) ? entry.people[0] : entry.people;
      if (!person) return [];

      return [
        {
          id: person.id,
          name: person.name,
          initials: person.initials,
          partyId: person.party_id ?? undefined,
          statement: person.statement ?? undefined,
          listPosition: entry.list_position ?? undefined,
        },
      ];
    });

  const result = row.results_public
    ? (row.published_results ?? []).map((entry) => ({
        candidateId: entry.option_id,
        votes: entry.votes,
      }))
    : undefined;

  const status = deriveElectionStatus({
    type: row.type,
    candidacyEndsAt: row.candidacy_ends_at,
    votingEndsAt: row.voting_ends_at,
    result,
    resultsPublic: row.results_public,
  });

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    office: row.office,
    description: row.description,
    type: row.type,
    status,
    seats: row.seats ?? undefined,
    eligibleVoters: row.eligible_voters,
    turnout: row.turnout ?? undefined,
    candidacyEndsAt: row.candidacy_ends_at,
    votingEndsAt: row.voting_ends_at,
    candidates,
    parties: row.parties && row.parties.length > 0 ? row.parties : undefined,
    result: result && result.length > 0 ? result : undefined,
  };
}

function mapInitiative(row: DbInitiative): Initiative {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    text: row.text,
    author: row.author_name,
    status: deriveInitiativeStatus({
      signatures: row.signatures,
      threshold: row.threshold,
      endsAt: row.ends_at,
      status: row.status_override ?? undefined,
    }),
    signatures: row.signatures,
    threshold: row.threshold,
    createdAt: row.created_at,
    endsAt: row.ends_at,
    referendumSlug: row.referendum_slug ?? undefined,
  };
}

export async function getParties(): Promise<Party[]> {
  if (!isSupabaseConfigured()) return mockParties;

  try {
    const { data, error } = await getSupabasePublicClient()
      .from("parties")
      .select(PARTY_COLUMNS)
      .order("name", { ascending: true });

    if (error || !data) throw error ?? new Error("Keine Parteien gefunden.");

    return (data as DbParty[]).map(mapParty);
  } catch (error) {
    console.warn("[supabase] Parteien konnten nicht geladen werden:", error);
    return mockParties;
  }
}

export async function getParty(id: string): Promise<Party | undefined> {
  if (!isSupabaseConfigured()) return getMockParty(id);

  try {
    const { data, error } = await getSupabasePublicClient()
      .from("parties")
      .select(PARTY_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapParty(data as DbParty) : undefined;
  } catch (error) {
    console.warn("[supabase] Partei konnte nicht geladen werden:", error);
    return getMockParty(id);
  }
}

export async function getElections(): Promise<Election[]> {
  if (!isSupabaseConfigured()) return getMockElections();

  try {
    const { data, error } = await getSupabasePublicClient()
      .from("elections")
      .select(ELECTION_COLUMNS)
      .order("created_at", { ascending: true });

    if (error || !data) throw error ?? new Error("Keine Wahlen gefunden.");

    return (data as unknown as DbElection[]).map(mapElection);
  } catch (error) {
    console.warn("[supabase] Wahlen konnten nicht geladen werden:", error);
    return getMockElections();
  }
}

export async function getElection(slug: string): Promise<Election | undefined> {
  if (!isSupabaseConfigured()) return getMockElection(slug);

  try {
    const { data, error } = await getSupabasePublicClient()
      .from("elections")
      .select(ELECTION_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return data ? mapElection(data as unknown as DbElection) : undefined;
  } catch (error) {
    console.warn("[supabase] Wahl konnte nicht geladen werden:", error);
    return getMockElection(slug);
  }
}

export async function getInitiatives(): Promise<Initiative[]> {
  if (!isSupabaseConfigured()) return getMockInitiatives();

  try {
    const { data, error } = await getSupabasePublicClient()
      .from("initiative_overview")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) throw error ?? new Error("Keine Bürgerbegehren gefunden.");

    return (data as DbInitiative[]).map(mapInitiative);
  } catch (error) {
    console.warn("[supabase] Bürgerbegehren konnten nicht geladen werden:", error);
    return getMockInitiatives();
  }
}

export async function getInitiative(
  slug: string,
): Promise<Initiative | undefined> {
  if (!isSupabaseConfigured()) return getMockInitiative(slug);

  try {
    const { data, error } = await getSupabasePublicClient()
      .from("initiative_overview")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return data ? mapInitiative(data as DbInitiative) : undefined;
  } catch (error) {
    console.warn("[supabase] Bürgerbegehren konnte nicht geladen werden:", error);
    return getMockInitiative(slug);
  }
}

export async function getCitizenCount(): Promise<number> {
  if (!isSupabaseConfigured()) return statistics.citizens;

  try {
    const { data, error } = await getSupabasePublicClient()
      .from("citizen_count")
      .select("citizens")
      .single();

    if (error || !data) throw error ?? new Error("Keine Bürgerzahl gefunden.");

    return Number(data.citizens);
  } catch (error) {
    console.warn("[supabase] Bürgerzahl konnte nicht geladen werden:", error);
    return statistics.citizens;
  }
}
