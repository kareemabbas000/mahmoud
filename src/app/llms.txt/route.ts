import { getEnabledLanguages, getPageIndex, getPage, getPostIndex, getServices, getSettings, getFaqs, getBranches, getHiddenPostIds } from "@/lib/data";
import { abs } from "@/lib/seo";
import { tr } from "@/lib/i18n";
import { cardIn } from "@/lib/posts";
import { indexingAllowed } from "@/lib/indexing";

/**
 * /llms.txt (llmstxt.org): a compact Markdown map of the site for AI assistants and answer engines.
 * Built from live content, served statically and refreshed by the same cache tags as the pages it lists
 * (settings, services, pages:index, posts:index, faqs, branches) — no extra function runs per bot visit.
 */
export const dynamic = "force-static";

const clean = (s: string) => s.replace(/\s+/g, " ").replace(/[[\]]/g, "").trim();

export async function GET() {
  if (!indexingAllowed()) return new Response("# Not indexed\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const [settings, langs, services, pages, allPosts, faqs, branches, hidden] = await Promise.all([getSettings(), getEnabledLanguages(), getServices(), getPageIndex(), getPostIndex(), getFaqs(), getBranches(), getHiddenPostIds()]);
  const posts = allPosts.filter((p) => !hidden.includes(p.id ?? ""));
  const L = langs.map((l) => l.code);
  const en = L.includes("en") ? "en" : L[0]!;
  const t = (v: Record<string, string> | null | undefined, l = en) => clean(tr(v, l));
  const branch = branches.find((b) => b.is_primary) ?? branches[0];
  const pageTitles = await Promise.all(pages.filter((p) => !["privacy", "terms"].includes(p.slug)).map(async (p) => ({ slug: p.slug, page: await getPage(p.slug) })));

  const out: string[] = [];
  out.push(`# ${settings.brand.short_name} — ${t(settings.brand.name)}`, "");
  out.push(`> ${t(settings.seo.default_description)}`, "");
  out.push(
    `${t(settings.brand.name)} (${t(settings.brand.name, "ar") || ""}) is a professional services firm founded in ${settings.brand.founded_year}` +
      (branch ? `, located at ${t(branch.address)}` : "") +
      `. Contact: ${settings.contact.email}${settings.contact.phones[0] ? `, ${settings.contact.phones[0]}` : ""}. The site is bilingual (${langs.map((l) => l.name).join(", ")}); every page exists at /<language>/… .`,
    "",
  );

  out.push("## Services", "");
  for (const s of services) out.push(`- [${t(s.name)}](${abs(`/${en}/services/${s.slug}`)}): ${t(s.summary)}`);
  out.push("");

  out.push("## Key pages", "");
  for (const { slug, page } of pageTitles) if (page) out.push(`- [${t(page.title) || slug || "Home"}](${abs(`/${en}${slug ? `/${slug}` : ""}`)})`);
  out.push("");

  for (const l of L) {
    const list = posts.filter((p) => cardIn(p, l)).slice(0, 40);
    if (!list.length) continue;
    out.push(`## Insights (${langs.find((x) => x.code === l)?.name ?? l})`, "");
    for (const p of list) out.push(`- [${t(p.title, l)}](${abs(`/${l}/insights/${p.slug[l]}`)})${t(p.excerpt, l) ? `: ${t(p.excerpt, l)}` : ""}`);
    out.push("");
  }

  if (faqs.length) {
    out.push("## Frequently asked questions", "", `- [Tax and payroll FAQ](${abs(`/${en}/faq`)}): ${faqs.length} answered questions.`, "");
  }

  out.push("## Optional", "");
  out.push(`- [Sitemap](${abs("/sitemap.xml")})`);
  for (const l of L) out.push(`- [RSS feed (${l})](${abs(`/${l}/insights/rss.xml`)})`);
  out.push("");

  return new Response(out.join("\n"), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
