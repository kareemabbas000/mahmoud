import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getPage } from "@/lib/data";
import { ensureLocale, getSite } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const site = await getSite(locale);
  const page = await getPage("");
  const seo = page?.seo[locale] ?? {};
  return { ...pageMeta(site, { path: "", description: seo.description, image: seo.og_image }), title: { absolute: seo.title || site.l(site.settings.seo.default_title) } };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  await ensureLocale(locale, "");
  const [site, page] = await Promise.all([getSite(locale), getPage("")]);
  if (!page) notFound();
  return <BlockRenderer site={site} blocks={page.blocks} letter="A" />;
}
