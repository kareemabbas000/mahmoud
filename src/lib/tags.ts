/**
 * Cache tags — the single source of truth for what invalidates what (docs/GUARDRAILS.md §3).
 *
 * Rule: a save invalidates the narrowest tags that describe what changed. Never add a catch-all
 * tag ("content", "all"): with thousands of posts, one catch-all bust re-renders the whole site.
 * The same strings are used by the database (private.revalidate / publish_due_posts).
 */
export const T = {
  // global: every page reads these (header, footer, metadata) — expected to change rarely
  languages: "languages",
  settings: "settings",
  tracking: "tracking",
  ui: "ui",
  menus: "menus",
  branches: "branches",
  servicesNav: "services:nav",
  // pages
  page: (slug: string) => `page:${slug || "home"}`,
  pagesIndex: "pages:index",
  // collections
  services: "services",
  servicesAlso: "services:also",
  team: "team",
  clients: "clients",
  certificates: "certificates",
  faqs: "faqs",
  gallery: "gallery",
  taxonomy: "taxonomy",
  redirects: "redirects",
  // posts
  postsIndex: "posts:index",
  post: (id: string) => `post:${id}`,
  slug: (slug: string) => `slug:${slug}`.slice(0, 250),
} as const;

/** Tags a database caller may revalidate through /api/revalidate. */
export const isKnownTag = (t: string) =>
  typeof t === "string" && t.length <= 256 && /^(languages|settings|tracking|ui|menus|branches|services(:nav|:also)?|team|clients|certificates|faqs|gallery|taxonomy|redirects|pages:index|posts:index|page:.+|post:[0-9a-f-]{36}|slug:.+)$/.test(t);
