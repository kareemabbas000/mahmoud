"use client";

import { useState, useTransition } from "react";
import { saveLanguages, type LangRow } from "@/app/actions/admin";
import { canEdit, useAdmin, useResult } from "./AdminContext";

export function LanguagesEditor({ initial }: { initial: LangRow[] }) {
  const { t, role } = useAdmin();
  const show = useResult();
  const [rows, setRows] = useState(initial);
  const [pending, start] = useTransition();
  const admin = canEdit(role, "admin");
  const set = (i: number, patch: Partial<LangRow>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : patch.is_default ? { ...x, is_default: false } : x)));
  const move = (i: number, d: number) => setRows((r) => { const n = [...r]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x!); return n; });
  return (
    <div className="grid gap-4">
      <div className="overflow-x-auto rounded-lg border border-rule bg-surface">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="bg-paper-2 text-muted"><tr>{[t("الترتيب", "Order"), t("الرمز", "Code"), t("الاسم بالإنجليزية", "English name"), t("الاسم الأصلي", "Native name"), t("الاتجاه", "Direction"), t("مفعّلة", "Enabled"), t("الافتراضية", "Default")].map((h) => <th key={h} className="px-3 py-3 text-start font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((l, i) => (
              <tr key={i} className="border-t border-rule">
                <td className="px-3 py-2"><div className="flex gap-1"><button type="button" disabled={!admin || i === 0} onClick={() => move(i, -1)} className="px-2">↑</button><button type="button" disabled={!admin || i === rows.length - 1} onClick={() => move(i, 1)} className="px-2">↓</button></div></td>
                <td className="px-3 py-2"><input className="input input-ltr !min-h-9 w-20" dir="ltr" disabled={!admin || initial.some((x) => x.code === l.code)} value={l.code} onChange={(e) => set(i, { code: e.target.value.trim().toLowerCase() })} /></td>
                <td className="px-3 py-2"><input className="input !min-h-9" disabled={!admin} value={l.name} onChange={(e) => set(i, { name: e.target.value })} /></td>
                <td className="px-3 py-2"><input className="input !min-h-9" disabled={!admin} value={l.native_name} onChange={(e) => set(i, { native_name: e.target.value })} /></td>
                <td className="px-3 py-2"><select className="input !min-h-9" disabled={!admin} value={l.dir} onChange={(e) => set(i, { dir: e.target.value as "ltr" | "rtl" })}><option value="rtl">RTL</option><option value="ltr">LTR</option></select></td>
                <td className="px-3 py-2"><input type="checkbox" className="size-4" disabled={!admin || l.is_default} checked={l.enabled} onChange={(e) => set(i, { enabled: e.target.checked })} /></td>
                <td className="px-3 py-2"><input type="radio" name="default" className="size-4" disabled={!admin || !l.enabled} checked={l.is_default} onChange={() => set(i, { is_default: true })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {admin && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost !min-h-10 text-sm" onClick={() => setRows((r) => [...r, { code: "", name: "", native_name: "", dir: "ltr", enabled: false, is_default: false, sort: r.length + 1 }])}>+ {t("إضافة لغة", "Add language")}</button>
          <button type="button" className="btn btn-primary !min-h-10 text-sm" disabled={pending} onClick={() => start(async () => { show(await saveLanguages(rows), t("تم الحفظ — تحدّثت القوائم وخريطة الموقع وروابط hreflang", "Saved — menus, sitemap and hreflang updated")); })}>{t("حفظ", "Save")}</button>
        </div>
      )}
      <p className="text-sm text-muted">{t("اللغة المعطّلة تختفي من القوائم ومبدّل اللغة وخريطة الموقع وروابط hreflang، وتُحوَّل روابطها إلى اللغة الافتراضية. اللغة الجديدة تبدأ معطّلة حتى تكتمل ترجمتها.", "A disabled language disappears from menus, the language switcher, the sitemap and hreflang, and its URLs redirect to the default language. New languages start disabled until translated.")}</p>
    </div>
  );
}
