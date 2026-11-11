"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { deleteMedia, updateMediaAlt } from "@/app/actions/admin";
import { listSiteImages, replaceImageEverywhere, type SiteImage } from "@/app/actions/media";
import { isVariantSet, variantUrl } from "@/lib/media";
import { canEdit, useAdmin, useResult } from "./AdminContext";
import { MediaPicker, useUploader, type MediaRow } from "./MediaPicker";
import { LangTabs } from "./LangTabs";

const thumb = (url: string) => (isVariantSet(url) ? variantUrl(url, 480) : url);
const fileName = (url: string) => decodeURIComponent(url.split("/").slice(-2).join("/"));
const kb = (n: number | null | undefined) => (n ? (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} kB`) : "");

type Tab = "library" | "site";

/**
 * Media centre.
 *  Library: everything uploaded, with search, alt text per language, usage and replace.
 *  On the website: every image the site shows (uploads and the original /legacy photos), where it appears,
 *  and a one-click "Replace everywhere".
 */
export function MediaManager({ initial }: { initial: (MediaRow & { size?: number | null })[] }) {
  const { t, role } = useAdmin();
  const show = useResult();
  const upload = useUploader();
  const editor = canEdit(role, "editor");
  const [tab, setTab] = useState<Tab>("library");
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<(typeof initial)[number] | null>(null);
  const [alt, setAlt] = useState<Record<string, string>>({});
  const [drag, setDrag] = useState(false);
  const [site, setSite] = useState<SiteImage[] | null>(null);
  const [replacing, setReplacing] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const loadSite = useCallback(() => {
    start(async () => {
      const r = await listSiteImages();
      if (r.ok) setSite((r.data as { images: SiteImage[] }).images);
      else show(r);
    });
  }, [show]);
  useEffect(() => { loadSite(); }, [loadSite]);

  const usesOf = (url: string) => site?.find((s) => s.url === url)?.uses ?? [];
  const add = async (files: FileList | File[]) => { const r = await upload(files); setItems((x) => [...r, ...x]); };
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? items.filter((m) => m.path.toLowerCase().includes(s) || Object.values(m.alt ?? {}).some((a) => a.toLowerCase().includes(s))) : items;
  }, [items, q]);
  const siteFiltered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (site ?? []).filter((x) => !s || x.url.toLowerCase().includes(s) || x.uses.some((u) => u.where.toLowerCase().includes(s)));
  }, [site, q]);

  const doReplace = (from: string, m: { url: string; width: number | null; height: number | null }) => {
    const n = usesOf(from).length;
    if (!confirm(t(`استبدال الصورة في ${n} موضع؟ تظهر الصورة الجديدة على الموقع فورًا.`, `Replace this image in ${n} place(s)? The new image goes live immediately.`))) return;
    start(async () => {
      const r = await replaceImageEverywhere(from, m.url, { width: m.width, height: m.height });
      if (r.ok) {
        const d = r.data as { replaced: number; skipped: number };
        show({ ok: true }, d.skipped ? t(`تم الاستبدال في ${d.replaced} موضع. ${d.skipped} موضع في الإعدادات يحتاج صلاحية مسؤول.`, `Replaced in ${d.replaced} place(s). ${d.skipped} in Settings need an admin.`) : t(`تم الاستبدال في ${d.replaced} موضع`, `Replaced in ${d.replaced} place(s)`));
        loadSite();
      } else show(r);
    });
  };

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-full bg-paper-2 p-1 text-sm" role="tablist">
          {([["library", t("المكتبة", "Library"), items.length], ["site", t("على الموقع", "On the website"), site?.length ?? 0]] as const).map(([k, label, n]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 ${tab === k ? "bg-surface font-semibold text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
              {label} <span className="text-faint">{n}</span>
            </button>
          ))}
        </div>
        <input type="search" className="ed-input !w-auto min-w-0 flex-1 sm:max-w-xs" placeholder={t("بحث بالاسم أو المكان أو النص البديل…", "Search by name, place or alt text…")} value={q} onChange={(e) => setQ(e.target.value)} />
        {editor && tab === "library" && (
          <label className="btn btn-primary cursor-pointer !min-h-10 text-sm">
            {t("رفع صور", "Upload")}
            <input type="file" multiple accept="image/*,application/pdf" className="sr-only" onChange={(e) => { if (e.target.files?.length) void add(e.target.files); e.target.value = ""; }} />
          </label>
        )}
      </div>

      {tab === "library" ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_21rem]">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); if (editor && e.dataTransfer.files.length) void add(e.dataTransfer.files); }}
            className={`rounded-xl border-2 border-dashed p-3 sm:p-4 ${drag ? "border-blue bg-blue-wash" : "border-rule"}`}
          >
            <p className="mb-3 text-xs text-muted">{t("اسحب الصور إلى هنا. تُحوَّل تلقائيًا إلى WebP بثلاثة مقاسات لتكون خفيفة وسريعة.", "Drop images here. They're converted to WebP in three sizes automatically, so they stay light and fast.")}</p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 xl:grid-cols-6">
              {filtered.length === 0 && <li className="col-span-full p-10 text-center text-muted">{q ? t("لا نتائج.", "No results.") : t("المكتبة فارغة. ارفع أول صورة.", "The library is empty. Upload your first image.")}</li>}
              {filtered.map((m) => {
                const n = usesOf(m.url).length;
                return (
                  <li key={m.id}>
                    <button type="button" onClick={() => { setSel(m); setAlt(m.alt ?? {}); }} className={`relative block w-full overflow-hidden rounded-lg border-2 bg-paper-2 ${sel?.id === m.id ? "border-blue" : "border-transparent"}`}>
                      {m.mime?.startsWith("image/") ? <img src={thumb(m.url)} alt={m.alt?.en ?? m.alt?.ar ?? ""} loading="lazy" className="aspect-square w-full object-cover" /> : <span className="flex aspect-square items-center justify-center text-xs">PDF</span>}
                      {site && <span className={`absolute bottom-1 end-1 rounded-full px-1.5 text-[0.65rem] font-semibold ${n ? "bg-ink/80 text-paper" : "bg-surface/90 text-faint"}`}>{n ? `×${n}` : t("غير مستخدمة", "unused")}</span>}
                    </button>
                    {Object.keys(m.alt ?? {}).length === 0 && <p className="mt-1 text-[0.68rem] text-orange-text">{t("بدون نص بديل", "No alt text")}</p>}
                  </li>
                );
              })}
            </ul>
          </div>
          <aside className="h-fit rounded-xl border border-rule bg-surface p-4 lg:sticky lg:top-24">
            {!sel ? (
              <p className="text-sm text-muted">{t("اختر صورة لتعديل نصها البديل، أو لمعرفة أين تُستخدم واستبدالها في كل مكان.", "Pick an image to edit its alt text, see where it's used, or replace it everywhere.")}</p>
            ) : (
              <div className="grid gap-3 text-sm">
                {sel.mime?.startsWith("image/") && <img src={thumb(sel.url)} alt="" className="w-full rounded-lg" />}
                <p className="break-all text-xs text-faint" dir="ltr">{fileName(sel.url)}{sel.width ? ` · ${sel.width}×${sel.height}` : ""}{sel.size ? ` · ${kb(sel.size)}` : ""}</p>
                <Uses uses={usesOf(sel.url)} loading={!site} />
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="btn btn-ghost !min-h-9 text-sm" onClick={() => { void navigator.clipboard.writeText(sel.url); show({ ok: true }, t("تم نسخ الرابط", "URL copied")); }}>{t("نسخ الرابط", "Copy URL")}</button>
                  {editor && <button type="button" className="btn btn-ghost !min-h-9 text-sm" disabled={pending || !usesOf(sel.url).length} onClick={() => setReplacing(sel.url)}>{t("استبدال في كل مكان", "Replace everywhere")}</button>}
                </div>
                <div className="grid gap-1.5">
                  <span className="text-xs font-semibold text-ink">{t("النص البديل لكل لغة (للوصولية ومحركات البحث)", "Alt text per language (accessibility & SEO)")}</span>
                  <LangTabs value={alt} render={(c) => <input className="ed-input" disabled={!editor} value={alt[c] ?? ""} onChange={(e) => setAlt({ ...alt, [c]: e.target.value })} />} />
                </div>
                {editor && (
                  <>
                    <button type="button" className="btn btn-primary !min-h-9 text-sm" disabled={pending} onClick={() => start(async () => { if (show(await updateMediaAlt(sel.id, alt), t("تم الحفظ", "Saved"))) setItems((x) => x.map((m) => (m.id === sel.id ? { ...m, alt } : m))); })}>{t("حفظ النص البديل", "Save alt text")}</button>
                    <button
                      type="button"
                      className="justify-self-start text-xs text-danger"
                      disabled={pending}
                      onClick={() => {
                        const n = usesOf(sel.url).length;
                        const msg = n ? t(`هذه الصورة مستخدمة في ${n} موضع وستختفي منها. استبدلها أولًا إن أردت. حذف نهائي؟`, `This image is used in ${n} place(s) and will disappear from them. Replace it first if needed. Delete permanently?`) : t("حذف الملف نهائيًا؟", "Delete this file permanently?");
                        if (!confirm(msg)) return;
                        start(async () => { if (show(await deleteMedia(sel.id), t("تم الحذف", "Deleted"))) { setItems((x) => x.filter((m) => m.id !== sel.id)); setSel(null); } });
                      }}
                    >
                      {t("حذف الملف", "Delete file")}
                    </button>
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="text-sm text-muted">{t("كل صورة تظهر على الموقع وأين تظهر. «استبدال» يغيّرها في كل الأماكن دفعة واحدة، بما فيها الصور الأصلية للموقع القديم.", "Every image the website shows, and where. “Replace” swaps it in all those places at once, including the original photos from the old site.")}</p>
          {!site && <p className="p-10 text-center text-muted">{t("جارٍ فحص الموقع…", "Scanning the website…")}</p>}
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {siteFiltered.map((s) => (
              <li key={s.url} className="flex gap-3 rounded-xl border border-rule bg-surface p-3">
                <img src={thumb(s.url)} alt="" loading="lazy" className="size-20 flex-none rounded-lg bg-paper-2 object-contain" />
                <div className="grid min-w-0 flex-1 content-start gap-1.5">
                  <p className="truncate text-xs text-faint" dir="ltr" title={s.url}>{fileName(s.url)}</p>
                  <Uses uses={s.uses} compact />
                  {editor && <button type="button" className="btn btn-ghost !min-h-8 justify-self-start !px-3 text-xs" disabled={pending} onClick={() => setReplacing(s.url)}>{t("استبدال", "Replace")}</button>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <MediaPicker
        open={replacing !== null}
        onClose={() => setReplacing(null)}
        onPick={(m) => { const from = replacing; setReplacing(null); if (from) doReplace(from, m); }}
      />
    </div>
  );
}

function Uses({ uses, loading, compact }: { uses: { where: string }[]; loading?: boolean; compact?: boolean }) {
  const { t } = useAdmin();
  const [all, setAll] = useState(false);
  if (loading) return <p className="text-xs text-faint">{t("جارٍ معرفة أماكن الاستخدام…", "Finding where it's used…")}</p>;
  if (!uses.length) return <p className="text-xs text-faint">{t("غير مستخدمة على الموقع.", "Not used on the website.")}</p>;
  const list = all ? uses : uses.slice(0, compact ? 2 : 4);
  return (
    <div className="grid gap-1">
      {!compact && <span className="text-xs font-semibold text-ink">{t(`مستخدمة في ${uses.length} موضع`, `Used in ${uses.length} place(s)`)}</span>}
      <ul className="flex flex-wrap gap-1">
        {list.map((u, i) => <li key={i} className="max-w-full truncate rounded-md bg-paper-2 px-2 py-0.5 text-[0.7rem] text-muted" dir="ltr">{u.where}</li>)}
        {uses.length > list.length && <li><button type="button" className="text-[0.7rem] text-blue" onClick={() => setAll(true)}>+{uses.length - list.length}</button></li>}
      </ul>
    </div>
  );
}
