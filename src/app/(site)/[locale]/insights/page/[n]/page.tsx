import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getPage } from "@/lib/data";
import { ensureLocale, getSite } from "@/lib/site";
import { pageMeta } from "@/lib/seo";
import { PAGE_SIZE } from "@/lib/posts";
import { InsightsList, localePosts } from "../../List";

/** New items (created in the panel) render on first visit, then stay cached until edited. */
export const dynamicParams = true;

type Props = { params: Promise<{ locale: string; n: string }> };

/** Older pages render on first visit and stay cached until a post is published or edited. */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, n } = await params;
  const [site, page] = await Promise.all([getSite(locale), getPage("insights")]);
  const seo = page?.seo[locale] ?? {};
  const title = `${seo.title || site.t("insights.empty_title")} · ${site.t("insights.page")} ${n}`;
  return pageMeta(site, { path: `/insights/page/${n}`, title, description: seo.description });
}

export default async function InsightsPage({ params }: Props) {
  const { locale, n } = await params;
  await ensureLocale(locale, "/insights");
  const no = Number(n);
  if (!/^\d{1,4}$/.test(n) || no < 1) notFound();
  if (no === 1) permanentRedirect(`/${locale}/insights`);
  const total = (await localePosts(locale)).length;
  if ((no - 1) * PAGE_SIZE >= total) notFound();
  return <InsightsList site={await getSite(locale)} pageNo={no} />;
}
