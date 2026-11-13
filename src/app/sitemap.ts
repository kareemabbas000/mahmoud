import type { MetadataRoute } from "next";
import { getCategories, getEnabledLanguages, getHiddenPostIds, getPageIndex, getPostIndex, getServices, getTeam } from "@/lib/data";
import { abs } from "@/lib/seo";
import { cardIn } from "@/lib/posts";
import { indexingAllowed } from "@/lib/indexing";

/**
 * Localized sitemap (docs/SEO.md):
 *  - one entry per URL per enabled language, each with hreflang alternates + x-default;
 *  - lastModified only where it's real (posts) — a date that always says "now" teaches Google to ignore it;
 *  - post cover images listed for Google Images;
 *  - posts marked noindex, empty categories and legal pages are left out.
 * Static and refreshed by tags (pages:index, services, team, posts:index, taxonomy): no timer.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!indexingAllowed()) return [];
  const [langs, pages, services, team, posts, hidden, cats] = await Promise.all([getEnabledLanguages(), getPageIndex(), getServices(), getTeam(), getPostIndex(), getHiddenPostIds(), getCategories()]);
  const def = (langs.find((l) => l.is_default) ?? langs[0])!.code;
  const entries: MetadataRoute.Sitemap = [];
  const add = (paths: Record<string, string>, priority: number, opts: { lastModified?: Date; images?: string[]; freq?: "weekly" | "monthly" | "yearly" } = {}) => {
    const languages: Record<string, string> = Object.fromEntries(Object.entries(paths).map(([l, p]) => [l, abs(`/${l}${p}`)]));
    if (paths[def] !== undefined) languages["x-default"] = abs(`/${def}${paths[def]}`);
    for (const [l, p] of Object.entries(paths))
      entries.push({
        url: abs(`/${l}${p}`),
        ...(opts.lastModified ? { lastModified: opts.lastModified } : {}),
        priority,
        changeFrequency: opts.freq ?? "monthly",
        alternates: { languages },
        ...(opts.images?.length ? { images: opts.images.map(abs) } : {}),
      });
  };
  const all = (p: string) => Object.fromEntries(langs.map((l) => [l.code, p]));
  const live = posts.filter((p) => !hidden.includes(p.id ?? ""));
  const newest = live[0] ? new Date(live[0].updated_at ?? live[0].publish_at ?? Date.now()) : undefined;

  for (const pg of pages) {
    if (["privacy", "terms"].includes(pg.slug)) continue;
    add(all(pg.slug ? `/${pg.slug}` : ""), pg.slug ? 0.7 : 1, pg.slug === "insights" ? { lastModified: newest, freq: "weekly" } : {});
  }
  for (const s of services) add(all(`/services/${s.slug}`), 0.9, { images: s.image ? [s.image] : [] });
  for (const m of team.filter((x) => x.has_profile)) add(all(`/team/${m.slug}`), 0.5, { images: m.photo ? [m.photo] : [], freq: "yearly" });
  for (const c of cats) {
    const inCat = live.filter((p) => p.category_id === c.id);
    if (!inCat.length) continue;
    const paths = Object.fromEntries(langs.filter((l) => inCat.some((p) => cardIn(p, l.code))).map((l) => [l.code, `/insights/category/${c.slug}`]));
    add(paths, 0.5, { lastModified: new Date(inCat[0]!.updated_at ?? inCat[0]!.publish_at ?? Date.now()), freq: "weekly" });
  }
  for (const p of live) {
    const paths = Object.fromEntries(langs.filter((l) => cardIn(p, l.code)).map((l) => [l.code, `/insights/${p.slug[l.code]}`]));
    if (Object.keys(paths).length) add(paths, 0.8, { lastModified: new Date(p.updated_at ?? p.publish_at ?? Date.now()), images: p.cover ? [p.cover] : [] });
  }
  return entries;
}
