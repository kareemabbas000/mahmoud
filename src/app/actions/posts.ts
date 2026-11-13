"use server";

import { updateTag } from "next/cache";
import { ForbiddenError, requireAction } from "@/lib/admin/auth";
import type { Role } from "@/lib/types";
import type { Result } from "./admin";
import { T } from "@/lib/tags";
import { minutesFor } from "@/lib/posts";

async function run<T>(min: Role, fn: (ctx: Awaited<ReturnType<typeof requireAction>>) => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await fn(await requireAction(min));
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: "forbidden" };
    console.error("[posts]", e);
    return { ok: false, error: "generic", detail: (e as Error).message };
  }
}
/**
 * Refresh one post: its page (post:<id>), every slug it had or has (slug:<slug>) and the lists
 * (posts:index → /insights pages, RSS, sitemap). Other post pages are never touched.
 */
const bust = (id: string, ...slugMaps: (Record<string, string> | null | undefined)[]) => {
  updateTag(T.post(id));
  updateTag(T.postsIndex);
  const slugs = new Set(slugMaps.flatMap((m) => Object.values(m ?? {})).filter(Boolean));
  for (const s of slugs) updateTag(T.slug(s));
};
const oldSlugs = async (sb: Awaited<ReturnType<typeof requireAction>>["sb"], id: string) =>
  ((await sb.from("posts").select("slug").eq("id", id).maybeSingle()).data?.slug ?? {}) as Record<string, string>;

type L<T = string> = Record<string, T>;
export type PostInput = {
  slug: L;
  status: "draft" | "scheduled" | "published";
  publish_at: string | null;
  title: L;
  excerpt: L;
  body: L<unknown>;
  cover: string | null;
  cover_alt: L;
  category_id: string | null;
  tag_ids: string[];
  author_id: string | null;
  seo: L<{ title?: string; description?: string; focus_keyword?: string; keywords?: string; og_title?: string; og_description?: string; og_image?: string; noindex?: boolean; canonical?: string }>;
  layout?: "classic" | "feature" | "minimal";
  faqs: L<{ q: string; a: string }[]>;
};

const LOC = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;
const onlyLocales = <T,>(o: unknown): L<T> => Object.fromEntries(Object.entries((o ?? {}) as L<T>).filter(([k]) => LOC.test(k)));
const SLUG = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;

/** Up to 3 newest live posts sharing the category or a tag. */
async function pickRelated(sb: Awaited<ReturnType<typeof requireAction>>["sb"], id: string, cat: string | null, tags: string[]): Promise<string[]> {
  const ors = [cat ? `category_id.eq.${cat}` : "", tags.length ? `tag_ids.ov.{${tags.join(",")}}` : ""].filter(Boolean);
  if (!ors.length) return [];
  const { data } = await sb.from("posts").select("id").neq("id", id).in("status", ["published", "scheduled"]).lte("publish_at", new Date().toISOString()).or(ors.join(",")).order("publish_at", { ascending: false }).limit(3);
  return (data ?? []).map((r) => r.id as string);
}

export async function createPost(): Promise<Result<{ id: string }>> {
  return run("editor", async ({ sb }) => {
    const { data, error } = await sb.from("posts").insert({ status: "draft" }).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    return { ok: true, data: { id: data[0]!.id as string } };
  });
}

/** Content kept in a revision snapshot. */
const SNAP = "title,excerpt,body,seo,faqs,cover,cover_alt,slug,layout,category_id,tag_ids,author_id";

/**
 * Save a post. `autosave` (drafts only, from the editor's idle timer) skips the revision snapshot so the
 * 20-revision history holds meaningful versions, not every pause in typing.
 */
