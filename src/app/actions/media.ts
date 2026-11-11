"use server";

import { updateTag } from "next/cache";
import { ForbiddenError, atLeast, requireAction } from "@/lib/admin/auth";
import { T } from "@/lib/tags";
import { blockDef } from "@/lib/admin/blocks";
import type { Result } from "./admin";
import { settings as seedSettings } from "@/content/seed/site";

/**
 * "Where is this image used?" and "Replace it everywhere".
 * Uploaded files are cached for a year at their URL, so replacing never overwrites a file: it uploads a new one
 * and rewrites every reference (pages, sections, settings, collections, posts) to the new URL, then refreshes
 * only the pages that changed. Works for uploads and for the bundled /legacy images alike.
 */

type Src = { table: string; key: string; cols: string[]; label: (row: Row) => string; tags: (row: Row) => string[]; min: "editor" | "admin" };
type Row = Record<string, unknown>;
export type Usage = { table: string; id: string; where: string; path: string };
export type SiteImage = { url: string; uses: Usage[] };

const name = (v: unknown) => {
  const o = (v ?? {}) as Record<string, string>;
  return o.en || o.ar || Object.values(o)[0] || "";
};
const IMG = /^(https?:\/\/|\/)[^\s"'<>]+\.(png|jpe?g|webp|avif|gif|svg)(\?[^\s"'<>]*)?$/i;

const SOURCES: Src[] = [
  { table: "settings", key: "key", cols: ["value"], label: (r) => (r.key === "site" ? "Settings" : `Settings · ${r.key}`), tags: () => [T.settings], min: "admin" },
  { table: "pages", key: "id", cols: ["slug", "title", "blocks", "seo", "draft"], label: (r) => `Page · ${name(r.title) || r.slug || "Home"}`, tags: (r) => [T.page(String(r.slug ?? ""))], min: "editor" },
  { table: "services", key: "id", cols: ["image", "body", "name"], label: (r) => `Service · ${name(r.name)}`, tags: () => [T.services], min: "editor" },
  { table: "team_members", key: "id", cols: ["photo", "bio", "name"], label: (r) => `Team · ${name(r.name)}`, tags: () => [T.team], min: "editor" },
  { table: "clients", key: "id", cols: ["logo", "name"], label: (r) => `Client · ${name(r.name)}`, tags: () => [T.clients], min: "editor" },
  { table: "certificates", key: "id", cols: ["image", "title"], label: (r) => `Credential · ${name(r.title)}`, tags: () => [T.certificates], min: "editor" },
  { table: "gallery_items", key: "id", cols: ["image", "caption"], label: (r) => `Gallery · ${name(r.caption).slice(0, 40)}`, tags: () => [T.gallery], min: "editor" },
  { table: "authors", key: "id", cols: ["photo", "name"], label: (r) => `Author · ${name(r.name)}`, tags: () => [T.taxonomy], min: "editor" },
  { table: "posts", key: "id", cols: ["cover", "body", "seo", "title", "slug"], label: (r) => `Post · ${name(r.title) || "(untitled)"}`, tags: (r) => [T.post(String(r.id)), T.postsIndex], min: "editor" },
];
const LABEL_COLS = new Set(["title", "name", "slug", "caption"]);

/** Readable location: "Page · Home › Hero › image". */
function where(src: Src, row: Row, path: string[]): string {
  const base = src.label(row);
  if (src.table === "pages" && (path[0] === "blocks" || path[0] === "draft")) {
    const blocks = (path[0] === "draft" ? (row.draft as Row | null)?.blocks : row.blocks) as { type: string }[] | undefined;
    const idx = Number(path[path[0] === "draft" ? 2 : 1]);
    const def = blocks?.[idx] ? blockDef(blocks[idx]!.type) : null;
    const field = path[path.length - 1];
    return `${base} › ${def ? def.label[1] : "Section"}${path[0] === "draft" ? " (draft)" : ""} › ${field}`;
  }
  if (src.table === "settings") return `${base} › ${path.slice(1).join(" › ")}`;
  return `${base} › ${path[0]}`;
}

function walk(v: unknown, path: string[], visit: (s: string, path: string[]) => void) {
  if (typeof v === "string") return visit(v, path);
  if (Array.isArray(v)) return v.forEach((x, i) => walk(x, [...path, String(i)], visit));
  if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, [...path, k], visit);
}
function replaceIn(v: unknown, from: string, to: string): { v: unknown; n: number } {
  if (typeof v === "string") return v === from ? { v: to, n: 1 } : { v, n: 0 };
  if (Array.isArray(v)) {
    let n = 0;
    const out = v.map((x) => { const r = replaceIn(x, from, to); n += r.n; return r.v; });
    return { v: out, n };
  }
  if (v && typeof v === "object") {
    let n = 0;
    const out: Row = {};
    for (const [k, x] of Object.entries(v)) { const r = replaceIn(x, from, to); n += r.n; out[k] = r.v; }
    return { v: out, n };
  }
  return { v, n: 0 };
}

