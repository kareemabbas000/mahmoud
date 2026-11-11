import { notFound } from "next/navigation";
import { requirePage } from "@/lib/admin/auth";
import { sessionClient } from "@/lib/supabase/clients";
import { env } from "@/lib/env";
import { PostEditor, type EditablePost } from "@/components/admin/posts/PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  await requirePage("viewer");
  const sb = (await sessionClient())!;
  const [{ data: post }, { data: cats }, { data: tags }, { data: authors }, { data: others }] = await Promise.all([
    sb.from("posts").select("*").eq("id", id).maybeSingle(),
    sb.from("post_categories").select("id,slug,name").order("slug"),
    sb.from("post_tags").select("id,slug,name").order("slug"),
    sb.from("authors").select("id,slug,name").order("slug"),
    sb.from("posts").select("id,seo").neq("id", id),
  ]);
  if (!post) notFound();
  const otherFocus: Record<string, string[]> = {};
  for (const o of others ?? []) for (const [k, v] of Object.entries((o.seo ?? {}) as Record<string, { focus_keyword?: string }>)) if (v?.focus_keyword) (otherFocus[k] ??= []).push(v.focus_keyword);
  let host = "";
  try {
    host = new URL(env.siteUrl).host;
  } catch {}
  return (
    <PostEditor
      initial={post as EditablePost}
      cats={(cats ?? []) as never}
      tags={(tags ?? []) as never}
      authors={(authors ?? []) as never}
      otherFocus={otherFocus}
      siteHost={host}
      siteUrl={env.siteUrl}
    />
  );
}
