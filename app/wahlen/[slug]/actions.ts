"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type VoteState = {
  status: "idle" | "success" | "error";
  message?: string;
  optionId?: string;
};

function voteErrorMessage(error: { message: string; code?: string }): string {
  if (error.code === "23505") {
    return "Du hast bei dieser Wahl bereits abgestimmt.";
  }
  if (error.message.includes("voting_closed")) {
    return "Die Abstimmung ist bereits beendet.";
  }
  if (error.message.includes("candidacy_phase")) {
    return "Die Bewerbungsphase läuft noch.";
  }
  if (error.message.includes("invalid_option")) {
    return "Diese Option ist für die Wahl nicht gültig.";
  }
  return "Die Stimme konnte nicht gespeichert werden.";
}

export async function castVote(
  _previous: VoteState,
  formData: FormData,
): Promise<VoteState> {
  const electionSlug = String(formData.get("election") ?? "");
  const optionId = String(formData.get("option") ?? "");

  if (!electionSlug || !optionId) {
    return { status: "error", message: "Bitte wähle eine Option." };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Die Abstimmung ist noch nicht an Supabase angeschlossen.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Bitte melde dich mit Discord an." };
  }

  const { data: election, error: electionError } = await supabase
    .from("elections")
    .select("id")
    .eq("slug", electionSlug)
    .maybeSingle();

  if (electionError || !election) {
    return { status: "error", message: "Die Wahl wurde nicht gefunden." };
  }

  const { error } = await supabase.from("votes").insert({
    election_id: election.id,
    user_id: user.id,
    option_id: optionId,
  });

  if (error) {
    return { status: "error", message: voteErrorMessage(error) };
  }

  revalidatePath(`/wahlen/${electionSlug}`);
  return {
    status: "success",
    message: "Deine Stimme wurde gespeichert.",
    optionId,
  };
}