async function scan(sb: Awaited<ReturnType<typeof requireAction>>["sb"]) {
  const results = await Promise.all(
    SOURCES.map(async (src) => {
      const { data } = await sb.from(src.table).select([src.key, ...src.cols.filter((c) => c !== src.key)].join(","));
      let rows = (data ?? []) as unknown as Row[];
      // Design images that still use their built-in defaults aren't stored yet: include the defaults so they can
      // be found and replaced like any other image (replacing writes them into the settings row).
      if (src.table === "settings") {
        const site = rows.find((r) => r.key === "site");
        const withDefaults = (v: unknown) => ({ ...((v ?? {}) as Row), images: { ...seedSettings.images, ...(((v ?? {}) as Row).images as Row | undefined) } });
        rows = site ? rows.map((r) => (r === site ? { ...r, value: withDefaults(r.value) } : r)) : [...rows, { key: "site", value: withDefaults({}) }];
      }
      return { src, rows };
    }),
  );
  return results;
}

/** Every image the website uses, with where it appears. */
export async function listSiteImages(): Promise<Result<{ images: SiteImage[] }>> {
  try {
    const { sb } = await requireAction("viewer");
    const map = new Map<string, Usage[]>();
    for (const { src, rows } of await scan(sb)) {
      for (const row of rows) {
        for (const col of src.cols) {
          if (LABEL_COLS.has(col) && col !== "image") continue;
          walk(row[col], [col], (s, path) => {
            if (!IMG.test(s)) return;
            const list = map.get(s) ?? [];
            list.push({ table: src.table, id: String(row[src.key]), where: where(src, row, src.table === "settings" ? path : path), path: path.join(".") });
            map.set(s, list);
          });
        }
      }
    }
    const images = [...map.entries()].map(([url, uses]) => ({ url, uses })).sort((a, b) => b.uses.length - a.uses.length || a.url.localeCompare(b.url));
    return { ok: true, data: { images } };
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: "forbidden" };
    return { ok: false, error: "generic", detail: (e as Error).message };
  }
}

/** Rewrite every reference of `from` to `to`. Settings need an admin; content needs an editor. */
export async function replaceImageEverywhere(from: string, to: string, size?: { width: number | null; height: number | null }): Promise<Result<{ replaced: number; skipped: number }>> {
  try {
    const { sb, staff } = await requireAction("editor");
    if (!IMG.test(from) || !IMG.test(to) || from === to) return { ok: false, error: "validation", detail: "invalid image URL" };
    const tags = new Set<string>();
    let replaced = 0;
    let skipped = 0;
    for (const { src, rows } of await scan(sb)) {
      const allowed = atLeast(staff.role, src.min);
      for (const row of rows) {
        const patch: Row = {};
        let n = 0;
        for (const col of src.cols) {
          if (LABEL_COLS.has(col)) continue;
          const r = replaceIn(row[col], from, to);
          if (r.n) { patch[col] = r.v; n += r.n; }
        }
        if (!n) continue;
        if (!allowed) { skipped += n; continue; }
        if (src.table === "gallery_items" && size?.width && size?.height) Object.assign(patch, { width: size.width, height: size.height });
        const { error } = await sb.from(src.table).update(patch).eq(src.key, row[src.key] as string);
        if (error) { skipped += n; continue; }
        replaced += n;
        src.tags(row).forEach((t) => tags.add(t));
      }
    }
    for (const t of tags) updateTag(t);
    return { ok: true, data: { replaced, skipped } };
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: "forbidden" };
    return { ok: false, error: "generic", detail: (e as Error).message };
  }
}
