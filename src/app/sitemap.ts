import type { MetadataRoute } from "next";
import { getEnabledLanguages, getPageIndex, getPostIndex, getServices, getTeam } from "@/lib/data";
import { abs } from "@/lib/seo";
import { cardIn } from "@/lib/posts";


/** Localized sitemap: one entry per URL per enabled language, each with hreflang alternates (+ x-default). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [langs, pages, services, team, posts] = await Promise.all([getEnabledLanguages(), getPageIndex(), getServices(), getTeam(), getPostIndex()]);
  const def = (langs.find((l) => l.is_default) ?? langs[0])!.code;
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];
  const add = (paths: Record<string, string>, priority: number, lastModified: Date = now) => {
    const languages: Record<string, string> = Object.fromEntries(Object.entries(paths).map(([l, p]) => [l, abs(`/${l}${p}`)]));
    if (paths[def] !== undefined) languages["x-default"] = abs(`/${def}${paths[def]}`);
    for (const [l, p] of Object.entries(paths)) entries.push({ url: abs(`/${l}${p}`), lastModified, priority, changeFrequency: "monthly", alternates: { languages } });
  };
  const all = (p: string) => Object.fromEntries(langs.map((l) => [l.code, p]));
  for (const pg of pages) {
    if (["privacy", "terms"].includes(pg.slug)) continue;
    add(all(pg.slug ? `/${pg.slug}` : ""), pg.slug ? 0.7 : 1);
  }
  for (const s of services) add(all(`/services/${s.slug}`), 0.9);
  for (const m of team.filter((x) => x.has_profile)) add(all(`/team/${m.slug}`), 0.5);
  for (const p of posts) {
    const paths = Object.fromEntries(langs.filter((l) => cardIn(p, l.code)).map((l) => [l.code, `/insights/${p.slug[l.code]}`]));
    if (Object.keys(paths).length) add(paths, 0.6, new Date(p.updated_at ?? p.publish_at ?? now));
  }
  return entries;
}