export async function savePost(id: string, input: PostInput, opts: { autosave?: boolean } = {}): Promise<Result<{ status: string; publish_at: string | null }>> {
  return run("editor", async ({ sb }) => {
    const slug = Object.fromEntries(Object.entries(onlyLocales<string>(input.slug)).map(([k, v]) => [k, String(v ?? "").trim().toLowerCase()]).filter(([, v]) => v));
    for (const [k, v] of Object.entries(slug)) if (!SLUG.test(String(v))) return { ok: false, error: "validation", detail: `slug (${k}): letters, numbers and single hyphens only` };
    const title = onlyLocales<string>(input.title);
    let status = input.status;
    let publishAt = input.publish_at ? new Date(input.publish_at).toISOString() : null;
    if (status !== "draft") {
      if (!Object.values(title).some((x) => x?.trim())) return { ok: false, error: "validation", detail: "title: required before publishing" };
      if (!Object.keys(slug).length) return { ok: false, error: "validation", detail: "slug: required before publishing" };
    }
    if (status === "published" && !publishAt) publishAt = new Date().toISOString();
    if (status === "scheduled") {
      if (!publishAt) return { ok: false, error: "validation", detail: "publish date: required for scheduling" };
      if (new Date(publishAt) <= new Date()) status = "published";
    }
    // Slugs must be unique per language across posts.
    for (const [k, v] of Object.entries(slug)) {
      const { data: clash } = await sb.from("posts").select("id").neq("id", id).eq(`slug->>${k}`, v).limit(1);
      if (clash?.length) return { ok: false, error: "validation", detail: `slug (${k}) “${v}” is already used by another post` };
    }
    const { data: prev } = await sb.from("posts").select(`${SNAP},status`).eq("id", id).maybeSingle();
    const before = ((prev as { slug?: Record<string, string> } | null)?.slug ?? {}) as Record<string, string>;
    if (opts.autosave && status !== "draft") return { ok: false, error: "validation", detail: "autosave is for drafts only" };
    const body = onlyLocales<unknown>(input.body);
    const translation_status = Object.fromEntries(
      Object.keys({ ...title, ...body }).map((k) => {
        const doc = body[k] as { content?: unknown[] } | undefined;
        return [k, title[k]?.trim() && doc?.content?.length ? "current" : "missing"];
      }),
    );
    const row = {
      slug,
      status,
      publish_at: publishAt,
      title,
      excerpt: onlyLocales<string>(input.excerpt),
      body,
      cover: input.cover || null,
      cover_alt: onlyLocales<string>(input.cover_alt),
      category_id: input.category_id || null,
      tag_ids: (input.tag_ids ?? []).filter((x) => /^[0-9a-f-]{36}$/.test(x)),
      author_id: input.author_id || null,
      seo: onlyLocales(input.seo),
      faqs: Object.fromEntries(Object.entries(onlyLocales<{ q: string; a: string }[]>(input.faqs)).map(([k, v]) => [k, (v ?? []).filter((f) => f.q?.trim() && f.a?.trim())])),
      translation_status,
      layout: ["classic", "feature", "minimal"].includes(String(input.layout)) ? input.layout : "classic",
      // Stored so lists, cards and feeds never need to load post bodies.
      read_minutes: Object.fromEntries(Object.entries(body).map(([k, doc]) => [k, minutesFor(doc)])),
      // Related posts are picked at save time, so a post page never depends on the whole post list.
      related_ids: await pickRelated(sb, id, input.category_id || null, (input.tag_ids ?? []).filter((x) => /^[0-9a-f-]{36}$/.test(x))),
    };
    // Revision: keep the previous content when this save changes it.
    if (!opts.autosave && prev) {
      const p = prev as Record<string, unknown>;
      const changed = ["title", "excerpt", "body", "seo", "faqs", "cover", "slug", "layout"].some((k) => JSON.stringify(p[k] ?? null) !== JSON.stringify((row as Record<string, unknown>)[k] ?? null));
      const hasContent = Object.values((p.title ?? {}) as Record<string, string>).some(Boolean) || JSON.stringify(p.body ?? {}).length > 40;
      if (changed && hasContent) await sb.from("post_versions").insert({ post_id: id, snapshot: p });
    }
    const { data, error } = await sb.from("posts").update(row).eq("id", id).select("id,status,publish_at");
    if (error) return { ok: false, error: error.code === "42501" ? "forbidden" : "validation", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    // Drafts aren't public: nothing on the site changes, so no cache needs refreshing.
    if (status !== "draft" || (prev as { status?: string } | null)?.status !== "draft") bust(id, before, slug);
    return { ok: true, data: { status: data[0]!.status as string, publish_at: data[0]!.publish_at as string | null } };
  });
}

export async function duplicatePost(id: string): Promise<Result<{ id: string }>> {
  return run("editor", async ({ sb }) => {
    const { data: src } = await sb.from("posts").select("*").eq("id", id).maybeSingle();
    if (!src) return { ok: false, error: "blocked" };
    const copyT = Object.fromEntries(Object.entries((src.title ?? {}) as L).map(([k, v]) => [k, `${v} (${k === "ar" ? "نسخة" : "copy"})`]));
    const copyS = Object.fromEntries(Object.entries((src.slug ?? {}) as L).map(([k, v]) => [k, `${v}-${Date.now().toString(36).slice(-4)}`]));
    const { id: _i, created_at: _c, updated_at: _u, created_by: _cb, updated_by: _ub, ...rest } = src as Record<string, unknown>;
    void _i; void _c; void _u; void _cb; void _ub;
    const { data, error } = await sb.from("posts").insert({ ...rest, title: copyT, slug: copyS, status: "draft", publish_at: null }).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    return { ok: true, data: { id: data[0]!.id as string } };
  });
}

export async function setPostStatus(id: string, status: "draft" | "published"): Promise<Result> {
  return run("editor", async ({ sb }) => {
    const before = await oldSlugs(sb, id);
    const patch = status === "published" ? { status, publish_at: new Date().toISOString() } : { status };
    const { data, error } = await sb.from("posts").update(patch).eq("id", id).select("id");
    if (error) return { ok: false, error: "validation", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    bust(id, before);
    return { ok: true };
  });
}

export async function deletePost(id: string): Promise<Result> {
  return run("admin", async ({ sb }) => {
    const before = await oldSlugs(sb, id);
    const { data, error } = await sb.from("posts").delete().eq("id", id).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    bust(id, before);
    return { ok: true };
  });
}


export type PostVersion = { id: string; created_at: string; created_by: string | null; author: string | null; snapshot: Record<string, unknown> };

/** Revision history of a post, newest first (max 20). */
export async function listPostVersions(id: string): Promise<Result<{ versions: PostVersion[] }>> {
  return run("viewer", async ({ sb }) => {
    const { data, error } = await sb.from("post_versions").select("id,created_at,created_by,snapshot").eq("post_id", id).order("created_at", { ascending: false }).limit(20);
    if (error) return { ok: false, error: "generic", detail: error.message };
    const ids = [...new Set((data ?? []).map((v) => v.created_by).filter(Boolean))] as string[];
    const { data: people } = ids.length ? await sb.from("profiles").select("id,full_name,email").in("id", ids) : { data: [] };
    const name = (uid: string | null) => (people ?? []).find((x) => x.id === uid) as { full_name?: string; email?: string } | undefined;
    return { ok: true, data: { versions: (data ?? []).map((v) => ({ ...(v as Omit<PostVersion, "author">), author: name(v.created_by)?.full_name || name(v.created_by)?.email || null })) } };
  });
}
