import "server-only";
import { unstable_cache } from "next/cache";
import * as seed from "@/content/seed";
import { publicClient } from "@/lib/supabase/clients";
import type {
  Branch, Certificate, Client, Faq, GalleryItem, Language, Menu, Page, Post, Service, SiteSettings, TeamMember, TrackingSettings,
} from "@/lib/types";
import type { Dict } from "@/lib/i18n";

/**
 * Public content API. Every function:
 *  - reads published rows through the anon client (RLS),
 *  - is cached with a tag so Publish in the panel revalidates within seconds,
 *  - falls back to the bundled seed if Supabase is not configured, errors, or returns nothing.
 */
const REVALIDATE = 3600;

/** Each deployment gets its own cache keys, so content edited straight in the database shows after a redeploy. */
const BUILD = process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "local";

function cached<T>(tag: string, fn: () => Promise<T | null>, fallback: () => T, keyParts: string[] = [], revalidate = REVALIDATE) {
  return unstable_cache(
    async () => {
      try {
        const v = await fn();
        if (v === null || v === undefined) return fallback();
        return v;
      } catch (e) {
        console.warn(`[data] ${tag} fell back to seed:`, (e as Error).message);
        return fallback();
      }
    },
    ["sco", BUILD, tag, ...keyParts],
    { tags: ["content", tag], revalidate },
  )();
}

async function rows<T>(table: string, order = "sort", filter?: (q: any) => any): Promise<T[] | null> {
  const sb = publicClient();
  if (!sb) return null;
  let q = sb.from(table).select("*").order(order, { ascending: true });
  if (filter) q = filter(q);
  const { data, error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []) as T[];
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
/** Deep-merge DB settings over seed defaults so newly added fields always exist. */
export function deepMerge<T>(base: T, over: unknown): T {
  if (!isObj(base) || !isObj(over)) return (over === undefined || over === null ? base : (over as T));
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = k in out ? deepMerge(out[k], v) : v;
  return out as T;
}

export const getLanguages = () =>
  cached<Language[]>("languages", () => rows<Language>("languages"), () => seed.languages);

export async function getEnabledLanguages() {
  const all = await getLanguages();
  const on = all.filter((l) => l.enabled);
  return on.length ? on : seed.languages;
}
export async function getDefaultLocale() {
  const on = await getEnabledLanguages();
  return (on.find((l) => l.is_default) ?? on[0]!).code;
}

async function settingRow(key: string) {
  const sb = publicClient();
  if (!sb) return null;
  const { data, error } = await sb.from("settings").select("value").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value ?? null;
}

export const getSettings = () =>
  cached<SiteSettings>("settings", async () => deepMerge(seed.settings, await settingRow("site")), () => seed.settings);

export const getTracking = () =>
  cached<TrackingSettings>("tracking", async () => deepMerge(seed.tracking, await settingRow("tracking")), () => seed.tracking);

export const getDictionary = () =>
  cached<Dict>(
    "ui",
    async () => {
      const r = await rows<{ key: string; values: Record<string, string> }>("ui_strings", "key");
      if (!r) return null;
      const d: Dict = { ...seed.ui };
      for (const x of r) d[x.key] = { ...(d[x.key] ?? {}), ...x.values };
      return d;
    },
    () => seed.ui,
  );

export const getMenus = () => cached<Menu[]>("menus", () => rows<Menu>("menus", "location"), () => seed.menus);

export const getPages = () =>
  cached<Page[]>("pages", () => rows<Page>("pages", "slug", (q) => q.eq("published", true)), () => seed.pages);
export async function getPage(slug: string) {
  return (await getPages()).find((p) => p.slug === slug) ?? null;
}

export const getServices = () =>
  cached<Service[]>("services", () => rows<Service>("services", "sort", (q) => q.eq("published", true)), () => seed.services);
export async function getService(slug: string) {
  return (await getServices()).find((s) => s.slug === slug) ?? null;
}
export const getServicesAlsoOffered = () =>
  cached("services_also", async () => (await settingRow("services_also_offered")) as typeof seed.servicesAlsoOffered | null, () => seed.servicesAlsoOffered);

export const getTeam = () =>
  cached<TeamMember[]>("team", () => rows<TeamMember>("team_members", "sort", (q) => q.eq("published", true)), () => seed.team);
export const getClients = () =>
  cached<Client[]>("clients", () => rows<Client>("clients", "sort", (q) => q.eq("published", true)), () => seed.clients);
export const getCertificates = () =>
  cached<Certificate[]>("certificates", () => rows<Certificate>("certificates", "sort", (q) => q.eq("published", true)), () => seed.certificates);
export const getBranches = () =>
  cached<Branch[]>("branches", () => rows<Branch>("branches", "sort", (q) => q.eq("published", true)), () => seed.branches);
export const getFaqs = () =>
  cached<Faq[]>("faqs", () => rows<Faq>("faqs", "sort", (q) => q.eq("published", true)), () => seed.faqs);
export const getGallery = () =>
  cached<GalleryItem[]>("gallery", () => rows<GalleryItem>("gallery_items", "sort", (q) => q.eq("published", true)), () => seed.gallery);

export type Taxonomy = { id: string; slug: string; name: Record<string, string> };
export type Author = { id: string; slug: string; name: Record<string, string>; bio: Record<string, string>; photo: string | null; team_slug: string | null };

/** Published posts (scheduled posts appear once publish_at has passed). */
export const getPosts = () =>
  cached<Post[]>(
    "posts",
    async () => {
      const sb = publicClient();
      if (!sb) return [];
      const { data, error } = await sb
        .from("posts")
        .select("*")
        .in("status", ["published", "scheduled"])
        .lte("publish_at", new Date().toISOString())
        .order("publish_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Post[];
    },
    () => [],
    [],
    300, // scheduled posts go live within five minutes of their publish time
  );

export const getCategories = () => cached<Taxonomy[]>("taxonomy", () => rows<Taxonomy>("post_categories", "slug"), () => [], ["cat"]);
export const getTags = () => cached<Taxonomy[]>("taxonomy", () => rows<Taxonomy>("post_tags", "slug"), () => [], ["tag"]);
export const getAuthors = () => cached<Author[]>("taxonomy", () => rows<Author>("authors", "slug"), () => [], ["author"]);

export type Redirect = { source: string; destination: string; status: number };
export const getRedirects = () =>
  cached<Redirect[]>("redirects", () => rows<Redirect>("redirects", "source", (q) => q.eq("enabled", true)), () => []);
