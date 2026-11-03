"use client";

import { useMemo, useState, useTransition } from "react";
import { saveString } from "@/app/actions/admin";
import { canEdit, useAdmin, useResult } from "./AdminContext";

type Row = { key: string; values: Record<string, string> };

export function TranslationsEditor({ initial }: { initial: Row[] }) {
  const { t, langs, role } = useAdmin();
  const show = useResult();
  const [rows, setRows] = useState(initial);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [missingOnly, setMissingOnly] = useState(false);
  const [group, setGroup] = useState("");
  const [pending, start] = useTransition();
  const [newKey, setNewKey] = useState("");
  const editor = canEdit(role, "editor");
  const enabled = langs.filter((l) => l.enabled);
  const groups = useMemo(() => [...new Set(rows.map((r) => r.key.split(".")[0]!))].sort(), [rows]);
  const missingCount = (r: Row) => enabled.filter((l) => !r.values[l.code]?.trim()).length;
  const totalMissing = rows.reduce((n, r) => n + missingCount(r), 0);
  const visible = rows.filter((r) => (!group || r.key.startsWith(group + ".")) && (!missingOnly || missingCount(r) > 0) && (!q || (r.key + " " + Object.values(r.values).join(" ")).toLowerCase().includes(q.toLowerCase())));
  const edit = (key: string, code: string, v: string) => {
    setRows((x) => x.map((r) => (r.key === key ? { ...r, values: { ...r.values, [code]: v } } : r)));
    setDirty((d) => new Set(d).add(key));
  };
  const saveAll = () =>
    start(async () => {
      for (const key of dirty) {
        const r = rows.find((x) => x.key === key)!;
        if (!show(await saveString(key, r.values), "")) return;
      }
      show({ ok: true }, t(`تم حفظ ${dirty.size} نص`, `${dirty.size} text(s) saved`));
      setDirty(new Set());
    });
  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 mb-4 flex flex-wrap items-center gap-2 border-b border-rule bg-paper px-4 py-3">
        <input className="input !min-h-10 max-w-xs" placeholder={t("ابحث في المفاتيح وكل اللغات…", "Search keys and all languages…")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input !min-h-10 max-w-40" value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="">{t("كل المجموعات", "All groups")}</option>
          {groups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} /> {t("الناقص فقط", "Missing only")} <span className="rounded-full bg-orange px-2 text-xs text-on-orange">{totalMissing}</span></label>
        {editor && <button type="button" className="btn btn-primary ms-auto !min-h-10 text-sm" disabled={!dirty.size || pending} onClick={saveAll}>{t("حفظ", "Save")} {dirty.size ? `(${dirty.size})` : ""}</button>}
      </div>
      <ul className="grid gap-3">
        {visible.map((r) => (
          <li key={r.key} className={`rounded-lg border bg-surface p-4 ${dirty.has(r.key) ? "border-orange" : "border-rule"}`}>
            <p className="mb-2 font-mono text-xs text-faint" dir="ltr">{r.key}</p>
            <div className="grid gap-2 md:grid-cols-2">
              {langs.map((l) => (
                <label key={l.code} className="grid gap-1 text-xs text-muted">
                  <span>{l.native_name} {!r.values[l.code]?.trim() && l.enabled && <span className="text-orange-text">●</span>}</span>
                  <textarea rows={(r.values[l.code]?.length ?? 0) > 80 ? 3 : 1} dir={l.dir} lang={l.code} disabled={!editor} className="input !min-h-10 text-sm" value={r.values[l.code] ?? ""} onChange={(e) => edit(r.key, l.code, e.target.value)} />
                </label>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {editor && (
        <div className="mt-6 flex gap-2">
          <input className="input input-ltr !min-h-10 max-w-xs" dir="ltr" placeholder="group.new_key" value={newKey} onChange={(e) => setNewKey(e.target.value.trim())} />
          <button type="button" className="btn btn-ghost !min-h-10 text-sm" disabled={!/^[a-z0-9_]+(\.[a-z0-9_]+)+$/.test(newKey) || rows.some((r) => r.key === newKey)} onClick={() => { setRows((x) => [{ key: newKey, values: {} }, ...x]); setDirty((d) => new Set(d).add(newKey)); setNewKey(""); }}>+ {t("مفتاح جديد", "New key")}</button>
        </div>
      )}
    </div>
  );
}
