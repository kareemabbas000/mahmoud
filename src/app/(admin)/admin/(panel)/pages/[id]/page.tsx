import { notFound } from "next/navigation";
import { requirePage } from "@/lib/admin/auth";
import { sessionClient } from "@/lib/supabase/clients";
import { PageBuilder, type BuilderPage } from "@/components/admin/pages/PageBuilder";
import type { PageDraft } from "@/app/actions/pages";

export const dynamic = "force-dynamic";

export default async function BuildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  await requirePage("viewer");
  const sb = (await sessionClient())!;
  const [{ data: p }, { data: versions }] = await Promise.all([
    sb.from("pages").select("id,slug,kind,published,title,seo,blocks,draft,draft_updated_at").eq("id", id).maybeSingle(),
    sb.from("page_versions").select("id,created_at,note").eq("page_id", id).order("created_at", { ascending: false }).limit(30),
  ]);
  if (!p) notFound();
  const page: BuilderPage = {
    id: p.id,
    slug: p.slug,
    kind: p.kind,
    published: p.published,
    live: { title: p.title ?? {}, seo: p.seo ?? {}, blocks: p.blocks ?? [] } as PageDraft,
    draft: (p.draft as PageDraft | null) ?? null,
    draft_updated_at: p.draft_updated_at,
  };
  return <PageBuilder page={page} versions={versions ?? []} />;
}
