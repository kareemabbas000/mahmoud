import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getCategories } from "@/lib/data";
import { ensureLocale, getSite } from "@/lib/site";
import { pageMeta } from "@/lib/seo";
import { PAGE_SIZE } from "@/lib/posts";
import { InsightsList, localePosts } from "../../../../List";

type Props = { params: Promise<{ locale: string; cat: string; n: string }> };

export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, cat, n } = await params;
  const c = (await getCategories()).find((x) => x.slug === cat);
  if (!c) return {};
  const site = await getSite(locale);
  return pageMeta(site, { path: `/insights/category/${c.slug}/page/${n}`, title: `${site.l(c.name)} · ${site.t("insights.page")} ${n}` });
}

export default async function CategoryPageN({ params }: Props) {
  const { locale, cat, n } = await params;
  await ensureLocale(locale, "/insights");
  const c = (await getCategories()).find((x) => x.slug === cat);
  const no = Number(n);
  if (!c || !/^\d{1,4}$/.test(n) || no < 1) notFound();
  if (no === 1) permanentRedirect(`/${locale}/insights/category/${c.slug}`);
  const total = (await localePosts(locale)).filter((p) => p.category_id === c.id).length;
  if ((no - 1) * PAGE_SIZE >= total) notFound();
  return <InsightsList site={await getSite(locale)} pageNo={no} category={c} />;
}
