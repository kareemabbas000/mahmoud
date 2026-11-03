import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, hasSupabase, serverEnv } from "@/lib/env";

/** Anonymous, cookie-less client for cached public reads (RLS: published rows only). */
export function publicClient(): SupabaseClient | null {
  if (!hasSupabase()) return null;
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

/** Service-role client. Server only; bypasses RLS — use for validated public form writes and admin auth ops. */
export function serviceClient(): SupabaseClient | null {
  const key = serverEnv().serviceRoleKey;
  if (!env.supabaseUrl || !key) return null;
  return createClient(env.supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Per-request client bound to the signed-in admin's session (RLS enforces roles). */
export async function sessionClient(): Promise<SupabaseClient | null> {
  if (!hasSupabase()) return null;
  const store = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* called from a Server Component: proxy refreshes the session instead */
        }
      },
    },
  });
}
