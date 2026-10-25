import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";

let client: SupabaseClient | undefined;

/**
 * Anon-Client ohne Cookies. Er liest nur öffentliche Daten und hält die
 * Seiten damit statisch bzw. ISR-fähig.
 */
export function getSupabasePublicClient(): SupabaseClient {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    throw new Error("Supabase ist nicht konfiguriert.");
  }

  client ??= createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return client;
}
