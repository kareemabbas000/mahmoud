import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories } from "@/lib/data";
import { ensureLocale, getSite } from "@/lib/site";
import { pageMeta } from "@/lib/seo";
import { InsightsList, localePosts } from "../../List";

type Props = { params: Promise<{ locale: string; cat: string }> };

/** Category archives render on first visit and stay cached until a post or category changes. */
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

async function load(cat: string) {
  return (await getCategories()).find((c) => c.slug === cat) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, cat } = await params;
  const c = await load(cat);
  if (!c) return {};
  const site = await getSite(locale);
  const n = (await localePosts(locale)).filter((p) => p.category_id === c.id).length;
  return pageMeta(site, {
    path: `/insights/category/${c.slug}`,
    title: `${site.l(c.name)} · ${site.t("insights.back")}`,
    description: `${site.t("insights.in_category")} ${site.l(c.name)} — ${site.l(site.settings.brand.name)}`,
    noindex: n === 0, // empty archives are thin content
  });
}

export default async function CategoryPage({ params }: Props) {
  const { locale, cat } = await params;
  await ensureLocale(locale, "/insights");
  const c = await load(cat);
  if (!c) notFound();
  return <InsightsList site={await getSite(locale)} pageNo={1} category={c} />;
}
