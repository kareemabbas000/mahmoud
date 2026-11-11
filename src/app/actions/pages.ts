"use server";

import { updateTag } from "next/cache";
import { ForbiddenError, requireAction } from "@/lib/admin/auth";
import type { Role } from "@/lib/types";
import type { Result } from "./admin";

async function run<T>(min: Role, fn: (ctx: Awaited<ReturnType<typeof requireAction>>) => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await fn(await requireAction(min));
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: "forbidden" };
    console.error("[pages]", e);
    return { ok: false, error: "generic", detail: (e as Error).message };
  }
}
const bust = () => {
  updateTag("pages");
  updateTag("content");
};

type L = Record<string, string>;
export type BlockIn = { id: string; type: string; props: Record<string, unknown>; hidden?: boolean };
export type PageDraft = { title: L; seo: Record<string, { title?: string; description?: string; og_image?: string; noindex?: boolean }>; blocks: BlockIn[] };

const SLUG = /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/;
const RESERVED = new Set(["insights", "admin", "api", "services", "team", "newsletter", "sco-preview", "sitemap.xml", "robots.txt"]);

function cleanDraft(d: PageDraft): PageDraft {
  const loc = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;
  const pick = <T,>(o: Record<string, T> | undefined) => Object.fromEntries(Object.entries(o ?? {}).filter(([k]) => loc.test(k)));
  return {
    title: pick(d.title) as L,
    seo: pick(d.seo) as PageDraft["seo"],
    blocks: (d.blocks ?? [])
      .filter((b) => b && typeof b.type === "string" && /^[a-zA-Z]+$/.test(b.type))
      .map((b) => ({ id: String(b.id || `${b.type}-${Math.random().toString(36).slice(2, 8)}`), type: b.type, props: b.props ?? {}, ...(b.hidden ? { hidden: true } : {}) })),
  };
}

export async function createPage(input: { slug: string; title: L; blocks?: BlockIn[] }): Promise<Result<{ id: string }>> {
  return run("editor", async ({ sb }) => {
    const slug = input.slug.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
    if (!SLUG.test(slug)) return { ok: false, error: "validation", detail: "slug: lowercase latin letters, numbers and hyphens (e.g. tax-guide)" };
    if (RESERVED.has(slug.split("/")[0]!)) return { ok: false, error: "validation", detail: `slug: “${slug}” is reserved` };
    const d = cleanDraft({ title: input.title, seo: {}, blocks: input.blocks ?? [] });
    const { data, error } = await sb.from("pages").insert({ slug, kind: "custom", published: false, title: d.title, seo: {}, blocks: [], draft: d, draft_updated_at: new Date().toISOString() }).select("id");
    if (error) return { ok: false, error: "validation", detail: error.code === "23505" ? `slug “${slug}” already exists` : error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    return { ok: true, data: { id: data[0]!.id as string } };
  });
}

/** Autosave target: stored beside the live page, invisible to visitors until published. */
export async function saveDraft(id: string, draft: PageDraft): Promise<Result<{ at: string }>> {
  return run("editor", async ({ sb }) => {
    const at = new Date().toISOString();
    const { data, error } = await sb.from("pages").update({ draft: cleanDraft(draft), draft_updated_at: at }).eq("id", id).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    return { ok: true, data: { at } };
  });
}

export async function publishPage(id: string, draft: PageDraft, note?: string): Promise<Result> {
  return run("editor", async ({ sb }) => {
    const { data: cur } = await sb.from("pages").select("title,seo,blocks,slug,published").eq("id", id).maybeSingle();
    if (!cur) return { ok: false, error: "blocked" };
    // keep the previous live version so it can be restored
    await sb.from("page_versions").insert({ page_id: id, snapshot: { title: cur.title, seo: cur.seo, blocks: cur.blocks }, note: note || null });
    const d = cleanDraft(draft);
    const { data, error } = await sb
      .from("pages")
      .update({ title: d.title, seo: d.seo, blocks: d.blocks, published: true, published_at: new Date().toISOString(), draft: null, draft_updated_at: null })
      .eq("id", id)
      .select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    bust();
    return { ok: true };
  });
}

export async function discardDraft(id: string): Promise<Result> {
  return run("editor", async ({ sb }) => {
    const { data, error } = await sb.from("pages").update({ draft: null, draft_updated_at: null }).eq("id", id).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    return { ok: true };
  });
}

export async function setPagePublished(id: string, published: boolean): Promise<Result> {
  return run("editor", async ({ sb }) => {
    const { data: row } = await sb.from("pages").select("slug").eq("id", id).maybeSingle();
    if (!row) return { ok: false, error: "blocked" };
    if (!published && row.slug === "") return { ok: false, error: "validation", detail: "The home page can't be unpublished." };
    const { data, error } = await sb.from("pages").update({ published }).eq("id", id).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    bust();
    return { ok: true };
  });
}

export async function renamePageSlug(id: string, slug: string): Promise<Result> {
  return run("admin", async ({ sb }) => {
    const s = slug.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
    if (!SLUG.test(s) || RESERVED.has(s.split("/")[0]!)) return { ok: false, error: "validation", detail: "invalid or reserved slug" };
    const { data, error } = await sb.from("pages").update({ slug: s }).eq("id", id).eq("kind", "custom").select("id");
    if (error) return { ok: false, error: "validation", detail: error.code === "23505" ? "slug already exists" : error.message };
    if (!data?.length) return { ok: false, error: "blocked", detail: "System pages keep their address." };
    bust();
    return { ok: true };
  });
}

export async function restoreVersion(pageId: string, versionId: string): Promise<Result<{ draft: PageDraft }>> {
  return run("editor", async ({ sb }) => {
    const { data: v } = await sb.from("page_versions").select("snapshot").eq("id", versionId).eq("page_id", pageId).maybeSingle();
    if (!v) return { ok: false, error: "blocked" };
    const draft = cleanDraft(v.snapshot as PageDraft);
    const { data, error } = await sb.from("pages").update({ draft, draft_updated_at: new Date().toISOString() }).eq("id", pageId).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    return { ok: true, data: { draft } };
  });
}

export async function saveTemplate(name: L, blocks: BlockIn[]): Promise<Result> {
  return run("editor", async ({ sb }) => {
    const { data, error } = await sb.from("page_templates").insert({ name, blocks: cleanDraft({ title: {}, seo: {}, blocks }).blocks }).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    return { ok: true };
  });
}

export async function deletePage(id: string): Promise<Result> {
  return run("admin", async ({ sb }) => {
    const { data, error } = await sb.from("pages").delete().eq("id", id).eq("kind", "custom").select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked", detail: "System pages can't be deleted." };
    bust();
    return { ok: true };
  });
}
