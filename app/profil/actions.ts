"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/site-config";

export async function signInWithDiscord() {
  if (!isSupabaseConfigured()) {
    redirect("/profil?error=config");
  }

  const supabase = await getSupabaseServerClient();
  const origin = (await headers()).get("origin") ?? siteConfig.url;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: `${origin}/auth/callback?next=/profil`,
    },
  });

  if (error || !data.url) {
    redirect("/profil?error=discord");
  }

  redirect(data.url);
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}
