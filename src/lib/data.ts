import "server-only";
import { unstable_cache } from "next/cache";
import * as seed from "@/content/seed";
import { publicClient } from "@/lib/supabase/clients";
import type {
  Branch, Certificate, Client, Faq, GalleryItem, Language, Menu, Page, Post, Service, SiteSettings, TeamMember, TrackingSettings,
} from "@/lib/types";
import type { Dict } from "@/lib/i18n";
import { T } from "@/lib/tags";

/**
 * Public content API — read docs/GUARDRAILS.md before changing anything here.
 *
 *  - Reads published rows through the anon client (RLS decides what is public).
 *  - Every result is cached with NARROW tags (see lib/tags.ts) and never expires on a timer:
 *    the panel (updateTag) and the database (pg_cron → /api/revalidate) invalidate exactly the
 *    tags that changed, so a page is only re-rendered when its own content changed.
 *    A time-based revalidate would re-render every page on a schedule — that is what burns
 *    Vercel CPU, ISR writes and Fast Origin Transfer, and it is forbidden here.
 *  - Errors at runtime are thrown, so Vercel keeps serving the last good page (stale-if-error)
 *    instead of caching seed content. At build time (or with no Supabase) the bundled seed is used.
 */
const SAFETY_NET = 60 * 60 * 24 * 30; // 30 days: only a backstop, real freshness comes from tags

/** Each deployment gets its own cache keys, so a redeploy always starts from fresh data. */
const BUILD = process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "local";
const BUILDING = process.env.NEXT_PHASE === "phase-production-build";

/** Wraps `fn` in the data cache. `fn` returns null when Supabase is not configured → seed. */
function cached<T>(tags: string[], key: string[], fn: () => Promise<T | null>, fallback: () => T): Promise<T> {
  return unstable_cache(
    async () => {
      try {
        const v = await fn();
        return v === null || v === undefined ? fallback() : v;
      } catch (e) {
        if (BUILDING) {
          console.warn(`[data] ${tags[0]} fell back to seed during build:`, (e as Error).message);
          return fallback();
        }
        throw e; // keep serving the last good version
      }
    },
    ["sco", BUILD, ...key],
    { tags, revalidate: SAFETY_NET },
  )();
}

