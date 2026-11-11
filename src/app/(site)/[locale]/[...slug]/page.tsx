import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getLanguages, getPage, getPageIndex } from "@/lib/data";
import { ensureLocale, getSite } from "@/lib/site";
import { pageMeta } from "@/lib/seo";
import { letterFor } from "@/lib/pages";

/** New items (created in the panel) render on first visit, then stay cached until edited. */
export const dynamicParams = true;

type Props = { params: Promise<{ locale: string; slug: string[] }> };
const RESERVED = new Set(["", "insights", "sco-preview"]);

export async function generateStaticParams() {
  const [pages, langs] = await Promise.all([getPageIndex(), getLanguages()]);
  return langs.flatMap((l) => pages.filter((p) => !RESERVED.has(p.slug)).map((p) => ({ locale: l.code, slug: p.slug.split("/") })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getPage(slug.join("/"));
  if (!page) return {};
  const site = await getSite(locale);
  const seo = (page.seo[locale] ?? {}) as { title?: string; description?: string; og_image?: string; noindex?: boolean };
  return pageMeta(site, { path: `/${page.slug}`, title: seo.title || site.l(page.title), description: seo.description, image: seo.og_image, noindex: seo.noindex });
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
