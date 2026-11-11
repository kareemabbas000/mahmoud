"use client";

import { useState } from "react";
import { ImageInput } from "../Fields";
import { ProEditor } from "../editor/ProEditor";
import { useAdmin } from "../AdminContext";
import { Icon } from "@/components/ui/Icon";
import { ICONS } from "@/lib/admin/collections";
import type { BField } from "@/lib/admin/blocks";
import type { RichDoc } from "@/lib/types";

type Obj = Record<string, unknown>;
type L = Record<string, string>;

function Label({ f, missing, children }: { f: BField; missing?: string[]; children: React.ReactNode }) {
  const { t } = useAdmin();
  return (
    <div className="grid gap-1.5">
      <span className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink">
        {t(...f.label)}
        {missing && missing.length > 0 && <span className="rounded-full bg-[#fff4e5] px-2 py-0.5 text-[0.65rem] font-medium text-[#9a4b00]">{t("ينقص", "missing")}: {missing.join("، ")}</span>}
      </span>
      {children}
      {"help" in f && f.help && <span className="text-[0.72rem] text-muted">{t(...f.help)}</span>}
    </div>
  );
}

function Field({ f, value, onChange, lang, dir }: { f: BField; value: unknown; onChange: (v: unknown) => void; lang: string; dir: "ltr" | "rtl" }) {
  const { t, langs } = useAdmin();
  const others = langs.filter((l) => l.enabled && l.code !== lang);
  const lv = (value ?? {}) as L;
  const missing = (f.type === "ltext" || f.type === "ltextarea") && Object.values(lv).some(Boolean) ? others.filter((l) => !lv[l.code]).map((l) => l.native_name) : undefined;

  switch (f.type) {
    case "ltext":
      return <Label f={f} missing={missing}><input dir={dir} className="ed-input" value={lv[lang] ?? ""} onChange={(e) => onChange({ ...lv, [lang]: e.target.value })} /></Label>;
    case "ltextarea":
      return <Label f={f} missing={missing}><textarea dir={dir} className="ed-input min-h-24" value={lv[lang] ?? ""} onChange={(e) => onChange({ ...lv, [lang]: e.target.value })} /></Label>;
    case "lrich": {
      const docs = (value ?? {}) as Record<string, RichDoc>;
      return <Label f={f}><ProEditor key={lang} value={docs[lang]} onChange={(d) => onChange({ ...docs, [lang]: d })} dir={dir} lang={lang} minHeight="16rem" /></Label>;
    }
    case "lstrings": {
      const items = (Array.isArray(value) ? value : []) as L[];
      return (
        <Label f={f}>
          <div className="grid gap-2">
            {items.map((it, i) => (
              <div key={i} className="flex gap-2">
                <input dir={dir} className="ed-input" value={it?.[lang] ?? ""} onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, [lang]: e.target.value } : x)))} />
                <button type="button" className="px-2 text-faint hover:text-danger" aria-label={t("حذف", "Remove")} onClick={() => onChange(items.filter((_, k) => k !== i))}>×</button>
              </div>
            ))}
            <button type="button" className="justify-self-start text-sm text-blue" onClick={() => onChange([...items, {}])}>+ {t("إضافة نقطة", "Add a point")}</button>
          </div>
        </Label>
      );
    }
    case "text":
    case "url":
      return <Label f={f}><input dir="ltr" className="ed-input" value={String(value ?? "")} placeholder={"placeholder" in f ? f.placeholder : f.type === "url" ? "https://" : ""} onChange={(e) => onChange(e.target.value)} /></Label>;
    case "image":
      return <Label f={f}><ImageInput value={(value as string) ?? null} onChange={(v) => onChange(v)} /></Label>;
    case "icon":
      return (
        <Label f={f}>
          <div className="flex flex-wrap gap-1.5">
            {ICONS.map((ic) => (
              <button key={ic} type="button" title={ic} onClick={() => onChange(ic)} className={`grid size-10 place-items-center rounded-xl border ${value === ic ? "border-blue bg-blue-wash text-blue" : "border-rule text-muted hover:text-ink"}`}>
                <Icon name={ic} size={20} />
              </button>
            ))}
          </div>
        </Label>
      );
    case "number":
      return <Label f={f}><input type="number" dir="ltr" className="ed-input !w-40" min={f.min} max={f.max} value={value === undefined || value === null ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} /></Label>;
    case "boolean":
      return (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-rule px-3 py-2.5 text-sm text-ink">
          <input type="checkbox" className="size-4 accent-[var(--blue)]" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          {t(...f.label)}
        </label>
      );
    case "select":
      return (
        <Label f={f}>
          <div className="flex flex-wrap gap-1.5">
            {f.options.map((o) => (
              <button key={o.value} type="button" onClick={() => onChange(o.value)} className={`rounded-full px-3.5 py-1.5 text-sm ${String(value ?? f.options[0]!.value) === o.value ? "bg-ink text-paper" : "bg-paper-2 text-muted hover:text-ink"}`}>
                {t(...o.label)}
              </button>
            ))}
          </div>
        </Label>
      );
    case "link": {
      const lk = (value ?? {}) as { label?: L; href?: string };
      const wa = f.allowWhatsapp && lk.href === "whatsapp";
      return (
        <Label f={f}>
          <div className="grid gap-2 rounded-xl border border-rule p-3">
            <input dir={dir} className="ed-input" placeholder={t("نص الرابط", "Link text")} value={lk.label?.[lang] ?? ""} onChange={(e) => onChange({ ...lk, label: { ...(lk.label ?? {}), [lang]: e.target.value } })} />
            {!wa && <input dir="ltr" className="ed-input" placeholder="/contact" value={lk.href ?? ""} onChange={(e) => onChange({ ...lk, href: e.target.value })} />}
            {f.allowWhatsapp && (
              <label className="flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" className="accent-[var(--blue)]" checked={Boolean(wa)} onChange={(e) => onChange({ ...lk, href: e.target.checked ? "whatsapp" : "/contact" })} />
                {t("يفتح محادثة واتساب", "Opens a WhatsApp chat")}
              </label>
            )}
            {(lk.label || lk.href) && <button type="button" className="justify-self-start text-xs text-danger" onClick={() => onChange(undefined)}>{t("إزالة الرابط", "Remove link")}</button>}
          </div>
        </Label>
      );
    }
    case "list":
      return <ListField f={f} value={value} onChange={onChange} lang={lang} dir={dir} />;
  }
}

