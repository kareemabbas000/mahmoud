"use server";

import { updateTag } from "next/cache";
import { getCollection, type Field } from "@/lib/admin/collections";
import { ForbiddenError, requireAction } from "@/lib/admin/auth";
import type { Role } from "@/lib/types";
import { T } from "@/lib/tags";
import { triggerDeploy } from "@/lib/server/deploy";
import { variantPaths } from "@/lib/media";

export type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error: "forbidden" | "blocked" | "validation" | "generic"; detail?: string };

/** Runs an admin mutation with role check + uniform error mapping. */
async function run<T>(min: Role, fn: (ctx: Awaited<ReturnType<typeof requireAction>>) => Promise<Result<T>>): Promise<Result<T>> {
  try {
    const ctx = await requireAction(min);
    return await fn(ctx);
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: "forbidden" };
    console.error("[admin]", e);
    return { ok: false, error: "generic", detail: (e as Error).message };
  }
}

/**
 * Expire exactly the public caches an edit touched (read-your-own-writes). Never add a catch-all tag here:
 * see docs/GUARDRAILS.md §3 — a site-wide bust re-renders every page, including thousands of posts.
 */
function bust(...tags: string[]) {
  for (const t of new Set(tags)) updateTag(t);
}

/** Service fields that appear in the header/footer navigation (cached separately under services:nav). */
const NAV_FIELDS = ["slug", "sort", "icon", "name", "summary", "published"] as const;
const sameJson = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function clean(fields: Field[], input: Record<string, unknown>): { ok: true; row: Record<string, unknown> } | { ok: false; detail: string } {
  const row: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === "seo" || !(f.key in input)) {
      if (f.type === "seo" && f.key in input) row[f.key] = input[f.key] ?? {};
      continue;
    }
    let v = input[f.key];
    switch (f.type) {
      case "number":
        v = v === "" || v === null || v === undefined ? null : Number(v);
        if (v !== null && Number.isNaN(v)) return { ok: false, detail: `${f.key}: not a number` };
        break;
      case "boolean":
        v = Boolean(v);
        break;
      case "slug":
        v = String(v ?? "").trim().toLowerCase();
        if (!SLUG.test(v as string)) return { ok: false, detail: `${f.key}: invalid slug` };
        break;
      case "url":
        v = String(v ?? "").trim() || null;
        if (v && !/^https?:\/\//.test(v as string)) return { ok: false, detail: `${f.key}: must start with https://` };
        break;
      case "email":
        v = String(v ?? "").trim() || null;
        if (v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v as string)) return { ok: false, detail: `${f.key}: invalid email` };
        break;
      case "select":
        v = f.options.some((o) => o.value === String(v)) ? (/^\d+$/.test(String(v)) && f.key === "status" ? Number(v) : String(v)) : f.options[0]?.value;
        break;
      case "strings":
        v = (Array.isArray(v) ? v : String(v ?? "").split(/\n|,/)).map((x) => String(x).trim()).filter(Boolean);
        break;
      case "text":
      case "textarea":
      case "image":
      case "icon":
      case "date":
        v = v === "" ? null : v;
        break;
      default:
        // localized JSON: keep only string / doc / array values per language
        if (v && typeof v === "object" && !Array.isArray(v)) {
          const o: Record<string, unknown> = {};
          for (const [k, x] of Object.entries(v as Record<string, unknown>)) if (/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(k)) o[k] = x;
          v = o;
        } else v = {};
    }
    if ("required" in f && f.required) {
      const empty = v === null || v === "" || (typeof v === "object" && v !== null && !Array.isArray(v) && Object.values(v).every((x) => !x));
      if (empty) return { ok: false, detail: `${f.key}: required` };
    }
    row[f.key] = v;
  }
  return { ok: true, row };
}

/** Tags for a collection edit. Services also refresh navigation when nav fields changed. */
function tagsFor(key: string, tag: string, navChanged = true): string[] {
  if (key === "services") return navChanged ? [T.services, T.servicesNav] : [T.services];
  return [tag];
}

