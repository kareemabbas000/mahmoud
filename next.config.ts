import type { NextConfig } from "next";
import legacy from "./content/redirects.json" with { type: "json" };

type Rule = { source: string; destination: string; permanent: boolean };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const supabaseHost = (() => {
  try {
    return new URL(SUPABASE_URL).hostname;
  } catch {
    return "";
  }
})();

/** Read routing data once at build time (public rows only). Falls back to safe defaults. */
async function buildData<T>(path: string, fallback: T): Promise<T> {
  if (!SUPABASE_URL || !ANON) return fallback;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return fallback;
    const data = (await r.json()) as T;
    return Array.isArray(data) && data.length === 0 ? fallback : data;
  } catch {
    return fallback;
  }
}

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()" },
  // Script sources stay open for consented marketing tags (GTM can load arbitrary vendors);
  // framing, plugins and base-URI hijacking are locked down.
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  images: {
    // Hobby includes 5,000 transformations a month (docs/GUARDRAILS.md §4). Uploads are resized to WebP sizes in
    // the browser and rendered by <SmartImage> straight from Supabase, so they never use the optimiser. Only bundled
    // /legacy assets are transformed: one format, a short list of widths and one quality keep the total bounded.
    formats: ["image/webp"],
    deviceSizes: [640, 960, 1280, 1920],
    imageSizes: [96, 192, 384],
    qualities: [75, 92], // 92 only for the founder portrait
    remotePatterns: supabaseHost ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : [],
    minimumCacheTTL: 60 * 60 * 24 * 31,
  },
  experimental: {
    optimizePackageImports: ["@dnd-kit/core", "@dnd-kit/sortable"],
    serverActions: { bodySizeLimit: "6mb" },
  },
  async redirects() {
    const [langs, pages, panel] = await Promise.all([
      buildData<{ code: string; is_default: boolean }[]>("languages?select=code,is_default&enabled=eq.true", [{ code: "ar", is_default: true }]),
      buildData<{ slug: string }[]>("pages?select=slug&published=eq.true", []),
      buildData<{ source: string; destination: string; status: number }[]>("redirects?select=source,destination,status&enabled=eq.true", []),
    ]);
    const def = (langs.find((l) => l.is_default) ?? langs[0] ?? { code: "ar" }).code;
    const codes = new Set(langs.map((l) => l.code));
    // Top-level sections that may be typed without a language (e.g. /contact → /ar/contact).
    const sections = [...new Set(["services", "team", "insights", ...pages.map((p) => p.slug.split("/")[0]!).filter(Boolean)])].filter((s) => /^[a-z0-9-]+$/.test(s) && !codes.has(s));
    const safe = (s: string) => typeof s === "string" && s.startsWith("/") && !s.startsWith("//") && s.length < 500;
    return [
      // 1. Legacy sco-eg.com (WordPress) URLs → new URLs, HTTP 301 to carry rankings over.
      ...(legacy.rules as Rule[]).map((r) => ({ source: r.source, destination: r.destination, statusCode: 301 as const })),
      // 2. Redirects managed in the panel (applied at build; saving them triggers a redeploy).
      ...panel.filter((r) => safe(r.source) && (safe(r.destination) || /^https:\/\//.test(r.destination))).map((r) => ({ source: r.source, destination: r.destination, statusCode: (r.status === 302 ? 302 : r.status === 307 ? 307 : 301) as 301 | 302 | 307 })),
      // 3. Language-less entry points → default language. Served by the CDN, no function runs.
      { source: "/", destination: `/${def}`, permanent: false },
      ...(sections.length ? [{ source: `/:section(${sections.join("|")})/:rest*`, destination: `/${def}/:section/:rest*`, permanent: false }] : []),
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
      { source: "/legacy/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/og/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
    ];
  },
};

export default nextConfig;
