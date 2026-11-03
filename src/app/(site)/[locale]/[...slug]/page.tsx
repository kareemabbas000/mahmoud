import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getEnabledLanguages, getPage, getPages } from "@/lib/data";
import { ensureLocale, getSite } from "@/lib/site";
import { pageMeta } from "@/lib/seo";
import { letterFor } from "@/lib/pages";

type Props = { params: Promise<{ locale: string; slug: string[] }> };
const RESERVED = new Set(["", "insights"]);

export async function generateStaticParams() {
  const [pages, langs] = await Promise.all([getPages(), getEnabledLanguages()]);
  return langs.flatMap((l) => pages.filter((p) => !RESERVED.has(p.slug)).map((p) => ({ locale: l.code, slug: p.slug.split("/") })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getPage(slug.join("/"));
  if (!page) return {};
  const site = await getSite(locale);
  const seo = page.seo[locale] ?? {};
  return pageMeta(site, { path: `/${page.slug}`, title: seo.title || site.l(page.title), description: seo.description, image: seo.og_image });
}

export default async function BlockPage({ params }: Props) {
  const { locale, slug } = await params;
  const path = slug.join("/");
  await ensureLocale(locale, `/${path}`);
  const page = RESERVED.has(path) ? null : await getPage(path);
  if (!page) notFound();
  const site = await getSite(locale);
  const crumbs = [
    { name: site.t("nav.home"), url: `/${locale}` },
    { name: site.l(page.title), url: `/${locale}/${path}` },
  ];
  return <BlockRenderer site={site} blocks={page.blocks} letter={letterFor(path)} extra={{ pageHeader: { crumbs } }} />;
}
