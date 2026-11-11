import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Runs ONLY for /admin (see matcher). Public pages never pass through here: every proxy run is a
 * billed function invocation, so locale redirects live in next.config redirects (served by the CDN).
 *
 * Refreshes the Supabase session cookie. getClaims() verifies the JWT locally when the project uses
 * asymmetric signing keys (no network round-trip) and only calls the Auth server when it must.
 */
export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return res;
  const sb = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  await sb.auth.getClaims();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  // Static assets and auth/export routes inside /admin don't need a session refresh.
  matcher: ["/admin", "/admin/((?!export/).*)"],
};
