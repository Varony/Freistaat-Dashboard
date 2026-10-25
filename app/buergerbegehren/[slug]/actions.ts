"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type InitiativeState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function signatureErrorMessage(error: { message: string; code?: string }): string {
  if (error.code === "23505") {
    return "Du hast dieses Begehren bereits unterschrieben.";
  }
  if (error.message.includes("threshold_reached")) {
    return "Die Schwelle ist bereits erreicht.";
  }
  if (error.message.includes("initiative_expired")) {
    return "Die Frist für dieses Begehren ist abgelaufen.";
  }
  if (error.message.includes("initiative_rejected")) {
    return "Dieses Begehren wurde abgelehnt.";
  }
  return "Die Unterschrift konnte nicht gespeichert werden.";
}

export async function signInitiative(
  _previous: InitiativeState,
  formData: FormData,
): Promise<InitiativeState> {
  const slug = String(formData.get("initiative") ?? "");

  if (!slug) {
    return { status: "error", message: "Das Bürgerbegehren wurde nicht gefunden." };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Unterschriften sind noch nicht an Supabase angeschlossen.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Bitte melde dich mit Discord an." };
  }

  const { data: initiative, error: initiativeError } = await supabase
    .from("initiatives")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (initiativeError || !initiative) {
    return { status: "error", message: "Das Bürgerbegehren wurde nicht gefunden." };
  }

  const { error } = await supabase.from("initiative_signatures").insert({
    initiative_id: initiative.id,
    user_id: user.id,
  });

  if (error) {
    return { status: "error", message: signatureErrorMessage(error) };
  }

  revalidatePath(`/buergerbegehren/${slug}`);
  return { status: "success", message: "Deine Unterschrift wurde gespeichert." };
}
