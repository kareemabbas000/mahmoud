"use client";

/* eslint-disable @next/next/no-img-element */
import dynamic from "next/dynamic";
import { useState } from "react";
import type { Field } from "@/lib/admin/collections";
import { ICONS } from "@/lib/admin/collections";
import { Icon } from "@/components/ui/Icon";
import { LangTabs } from "./LangTabs";
import { MediaPicker } from "./MediaPicker";
import { useAdmin } from "./AdminContext";
import type { RichDoc } from "@/lib/types";
import { isVariantSet, variantUrl } from "@/lib/media";

const RichEditor = dynamic(() => import("./RichEditor").then((m) => m.RichEditor), { ssr: false, loading: () => <div className="min-h-48 animate-pulse rounded-md bg-paper-2" /> });

type LMap = Record<string, unknown>;

export function ImageInput({ value, onChange }: { value: string | null | undefined; onChange: (v: string | null) => void }) {
  const { t } = useAdmin();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-rule bg-paper-2">
        {value ? <img src={isVariantSet(value) ? variantUrl(value, 480) : value} alt="" className="size-full object-contain" /> : <Icon name="plus" className="text-faint" />}
      </div>
      <div className="grid min-w-0 flex-1 gap-2">
        <input className="input input-ltr !min-h-10 text-sm" dir="ltr" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} placeholder="/legacy/... or https://..." />
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost !min-h-9 !px-4 text-sm" onClick={() => setOpen(true)}>{t("مكتبة الوسائط", "Media library")}</button>
          {value && <button type="button" className="btn btn-ghost !min-h-9 !px-4 text-sm" onClick={() => onChange(null)}>{t("إزالة", "Remove")}</button>}
        </div>
      </div>
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(m) => onChange(m.url)} />
    </div>
  );
}

export function FieldEditor({ f, value, onChange }: { f: Field; value: unknown; onChange: (v: unknown) => void }) {
  const { t, locale } = useAdmin();
  const label = f.label[locale === "ar" ? 0 : 1];
  const help = "help" in f && f.help ? f.help[locale === "ar" ? 0 : 1] : null;
  const id = `fld-${f.key}`;
  const setL = (code: string, v: unknown) => onChange({ ...((value as LMap) ?? {}), [code]: v });
  let input: React.ReactNode;
  switch (f.type) {
    case "text":
    case "url":
    case "email":
    case "slug":
      input = <input id={id} className={`input ${f.type !== "text" ? "input-ltr" : ""}`} dir={f.type !== "text" ? "ltr" : undefined} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "textarea":
      input = <textarea id={id} className="input" rows={4} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "number":
      input = <input id={id} type="number" className="input input-ltr max-w-48" dir="ltr" value={value === null || value === undefined ? "" : String(value)} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "date":
      input = <input id={id} type="date" className="input input-ltr max-w-56" dir="ltr" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "boolean":
      return (
        <label className="flex items-center gap-3 rounded-md border border-rule bg-surface px-4 py-3">
          <input type="checkbox" className="size-4 accent-[var(--blue)]" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span className="text-sm font-medium text-ink">{label}</span>
        </label>
      );
    case "select":
      input = (
        <select id={id} className="input max-w-sm" value={String(value ?? f.options[0]?.value)} onChange={(e) => onChange(e.target.value)}>
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label[locale === "ar" ? 0 : 1]}</option>)}
        </select>
      );
      break;
    case "image":
      input = <ImageInput value={value as string} onChange={onChange} />;
      break;
    case "icon":
      input = (
        <div className="flex flex-wrap gap-2">
          {ICONS.map((n) => (
            <button key={n} type="button" onClick={() => onChange(n)} aria-pressed={value === n} title={n} className={`inline-flex size-11 items-center justify-center rounded-md border ${value === n ? "border-blue bg-blue-wash text-blue" : "border-rule text-muted hover:text-ink"}`}>
              <Icon name={n} size={20} />
            </button>
          ))}
        </div>
      );
      break;
    case "strings":
      input = <textarea id={id} className="input input-ltr" dir="ltr" rows={3} value={Array.isArray(value) ? (value as string[]).join("\n") : ""} onChange={(e) => onChange(e.target.value.split("\n"))} />;
      break;
    case "ltext":
      input = <LangTabs value={value as LMap} render={(c) => <input className="input" value={((value as LMap)?.[c] as string) ?? ""} onChange={(e) => setL(c, e.target.value)} />} />;
      break;
    case "ltextarea":
      input = <LangTabs value={value as LMap} render={(c) => <textarea className="input" rows={4} value={((value as LMap)?.[c] as string) ?? ""} onChange={(e) => setL(c, e.target.value)} />} />;
      break;
    case "llist":
      input = (
        <LangTabs
          value={value as LMap}
          render={(c) => (
            <>
              <textarea className="input" rows={4} value={(((value as LMap)?.[c] as string[]) ?? []).join("\n")} onChange={(e) => setL(c, e.target.value.split("\n"))} />
              <p className="field-hint">{t("عنصر في كل سطر", "One item per line")}</p>
            </>
          )}
        />
      );
      break;
    case "lrich":
      input = <LangTabs value={value as LMap} render={(c, dir) => <RichEditor key={c} dir={dir} value={(value as LMap)?.[c] as RichDoc} onChange={(d) => setL(c, d)} />} />;
      break;
    case "seo":
      input = <SeoEditor value={(value as Record<string, { title?: string; description?: string }>) ?? {}} onChange={onChange} />;
      break;
  }
  return (
    <div className="field">
      <label htmlFor={id} className="!text-sm">{label}{"required" in f && f.required && <span className="text-orange-text"> *</span>}</label>
      {input}
      {help && <p className="field-hint">{help}</p>}
    </div>
  );
}