function ListField({ f, value, onChange, lang, dir }: { f: Extract<BField, { type: "list" }>; value: unknown; onChange: (v: unknown) => void; lang: string; dir: "ltr" | "rtl" }) {
  const { t } = useAdmin();
  const items = (Array.isArray(value) ? value : []) as Obj[];
  const [open, setOpen] = useState<number | null>(items.length ? null : null);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
    setOpen(j);
  };
  const titleOf = (it: Obj, i: number) => {
    const v = f.titleKey ? (it[f.titleKey] as L | undefined)?.[lang] : undefined;
    return v || `${t(...f.itemLabel)} ${i + 1}`;
  };
  return (
    <Label f={f}>
      <div className="grid gap-2">
        {items.map((it, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-rule">
            <div className="flex items-center gap-1 bg-paper-2 px-2 py-1.5">
              <button type="button" className="min-w-0 flex-1 truncate px-1 text-start text-sm font-medium text-ink" onClick={() => setOpen(open === i ? null : i)}>
                <span className="me-2 text-faint">{open === i ? "▾" : "▸"}</span>
                {titleOf(it, i)}
              </button>
              <button type="button" className="px-1.5 text-faint hover:text-ink" aria-label="↑" onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="px-1.5 text-faint hover:text-ink" aria-label="↓" onClick={() => move(i, 1)}>↓</button>
              <button type="button" className="px-1.5 text-faint hover:text-danger" aria-label={t("حذف", "Remove")} onClick={() => onChange(items.filter((_, k) => k !== i))}>×</button>
            </div>
            {open === i && (
              <div className="grid gap-3 p-3">
                {f.item.map((sf) => (
                  <Field key={sf.key} f={sf} value={it[sf.key]} lang={lang} dir={dir} onChange={(v) => onChange(items.map((x, k) => (k === i ? { ...x, [sf.key]: v } : x)))} />
                ))}
              </div>
            )}
          </div>
        ))}
        <button type="button" className="rounded-xl border border-dashed border-rule-strong py-2 text-sm text-blue hover:bg-blue-wash" onClick={() => { onChange([...items, {}]); setOpen(items.length); }}>
          + {t("إضافة", "Add")} {t(...f.itemLabel)}
        </button>
      </div>
    </Label>
  );
}

export function BlockForm({ fields, props, onChange, lang, dir }: { fields: BField[]; props: Obj; onChange: (p: Obj) => void; lang: string; dir: "ltr" | "rtl" }) {
  return (
    <div className="grid gap-4">
      {fields.map((f) => (
        <Field key={f.key} f={f} value={props[f.key]} lang={lang} dir={dir} onChange={(v) => onChange({ ...props, [f.key]: v })} />
      ))}
    </div>
  );
}
