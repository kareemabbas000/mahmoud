import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { PreviewBridge } from "@/components/admin/pages/PreviewBridge";
import { getStaff } from "@/lib/admin/auth";
import { sessionClient } from "@/lib/supabase/clients";
import { getSite } from "@/lib/site";
import type { Block } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Preview" };

/** Staff-only page preview: renders the autosaved draft (or the live version) inside the real site chrome. */
export default async function PagePreview({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<{ src?: string; builder?: string }> }) {
  const { locale, id } = await params;
  const { src, builder } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  const sb = (await sessionClient())!;
  const { data: page } = await sb.from("pages").select("slug,title,blocks,draft").eq("id", id).maybeSingle();
  if (!page) notFound();
  const site = await getSite(locale);
  const useDraft = src !== "live" && page.draft;
  const blocks = ((useDraft ? (page.draft as { blocks: Block[] }).blocks : page.blocks) ?? []) as Block[];
  const title = ((useDraft ? (page.draft as { title: Record<string, string> }).title : page.title) ?? {}) as Record<string, string>;
  const crumbs = [
    { name: site.t("nav.home"), url: `/${locale}` },
    { name: title[locale] || "…", url: `/${locale}/${page.slug}` },
  ];
  return (
    <>
      <BlockRenderer site={site} blocks={blocks} extra={{ pageHeader: { crumbs } }} anchors />
      <PreviewBridge builder={builder === "1"} draft={Boolean(useDraft)} locale={locale} />
    </>
  );
}
