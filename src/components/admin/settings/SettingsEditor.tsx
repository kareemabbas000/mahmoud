"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { saveSetting } from "@/app/actions/admin";
import { ImageInput } from "../Fields";
import { canEdit, useAdmin, useResult } from "../AdminContext";

type Obj = Record<string, unknown>;
type L = Record<string, string>;
type F =
  | { path: string; type: "text" | "email" | "url" | "tel"; label: [string, string]; help?: [string, string]; placeholder?: string; pattern?: string }
  | { path: string; type: "ltext" | "ltextarea"; label: [string, string]; help?: [string, string] }
  | { path: string; type: "number"; label: [string, string]; help?: [string, string] }
  | { path: string; type: "boolean"; label: [string, string]; help?: [string, string] }
  | { path: string; type: "image"; label: [string, string]; help?: [string, string] }
  | { path: string; type: "code"; label: [string, string]; help?: [string, string] }
  | { path: string; type: "select"; label: [string, string]; options: { value: string; label: [string, string] }[]; help?: [string, string] }
  | { path: string; type: "strings"; label: [string, string]; help?: [string, string]; placeholder?: string }
  | { path: string; type: "social"; label: [string, string] }
  | { path: string; type: "stats"; label: [string, string] };
export type Section = { key: string; label: [string, string]; intro?: [string, string]; fields: F[] };

const get = (o: Obj, path: string): unknown => path.split(".").reduce<unknown>((a, k) => (a && typeof a === "object" ? (a as Obj)[k] : undefined), o);
const setIn = (o: Obj, path: string, v: unknown): Obj => {
  const [k, ...rest] = path.split(".");
  return { ...o, [k!]: rest.length ? setIn(((o[k!] as Obj) ?? {}) as Obj, rest.join("."), v) : v };
};
const PLATFORMS = ["facebook", "linkedin", "instagram", "x", "youtube", "tiktok", "whatsapp"];

