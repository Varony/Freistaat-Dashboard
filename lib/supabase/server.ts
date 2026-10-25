import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "./config";

/**
 * Cookie-Client für Auth und Schreibzugriffe. In Server Components darf
 * Next.js keine Cookies setzen; der Proxy übernimmt die Aktualisierung.
 */
export async function getSupabaseServerClient() {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    throw new Error("Supabase ist nicht konfiguriert.");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Wird in Server Components aufgerufen; der Proxy refresht die Session.
        }
      },
    },
  });
}
