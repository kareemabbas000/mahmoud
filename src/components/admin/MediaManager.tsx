"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from "react";
import { deleteMedia, updateMediaAlt } from "@/app/actions/admin";
import { canEdit, useAdmin, useResult } from "./AdminContext";
import { useUploader, type MediaRow } from "./MediaPicker";
import { LangTabs } from "./LangTabs";

export function MediaManager({ initial }: { initial: MediaRow[] }) {
  const { t, role } = useAdmin();
  const show = useResult();
  const upload = useUploader();
  const [items, setItems] = useState(initial);
  const [sel, setSel] = useState<MediaRow | null>(null);
  const [alt, setAlt] = useState<Record<string, string>>({});
  const [drag, setDrag] = useState(false);
  const [pending, start] = useTransition();
  const editor = canEdit(role, "editor");
  const add = async (files: FileList | File[]) => { const r = await upload(files); setItems((x) => [...r, ...x]); };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (editor && e.dataTransfer.files.length) void add(e.dataTransfer.files); }}
        className={`rounded-lg border-2 border-dashed p-4 ${drag ? "border-blue bg-blue-wash" : "border-rule"}`}
      >
        {editor && (
          <label className="btn btn-primary mb-4 cursor-pointer !min-h-10 text-sm">
            {t("رفع ملفات (أو اسحبها هنا)", "Upload files (or drop them here)")}
            <input type="file" multiple accept="image/*,application/pdf" className="sr-only" onChange={(e) => { if (e.target.files?.length) void add(e.target.files); e.target.value = ""; }} />
          </label>
        )}
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-6">
          {items.length === 0 && <li className="col-span-full p-10 text-center text-muted">{t("المكتبة فارغة.", "The library is empty.")}</li>}
          {items.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => { setSel(m); setAlt(m.alt ?? {}); }} className={`block w-full overflow-hidden rounded-md border-2 bg-paper-2 ${sel?.id === m.id ? "border-blue" : "border-transparent"}`}>
                {m.mime?.startsWith("image/") ? <img src={m.url} alt={m.alt?.ar ?? ""} loading="lazy" className="aspect-square w-full object-cover" /> : <span className="flex aspect-square items-center justify-center text-xs">PDF</span>}
              </button>
              {Object.keys(m.alt ?? {}).length === 0 && <p className="mt-1 text-[0.7rem] text-orange-text">{t("بدون نص بديل", "No alt text")}</p>}
            </li>
          ))}
        </ul>
      </div>
      <aside className="h-fit rounded-lg border border-rule bg-surface p-4 lg:sticky lg:top-24">
        {!sel ? (
          <p className="text-sm text-muted">{t("اختر ملفًا لتعديل النص البديل أو نسخ الرابط.", "Select a file to edit alt text or copy its URL.")}</p>
        ) : (
          <div className="grid gap-3 text-sm">
            {sel.mime?.startsWith("image/") && <img src={sel.url} alt="" className="w-full rounded" />}
            <p className="break-all text-xs text-faint" dir="ltr">{sel.path}{sel.width ? ` · ${sel.width}×${sel.height}` : ""}</p>
            <button type="button" className="btn btn-ghost !min-h-9 text-sm" onClick={() => { void navigator.clipboard.writeText(sel.url); show({ ok: true }, t("تم نسخ الرابط", "URL copied")); }}>{t("نسخ الرابط", "Copy URL")}</button>
            <div className="field">
              <span className="label !text-xs">{t("النص البديل لكل لغة (للوصولية ومحركات البحث)", "Alt text per language (accessibility & SEO)")}</span>
              <LangTabs value={alt} render={(c) => <input className="input" disabled={!editor} value={alt[c] ?? ""} onChange={(e) => setAlt({ ...alt, [c]: e.target.value })} />} />
            </div>
            {editor && (
              <>
                <button type="button" className="btn btn-primary !min-h-9 text-sm" disabled={pending} onClick={() => start(async () => { if (show(await updateMediaAlt(sel.id, alt))) setItems((x) => x.map((m) => (m.id === sel.id ? { ...m, alt } : m))); })}>{t("حفظ", "Save")}</button>
                <button type="button" className="text-xs text-danger" disabled={pending} onClick={() => start(async () => { if (confirm(t("حذف الملف نهائيًّا؟ قد تتعطل الصفحات التي تستخدمه.", "Delete this file permanently? Pages using it will lose the image.")) && show(await deleteMedia(sel.id), t("تم الحذف", "Deleted"))) { setItems((x) => x.filter((m) => m.id !== sel.id)); setSel(null); } })}>{t("حذف الملف", "Delete file")}</button>
              </>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