/** Per-language SEO title/description with Google-length guidance and a snippet preview. */
export function SeoEditor({ value, onChange, extra }: { value: Record<string, { title?: string; description?: string; focus_keyword?: string }>; onChange: (v: unknown) => void; extra?: boolean }) {
  const { t } = useAdmin();
  return (
    <LangTabs
      value={value}
      isEmpty={(v) => !(v as { title?: string })?.title}
      render={(c) => {
        const v = value?.[c] ?? {};
        const set = (k: string, x: string) => onChange({ ...value, [c]: { ...v, [k]: x } });
        const tl = (v.title ?? "").length;
        const dl = (v.description ?? "").length;
        return (
          <div className="grid gap-3 rounded-md border border-rule bg-paper-2 p-4">
            <label className="field">
              <span className="label !text-xs">{t("عنوان الصفحة في نتائج البحث", "SEO title")} <span className={tl > 60 ? "text-danger" : "text-faint"}>{tl}/60</span></span>
              <input className="input" value={v.title ?? ""} onChange={(e) => set("title", e.target.value)} />
            </label>
            <label className="field">
              <span className="label !text-xs">{t("الوصف", "Meta description")} <span className={dl > 160 || (dl > 0 && dl < 70) ? "text-danger" : "text-faint"}>{dl}/160</span></span>
              <textarea className="input" rows={3} value={v.description ?? ""} onChange={(e) => set("description", e.target.value)} />
            </label>
            {extra && (
              <label className="field">
                <span className="label !text-xs">{t("الكلمة المفتاحية", "Focus keyword")}</span>
                <input className="input" value={v.focus_keyword ?? ""} onChange={(e) => set("focus_keyword", e.target.value)} />
              </label>
            )}
            <div className="rounded-md bg-surface p-3 text-sm">
              <p className="truncate text-[#1a0dab] dark:text-blue">{v.title || "—"}</p>
              <p className="text-xs text-success" dir="ltr">sco-eg.com › {c}</p>
              <p className="line-clamp-2 text-muted">{v.description || "—"}</p>
            </div>
          </div>
        );
      }}
    />
  );
}
