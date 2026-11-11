import type { Metadata } from "next";
import { getPage } from "@/lib/data";
import { ensureLocale, getSite } from "@/lib/site";
import { pageMeta } from "@/lib/seo";
import { InsightsList } from "./List";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const [site, page] = await Promise.all([getSite(locale), getPage("insights")]);
  const seo = page?.seo[locale] ?? {};
  return pageMeta(site, { path: "/insights", title: seo.title || site.t("insights.empty_title"), description: seo.description });
}

export default async function Insights({ params }: Props) {
  const { locale } = await params;
  await ensureLocale(locale, "/insights");
  return <InsightsList site={await getSite(locale)} pageNo={1} />;
}