async function rows<R>(table: string, order = "sort", filter?: (q: any) => any, select = "*"): Promise<R[] | null> {
  const sb = publicClient();
  if (!sb) return null;
  let q = sb.from(table).select(select).order(order, { ascending: true });
  if (filter) q = filter(q);
  const { data, error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []) as R[];
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

/* ───────────── Global (used by every page: keep edits to these rare) ───────────── */

export const getLanguages = () => cached<Language[]>([T.languages], ["languages"], () => rows<Language>("languages"), () => seed.languages);

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
  cached<SiteSettings>([T.settings], ["settings"], async () => (publicClient() ? deepMerge(seed.settings, await settingRow("site")) : null), () => seed.settings);

export const getTracking = () =>
  cached<TrackingSettings>([T.tracking], ["tracking"], async () => (publicClient() ? deepMerge(seed.tracking, await settingRow("tracking")) : null), () => seed.tracking);

export const getDictionary = () =>
  cached<Dict>(
    [T.ui],
    ["ui"],
    async () => {
      const r = await rows<{ key: string; values: Record<string, string> }>("ui_strings", "key");
      if (!r) return null;
      const d: Dict = { ...seed.ui };
      for (const x of r) d[x.key] = { ...(d[x.key] ?? {}), ...x.values };
      return d;
    },
    () => seed.ui,
  );

export const getMenus = () => cached<Menu[]>([T.menus], ["menus"], () => rows<Menu>("menus", "location"), () => seed.menus);

export const getBranches = () =>
  cached<Branch[]>([T.branches], ["branches"], () => rows<Branch>("branches", "sort", (q) => q.eq("published", true)), () => seed.branches);

/** Header/footer service links: only the fields navigation shows, under their own tag. */
export type ServiceNav = Pick<Service, "slug" | "sort" | "icon" | "name" | "summary">;
export const getServiceNav = () =>
  cached<ServiceNav[]>(
    [T.servicesNav],
    ["services-nav"],
    () => rows<ServiceNav>("services", "sort", (q) => q.eq("published", true), "slug,sort,icon,name,summary"),
    () => seed.services.map(({ slug, sort, icon, name, summary }) => ({ slug, sort, icon, name, summary })),
  );

/* ───────────── Pages ───────────── */

/** One page by slug ("" = home), tagged per page so editing one page re-renders only that page. */
export const getPage = (slug: string) =>
  cached<{ page: Page | null }>(
    [T.page(slug)],
    ["page", slug],
    async () => {
      const sb = publicClient();
      if (!sb) return null;
      const { data, error } = await sb.from("pages").select("id,slug,kind,published,title,seo,blocks").eq("slug", slug).eq("published", true).maybeSingle();
      if (error) throw new Error(`pages: ${error.message}`);
      return { page: (data as Page | null) ?? null };
    },
    () => ({ page: seed.pages.find((p) => p.slug === slug) ?? null }),
  ).then((r) => r.page);

/** Published page slugs (sitemap, static params). */
export type PageRef = { slug: string; kind: Page["kind"] };
export const getPageIndex = () =>
  cached<PageRef[]>(
    [T.pagesIndex],
    ["pages-index"],
    () => rows<PageRef>("pages", "slug", (q) => q.eq("published", true), "slug,kind"),
    () => seed.pages.map((p) => ({ slug: p.slug, kind: p.kind })),
  );

/* ───────────── Collections ───────────── */

export const getServices = () =>
  cached<Service[]>([T.services], ["services"], () => rows<Service>("services", "sort", (q) => q.eq("published", true)), () => seed.services);
export async function getService(slug: string) {
  return (await getServices()).find((s) => s.slug === slug) ?? null;
}
export const getServicesAlsoOffered = () =>
  cached([T.servicesAlso], ["services-also"], async () => (publicClient() ? ((await settingRow("services_also_offered")) as typeof seed.servicesAlsoOffered | null) ?? seed.servicesAlsoOffered : null), () => seed.servicesAlsoOffered);

export const getTeam = () =>
  cached<TeamMember[]>([T.team], ["team"], () => rows<TeamMember>("team_members", "sort", (q) => q.eq("published", true)), () => seed.team);
export const getClients = () =>
  cached<Client[]>([T.clients], ["clients"], () => rows<Client>("clients", "sort", (q) => q.eq("published", true)), () => seed.clients);
export const getCertificates = () =>
  cached<Certificate[]>([T.certificates], ["certificates"], () => rows<Certificate>("certificates", "sort", (q) => q.eq("published", true)), () => seed.certificates);
export const getFaqs = () =>
  cached<Faq[]>([T.faqs], ["faqs"], () => rows<Faq>("faqs", "sort", (q) => q.eq("published", true)), () => seed.faqs);
export const getGallery = () =>
  cached<GalleryItem[]>([T.gallery], ["gallery"], () => rows<GalleryItem>("gallery_items", "sort", (q) => q.eq("published", true)), () => seed.gallery);

export type Taxonomy = { id: string; slug: string; name: Record<string, string> };
export type Author = { id: string; slug: string; name: Record<string, string>; bio: Record<string, string>; photo: string | null; team_slug: string | null };
export const getCategories = () => cached<Taxonomy[]>([T.taxonomy], ["cat"], () => rows<Taxonomy>("post_categories", "slug"), () => []);
export const getTags = () => cached<Taxonomy[]>([T.taxonomy], ["tag"], () => rows<Taxonomy>("post_tags", "slug"), () => []);
export const getAuthors = () => cached<Author[]>([T.taxonomy], ["author"], () => rows<Author>("authors", "slug"), () => []);

export type Redirect = { source: string; destination: string; status: number };
export const getRedirects = () =>
  cached<Redirect[]>([T.redirects], ["redirects"], () => rows<Redirect>("redirects", "source", (q) => q.eq("enabled", true)), () => []);

/* ───────────── Posts (built for thousands of posts) ─────────────
 * - The index holds only card fields (never bodies), so it stays small and cacheable.
 * - A post page depends only on its own tags (post:<id>, slug:<slug>) plus globals, so publishing or
 *   editing one post never re-renders the other posts.
 */
export type PostCard = Pick<Post, "id" | "slug" | "title" | "excerpt" | "cover" | "cover_alt" | "category_id" | "tag_ids" | "publish_at" | "updated_at"> & { read_minutes: Record<string, number> };
const CARD = "id,slug,title,excerpt,cover,cover_alt,category_id,tag_ids,publish_at,updated_at,read_minutes";

/** Published posts, newest first (scheduled posts appear once pg_cron publishes them). */
export const getPostIndex = () =>
  cached<PostCard[]>(
    [T.postsIndex],
    ["posts-index"],
    async () => {
      const sb = publicClient();
      if (!sb) return [];
      const { data, error } = await sb.from("posts").select(CARD).in("status", ["published", "scheduled"]).lte("publish_at", new Date().toISOString()).order("publish_at", { ascending: false });
      if (error) throw new Error(`posts: ${error.message}`);
      return (data ?? []) as unknown as PostCard[];
    },
    () => [],
  );

/** Resolve a slug (in any language) to a post id. Tagged by the slug itself. */
export const getPostRefBySlug = (slug: string) =>
  cached<{ id: string; slug: Record<string, string>; title: Record<string, string> } | null>(
    [T.slug(slug)],
    ["post-slug", slug],
    async () => {
      const sb = publicClient();
      if (!sb) return null;
      const langs = (await getLanguages()).map((l) => l.code).filter((c) => /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(c));
      const quoted = `"${slug.replace(/["\\]/g, "")}"`;
      const { data, error } = await sb
        .from("posts")
        .select("id,slug,title")
        .or(langs.map((l) => `slug->>${l}.eq.${quoted}`).join(","))
        .in("status", ["published", "scheduled"])
        .lte("publish_at", new Date().toISOString())
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(`posts: ${error.message}`);
      return (data as { id: string; slug: Record<string, string>; title: Record<string, string> } | null) ?? null;
    },
    () => null,
  );

/** The full post (body, SEO, FAQ). */
export type FullPost = Post & { related_ids: string[] | null };
export const getPost = (id: string) =>
  cached<FullPost | null>(
    [T.post(id)],
    ["post", id],
    async () => {
      const sb = publicClient();
      if (!sb) return null;
      const { data, error } = await sb.from("posts").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(`posts: ${error.message}`);
      return (data as FullPost | null) ?? null;
    },
    () => null,
  );

/** Cards for a few posts (related posts). Each card is tagged by its own post. */
export const getPostCards = (ids: string[]) =>
  ids.length
    ? cached<PostCard[]>(
        ids.map(T.post),
        ["post-cards", ...ids],
        async () => {
          const sb = publicClient();
          if (!sb) return [];
          const { data, error } = await sb.from("posts").select(CARD).in("id", ids).in("status", ["published", "scheduled"]).lte("publish_at", new Date().toISOString());
          if (error) throw new Error(`posts: ${error.message}`);
          const got = (data ?? []) as unknown as PostCard[];
          return ids.map((id) => got.find((p) => p.id === id)).filter(Boolean) as PostCard[];
        },
        () => [],
      )
    : Promise.resolve([]);

/** Posts an editor marked "hide from search engines" (any language). Kept out of the sitemap and llms.txt. */
export const getHiddenPostIds = () =>
  cached<string[]>(
    [T.postsIndex],
    ["posts-hidden"],
    async () => {
      const sb = publicClient();
      if (!sb) return [];
      const langs = (await getLanguages()).map((l) => l.code).filter((c) => /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(c));
      const { data, error } = await sb.from("posts").select("id").or(langs.map((l) => `seo->${l}->>noindex.eq.true`).join(","));
      if (error) throw new Error(`posts: ${error.message}`);
      return (data ?? []).map((r) => r.id as string);
    },
    () => [],
  );