export function SettingsEditor({ settingKey, initial, sections }: { settingKey: "site" | "tracking"; initial: Obj; sections: Section[] }) {
  const { t, langs, role } = useAdmin();
  const show = useResult();
  const router = useRouter();
  const editable = canEdit(role, "admin");
  const [v, setV] = useState<Obj>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [tab, setTab] = useState(sections[0]!.key);
  const [lang, setLang] = useState(langs.find((l) => l.is_default)?.code ?? "ar");
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(v) !== saved;
  const sec = sections.find((s) => s.key === tab)!;
  const L = langs.find((l) => l.code === lang) ?? langs[0]!;
  const set = (path: string, val: unknown) => setV((o) => setIn(o, path, val));
  const save = () =>
    start(async () => {
      if (show(await saveSetting(settingKey, v), t("تم الحفظ — التغييرات على الموقع الآن", "Saved — live on the site now"))) {
        setSaved(JSON.stringify(v));
        router.refresh();
      }
    });
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && editable) save();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });
  const hasL = sec.fields.some((f) => f.type === "ltext" || f.type === "ltextarea" || f.type === "stats");

  const field = (f: F) => {
    const val = get(v, f.path);
    const wrap = (node: React.ReactNode) => (
      <div key={f.path} className="grid gap-1.5">
        {f.type !== "boolean" && <span className="text-sm font-semibold text-ink">{t(...f.label)}</span>}
        {node}
        {"help" in f && f.help && <span className="text-xs text-muted">{t(...f.help)}</span>}
      </div>
    );
    switch (f.type) {
      case "text":
      case "email":
      case "url":
      case "tel":
        return wrap(<input dir="ltr" type={f.type === "text" ? "text" : f.type} className="ed-input" value={String(val ?? "")} placeholder={f.placeholder} pattern={f.pattern} onChange={(e) => set(f.path, e.target.value)} />);
      case "ltext":
        return wrap(<input dir={L.dir} className="ed-input" value={(val as L | undefined)?.[lang] ?? ""} onChange={(e) => set(f.path, { ...((val as L) ?? {}), [lang]: e.target.value })} />);
      case "ltextarea":
        return wrap(<textarea dir={L.dir} className="ed-input min-h-24" value={(val as L | undefined)?.[lang] ?? ""} onChange={(e) => set(f.path, { ...((val as L) ?? {}), [lang]: e.target.value })} />);
      case "number":
        return wrap(<input dir="ltr" type="number" className="ed-input !w-40" value={val === null || val === undefined ? "" : String(val)} onChange={(e) => set(f.path, e.target.value === "" ? null : Number(e.target.value))} />);
      case "boolean":
        return wrap(
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-rule px-4 py-3">
            <span className="text-sm text-ink">{t(...f.label)}</span>
            <span className={`pb-switch ${val ? "is-on" : ""}`}><input type="checkbox" className="sr-only" checked={Boolean(val)} onChange={(e) => set(f.path, e.target.checked)} /><span /></span>
          </label>,
        );
      case "image":
        return wrap(<ImageInput value={(val as string) ?? null} onChange={(x) => set(f.path, x)} />);
      case "code":
        return wrap(<textarea dir="ltr" spellCheck={false} className="ed-input min-h-32 font-mono text-xs" value={String(val ?? "")} onChange={(e) => set(f.path, e.target.value)} />);
      case "select":
        return wrap(
          <div className="flex flex-wrap gap-1.5">
            {f.options.map((o) => (
              <button key={o.value} type="button" onClick={() => set(f.path, o.value)} className={`rounded-full px-4 py-1.5 text-sm ${String(val) === o.value ? "bg-ink text-paper" : "bg-paper-2 text-muted hover:text-ink"}`}>{t(...o.label)}</button>
            ))}
          </div>,
        );
      case "strings": {
        const arr = (Array.isArray(val) ? val : []) as string[];
        return wrap(
          <div className="grid gap-2">
            {arr.map((x, i) => (
              <div key={i} className="flex gap-2">
                <input dir="ltr" className="ed-input" value={x} placeholder={f.placeholder} onChange={(e) => set(f.path, arr.map((y, k) => (k === i ? e.target.value : y)))} />
                <button type="button" className="px-2 text-faint hover:text-danger" onClick={() => set(f.path, arr.filter((_, k) => k !== i))}>×</button>
              </div>
            ))}
            <button type="button" className="justify-self-start text-sm text-blue" onClick={() => set(f.path, [...arr, ""])}>+ {t("إضافة", "Add")}</button>
          </div>,
        );
      }
      case "social": {
        const arr = (Array.isArray(val) ? val : []) as { platform: string; url: string; enabled: boolean }[];
        return wrap(
          <div className="grid gap-2">
            {arr.map((s, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-rule p-2">
                <select className="ed-input !w-36" value={s.platform} onChange={(e) => set(f.path, arr.map((y, k) => (k === i ? { ...y, platform: e.target.value } : y)))}>
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input dir="ltr" className="ed-input min-w-48 flex-1" value={s.url} placeholder="https://" onChange={(e) => set(f.path, arr.map((y, k) => (k === i ? { ...y, url: e.target.value } : y)))} />
                <label className="flex items-center gap-1.5 text-xs text-muted"><input type="checkbox" className="accent-[var(--blue)]" checked={s.enabled} onChange={(e) => set(f.path, arr.map((y, k) => (k === i ? { ...y, enabled: e.target.checked } : y)))} />{t("ظاهر", "Shown")}</label>
                <button type="button" className="px-2 text-faint hover:text-danger" onClick={() => set(f.path, arr.filter((_, k) => k !== i))}>×</button>
              </div>
            ))}
            <button type="button" className="justify-self-start text-sm text-blue" onClick={() => set(f.path, [...arr, { platform: "linkedin", url: "", enabled: true }])}>+ {t("إضافة حساب", "Add an account")}</button>
          </div>,
        );
      }
      case "stats": {
        const items = (Array.isArray(val) ? val : []) as { key: string; value: number | null; label: L; auto_years?: boolean }[];
        return wrap(
          <div className="grid gap-2">
            {items.map((it, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-rule p-3 sm:grid-cols-[1fr_8rem_auto]">
                <input dir={L.dir} className="ed-input" value={it.label?.[lang] ?? ""} placeholder={t("الوصف (مثل: عميل)", "Label (e.g. clients)")} onChange={(e) => set(f.path, items.map((y, k) => (k === i ? { ...y, label: { ...(y.label ?? {}), [lang]: e.target.value } } : y)))} />
                {it.auto_years ? (
                  <span className="grid place-items-center rounded-xl bg-paper-2 px-2 text-xs text-muted">{t("يُحسب تلقائيًا", "Calculated")}</span>
                ) : (
                  <input dir="ltr" type="number" className="ed-input" value={it.value ?? ""} placeholder={t("الرقم", "Number")} onChange={(e) => set(f.path, items.map((y, k) => (k === i ? { ...y, value: e.target.value === "" ? null : Number(e.target.value) } : y)))} />
                )}
                <button type="button" className="px-2 text-faint hover:text-danger" onClick={() => set(f.path, items.filter((_, k) => k !== i))}>×</button>
              </div>
            ))}
            <button type="button" className="justify-self-start text-sm text-blue" onClick={() => set(f.path, [...items, { key: `n${Date.now().toString(36)}`, value: null, label: {} }])}>+ {t("إضافة رقم", "Add a figure")}</button>
            <span className="text-xs text-muted">{t("لا تُعرض إلا الأرقام الموثّقة. الرقم الفارغ لا يظهر.", "Only documented figures are shown. Empty numbers are hidden.")}</span>
          </div>,
        );
      }
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-rule bg-[var(--solid)] p-1.5 lg:sticky lg:top-6 lg:grid">
        {sections.map((s) => (
          <button key={s.key} type="button" onClick={() => setTab(s.key)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-start text-sm ${tab === s.key ? "bg-blue-wash font-semibold text-blue" : "text-text hover:bg-paper-2"}`}>{t(...s.label)}</button>
        ))}
      </nav>
      <section className="rounded-2xl border border-rule bg-[var(--solid)] p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-ink">{t(...sec.label)}</h2>
            {sec.intro && <p className="mt-1 max-w-xl text-sm text-muted">{t(...sec.intro)}</p>}
          </div>
          {hasL && (
            <div className="pe-langs">
              {langs.filter((l) => l.enabled).map((l) => <button key={l.code} type="button" className={lang === l.code ? "is-on" : ""} onClick={() => setLang(l.code)}>{l.native_name}</button>)}
            </div>
          )}
        </div>
        <fieldset disabled={!editable} className="grid gap-5">{sec.fields.map(field)}</fieldset>
      </section>
      {editable && (
        <div className={`pb-savebar ${dirty ? "is-on" : ""}`}>
          <span className="text-sm">{t("لديك تغييرات غير محفوظة", "You have unsaved changes")}</span>
          <button type="button" className="text-sm text-paper/70 hover:text-paper" onClick={() => setV(JSON.parse(saved))}>{t("تراجع", "Revert")}</button>
          <button type="button" disabled={pending} className="btn btn-accent !min-h-10 !px-5 text-sm" onClick={save}>{pending ? t("جارٍ الحفظ…", "Saving…") : t("حفظ التغييرات", "Save changes")}</button>
        </div>
      )}
    </div>
  );
}