export async function saveItem(key: string, id: string | null, input: Record<string, unknown>): Promise<Result<{ id: string }>> {
  const c = getCollection(key);
  if (!c) return { ok: false, error: "generic" };
  return run(c.min, async ({ sb }) => {
    const cleaned = clean(c.fields, input);
    if (!cleaned.ok) return { ok: false, error: "validation", detail: cleaned.detail };
    let navChanged = !id;
    if (id && c.key === "services") {
      const { data: before } = await sb.from(c.table).select(NAV_FIELDS.join(",")).eq("id", id).maybeSingle();
      navChanged = !before || NAV_FIELDS.some((k) => k in cleaned.row && !sameJson((before as unknown as Record<string, unknown>)[k], cleaned.row[k]));
    }
    const q = id ? sb.from(c.table).update(cleaned.row).eq("id", id).select("id") : sb.from(c.table).insert({ ...c.defaults, ...cleaned.row }).select("id");
    const { data, error } = await q;
    if (error) return { ok: false, error: error.code === "42501" ? "forbidden" : "validation", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    bust(...tagsFor(c.key, c.tag, navChanged));
    if (c.key === "redirects") await triggerDeploy("redirects");
    return { ok: true, data: { id: data[0]!.id as string } };
  });
}

export async function deleteItem(key: string, id: string): Promise<Result> {
  const c = getCollection(key);
  if (!c) return { ok: false, error: "generic" };
  return run("admin", async ({ sb }) => {
    const { data, error } = await sb.from(c.table).delete().eq("id", id).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    bust(...tagsFor(c.key, c.tag));
    if (c.key === "redirects") await triggerDeploy("redirects");
    return { ok: true };
  });
}

export async function reorderItems(key: string, ids: string[]): Promise<Result> {
  const c = getCollection(key);
  if (!c?.sort) return { ok: false, error: "generic" };
  return run(c.min, async ({ sb }) => {
    for (let i = 0; i < ids.length; i++) {
      const { data, error } = await sb.from(c.table).update({ sort: (i + 1) * 10 }).eq("id", ids[i]!).select("id");
      if (error) return { ok: false, error: "generic", detail: error.message };
      if (!data?.length) return { ok: false, error: "blocked" };
    }
    bust(...tagsFor(c.key, c.tag));
    return { ok: true };
  });
}

export async function togglePublished(key: string, id: string, value: boolean): Promise<Result> {
  const c = getCollection(key);
  if (!c) return { ok: false, error: "generic" };
  return run(c.min, async ({ sb }) => {
    const { data, error } = await sb.from(c.table).update({ published: value }).eq("id", id).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    bust(...tagsFor(c.key, c.tag));
    if (c.key === "redirects") await triggerDeploy("redirects");
    return { ok: true };
  });
}

/* ───────────── Settings (site, tracking, also-offered) ───────────── */
export async function saveSetting(key: "site" | "tracking" | "services_also_offered", value: unknown): Promise<Result> {
  return run("admin", async ({ sb }) => {
    const { data, error } = await sb.from("settings").upsert({ key, value }).select("key");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    bust(key === "tracking" ? T.tracking : key === "site" ? T.settings : T.servicesAlso);
    return { ok: true };
  });
}

/* ───────────── Languages ───────────── */
export type LangRow = { code: string; name: string; native_name: string; dir: "ltr" | "rtl"; enabled: boolean; is_default: boolean; sort: number };

export async function saveLanguages(rows: LangRow[]): Promise<Result> {
  return run("admin", async ({ sb }) => {
    const defaults = rows.filter((r) => r.is_default);
    if (defaults.length !== 1) return { ok: false, error: "validation", detail: "Exactly one default language is required." };
    if (!defaults[0]!.enabled) return { ok: false, error: "validation", detail: "The default language must be enabled." };
    for (const r of rows) if (!/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(r.code)) return { ok: false, error: "validation", detail: `Invalid code ${r.code}` };
    const { data: before } = await sb.from("languages").select("code,is_default");
    // Clear the default flag first so the partial unique index never conflicts mid-update.
    await sb.from("languages").update({ is_default: false }).neq("code", defaults[0]!.code);
    const { data, error } = await sb.from("languages").upsert(rows.map((r, i) => ({ ...r, sort: i + 1 }))).select("code");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if ((data?.length ?? 0) !== rows.length) return { ok: false, error: "blocked" };
    bust(T.languages);
    // New language codes and a new default language are baked into the build (static params + "/" redirect).
    const prev = new Set((before ?? []).map((r) => r.code as string));
    const prevDefault = (before ?? []).find((r) => r.is_default)?.code;
    if (rows.some((r) => !prev.has(r.code)) || prevDefault !== defaults[0]!.code) {
      const deployed = await triggerDeploy("languages");
      if (!deployed) return { ok: true, data: { redeploy: true } };
    }
    return { ok: true };
  });
}

/* ───────────── UI strings ───────────── */
export async function saveString(key: string, values: Record<string, string>): Promise<Result> {
  return run("editor", async ({ sb }) => {
    if (!/^[a-z0-9_]+(\.[a-z0-9_]+)+$/.test(key)) return { ok: false, error: "validation", detail: "Key format: group.name" };
    const { data, error } = await sb.from("ui_strings").upsert({ key, values }).select("key");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    bust(T.ui);
    return { ok: true };
  });
}

/* ───────────── Menus ───────────── */
export async function saveMenu(location: "header" | "footer", items: unknown): Promise<Result> {
  return run("admin", async ({ sb }) => {
    const { data, error } = await sb.from("menus").upsert({ location, items }).select("location");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    bust(T.menus);
    return { ok: true };
  });
}

/* ───────────── Media ───────────── */
export async function registerMedia(m: { path: string; url: string; mime: string; size: number; width?: number | null; height?: number | null; folder?: string }): Promise<Result<{ id: string }>> {
  return run("editor", async ({ sb }) => {
    const { data, error } = await sb.from("media").insert({ ...m, bucket: "media" }).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    return { ok: true, data: { id: data[0]!.id as string } };
  });
}

export async function updateMediaAlt(id: string, alt: Record<string, string>): Promise<Result> {
  return run("editor", async ({ sb }) => {
    const { data, error } = await sb.from("media").update({ alt }).eq("id", id).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    return { ok: true };
  });
}

export async function deleteMedia(id: string): Promise<Result> {
  return run("editor", async ({ sb }) => {
    const { data: row } = await sb.from("media").select("path,bucket").eq("id", id).maybeSingle();
    if (!row) return { ok: false, error: "blocked" };
    const rm = await sb.storage.from(row.bucket as string).remove(variantPaths(row.path as string));
    if (rm.error) return { ok: false, error: "generic", detail: rm.error.message };
    const { data, error } = await sb.from("media").delete().eq("id", id).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    return { ok: true };
  });
}
