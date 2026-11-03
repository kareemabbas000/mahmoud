"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import { registerMedia } from "@/app/actions/admin";
import { useAdmin, useResult } from "./AdminContext";

export type MediaRow = { id: string; url: string; path: string; mime: string | null; width: number | null; height: number | null; alt: Record<string, string>; created_at: string };

const imgSize = (file: File) =>
  new Promise<{ w: number | null; h: number | null }>((res) => {
    if (!file.type.startsWith("image/")) return res({ w: null, h: null });
    const i = new Image();
    i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight });
    i.onerror = () => res({ w: null, h: null });
    i.src = URL.createObjectURL(file);
  });

/** Uploads to the public `media` bucket (RLS: editor+) and registers each file in the media table. */
export function useUploader() {
  const { t, toast } = useAdmin();
  const show = useResult();
  return useCallback(
    async (files: FileList | File[]): Promise<MediaRow[]> => {
      const sb = browserClient();
      if (!sb) {
        toast("err", t("قاعدة البيانات غير متصلة.", "The database is not connected."));
        return [];
      }
      const out: MediaRow[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast("err", `${file.name}: ${t("الحد الأقصى 10 ميجابايت", "max 10 MB")}`);
          continue;
        }
        const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "") || "file";
        const d = new Date();
        const path = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID().slice(0, 8)}-${safe}`;
        const up = await sb.storage.from("media").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
        if (up.error) {
          toast("err", `${file.name}: ${up.error.message}`);
          continue;
        }
        const url = sb.storage.from("media").getPublicUrl(path).data.publicUrl;
        const { w, h } = await imgSize(file);
        const r = await registerMedia({ path, url, mime: file.type, size: file.size, width: w, height: h });
        if (show(r, "") && r.ok) out.push({ id: (r.data as { id: string }).id, url, path, mime: file.type, width: w, height: h, alt: {}, created_at: d.toISOString() });
      }
      if (out.length) toast("ok", t(`تم رفع ${out.length} ملف`, `${out.length} file(s) uploaded`));
      return out;
    },
    [t, toast, show],
  );
}

export function MediaPicker({ open, onClose, onPick, accept = "image/*" }: { open: boolean; onClose: () => void; onPick: (m: { url: string; width: number | null; height: number | null; alt: Record<string, string> }) => void; accept?: string }) {
  const { t } = useAdmin();
  const [items, setItems] = useState<MediaRow[]>([]);
  const [q, setQ] = useState("");
  const [url, setUrl] = useState("");
  const dlg = useRef<HTMLDialogElement>(null);
  const upload = useUploader();

  useEffect(() => {
    if (open) dlg.current?.showModal();
    else dlg.current?.close();
    if (!open) return;
    const sb = browserClient();
    sb?.from("media").select("id,url,path,mime,width,height,alt,created_at").order("created_at", { ascending: false }).limit(200).then(({ data }) => setItems((data ?? []) as MediaRow[]));
  }, [open]);

  const list = items.filter((m) => !q || m.path.includes(q.toLowerCase()) || Object.values(m.alt ?? {}).some((a) => a.includes(q)));
  return (
    <dialog ref={dlg} onClose={onClose} className="m-auto w-[min(60rem,95vw)] rounded-xl border border-rule bg-surface p-0 text-text shadow-soft backdrop:bg-deep/60">
      <div className="flex items-center justify-between gap-3 border-b border-rule p-4">
        <h2 className="font-semibold text-ink">{t("مكتبة الوسائط", "Media library")}</h2>
        <div className="flex items-center gap-2">
          <label className="btn btn-primary !min-h-9 cursor-pointer !px-4 text-sm">
            {t("رفع", "Upload")}
            <input type="file" multiple accept={accept} className="sr-only" onChange={async (e) => { if (e.target.files?.length) { const added = await upload(e.target.files); setItems((x) => [...added, ...x]); } e.target.value = ""; }} />
          </label>
          <button type="button" className="btn btn-ghost !min-h-9 !px-4 text-sm" onClick={onClose}>{t("إغلاق", "Close")}</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-rule p-4">
        <input className="input !min-h-10 max-w-xs" placeholder={t("بحث", "Search")} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-1 gap-2">
          <input className="input input-ltr !min-h-10" dir="ltr" placeholder={t("أو الصق رابطًا / مسارًا مثل /legacy/...", "Or paste a URL / path like /legacy/...")} value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="button" className="btn btn-ghost !min-h-10 text-sm" disabled={!url} onClick={() => { onPick({ url, width: null, height: null, alt: {} }); onClose(); }}>{t("استخدام", "Use")}</button>
        </div>
      </div>
      <ul className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto p-4 sm:grid-cols-5">
        {list.length === 0 && <li className="col-span-full p-8 text-center text-sm text-muted">{t("لا توجد ملفات بعد. ارفع أول صورة.", "No files yet. Upload your first image.")}</li>}
        {list.map((m) => (
          <li key={m.id}>
            <button type="button" className="group block w-full overflow-hidden rounded-md border border-rule bg-paper-2 focus-visible:outline-2" onClick={() => { onPick({ url: m.url, width: m.width, height: m.height, alt: m.alt ?? {} }); onClose(); }}>
              {m.mime?.startsWith("image/") ? <img src={m.url} alt={m.alt?.ar ?? m.alt?.en ?? ""} loading="lazy" className="aspect-square w-full object-cover transition-transform group-hover:scale-105" /> : <span className="flex aspect-square items-center justify-center text-xs text-muted">{m.path.split(".").pop()?.toUpperCase()}</span>}
            </button>
          </li>
        ))}
      </ul>
    </dialog>
  );
}
