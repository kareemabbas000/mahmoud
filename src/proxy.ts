import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * 1. Unprefixed paths → the default language (Arabic), 307. Visitors switch language explicitly.
 *    Legacy WordPress URLs never reach here: next.config redirects (301) run first.
 * 2. /{locale}/… → pass through, exposing the locale to not-found via a request header.
 * 3. /admin → refresh the Supabase session cookie.
 */
const LOCALE_RE = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;
type Lang = { code: string; is_default: boolean };
let langCache: { at: number; list: Lang[] } | null = null;
const FALLBACK: Lang[] = [
  { code: "ar", is_default: true },
  { code: "en", is_default: false },
];

async function enabledLanguages(): Promise<Lang[]> {
  if (langCache && Date.now() - langCache.at < 60_000) return langCache.list;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return FALLBACK;
  try {
    const r = await fetch(`${url}/rest/v1/languages?select=code,is_default&enabled=eq.true&order=sort`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(800),
    });
    const list = (await r.json()) as Lang[];
    if (Array.isArray(list) && list.length) {
      langCache = { at: Date.now(), list };
      return list;
    }
  } catch {
    /* fall through */
  }
  return FALLBACK;
}

async function adminSession(req: NextRequest) {
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
  await sb.auth.getUser();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return adminSession(req);

  const seg = pathname.split("/")[1] ?? "";
  if (seg && LOCALE_RE.test(seg)) {
    const headers = new Headers(req.headers);
    headers.set("x-sco-locale", seg);
    return NextResponse.next({ request: { headers } });
  }
  // Product decision: the site always lands in the default language (Arabic); English is one click away.
  const langs = await enabledLanguages();
  const loc = (langs.find((l) => l.is_default) ?? langs[0] ?? FALLBACK[0]!).code;
  const target = new URL(`/${loc}${pathname === "/" ? "" : pathname}${search}`, req.url);
  const res = NextResponse.redirect(target, 307);
  return res;
}

export const config = {
  matcher: ["/((?!_next/|api/|legacy/|favicon\\.ico|icon\\.svg|apple-icon\\.png|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|.*\\.[a-zA-Z0-9]{2,5}$).*)"],
};
