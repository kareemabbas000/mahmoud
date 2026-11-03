"use client";

import { useState, useTransition } from "react";
import { saveMenu } from "@/app/actions/admin";
import { canEdit, useAdmin, useResult } from "./AdminContext";
import { LangTabs } from "./LangTabs";
import type { MenuItem } from "@/lib/types";

function ItemEditor({ item, onChange, onRemove, onMove, depth }: { item: MenuItem; onChange: (i: MenuItem) => void; onRemove: () => void; onMove: (d: number) => void; depth: number }) {
  const { t } = useAdmin();
  return (
    <li className={`rounded-lg border border-rule bg-surface p-3 ${depth ? "ms-6" : ""}`}>
      <div className="grid gap-2 md:grid-cols-[1fr_14rem_auto]">
        <LangTabs value={item.label} render={(c) => <input className="input !min-h-9 text-sm" value={item.label[c] ?? ""} onChange={(e) => onChange({ ...item, label: { ...item.label, [c]: e.target.value } })} />} />
        <input className="input input-ltr !min-h-9 self-end text-sm" dir="ltr" value={item.href} onChange={(e) => onChange({ ...item, href: e.target.value })} placeholder="/services" />
        <div className="flex items-end gap-1 text-sm">
          <button type="button" onClick={() => onMove(-1)} className="px-2">↑</button>
          <button type="button" onClick={() => onMove(1)} className="px-2">↓</button>
          {depth === 0 && <button type="button" onClick={() => onChange({ ...item, children: [...(item.children ?? []), { id: crypto.randomUUID().slice(0, 8), label: {}, href: "/" }] })} className="px-2" title={t("عنصر فرعي", "Sub-item")}>+↳</button>}
          <button type="button" onClick={onRemove} className="px-2 text-danger">×</button>
        </div>
      </div>
      {item.children && item.children.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {item.children.map((c, i) => (
            <ItemEditor
              key={c.id}
              item={c}
              depth={1}
              onChange={(n) => onChange({ ...item, children: item.children!.map((x, j) => (j === i ? n : x)) })}
              onRemove={() => onChange({ ...item, children: item.children!.filter((_, j) => j !== i) })}
              onMove={(d) => { const a = [...item.children!]; const [x] = a.splice(i, 1); a.splice(Math.max(0, Math.min(a.length, i + d)), 0, x!); onChange({ ...item, children: a }); }}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function MenusEditor({ initial }: { initial: { location: "header" | "footer"; items: MenuItem[] }[] }) {
  const { t, role } = useAdmin();
  const show = useResult();
  const [menus, setMenus] = useState(initial);
  const [pending, start] = useTransition();
  const admin = canEdit(role, "admin");
  return (
    <div className="grid gap-10">
      {menus.map((m, mi) => {
        const setItems = (items: MenuItem[]) => setMenus((x) => x.map((y, j) => (j === mi ? { ...y, items } : y)));
        return (
          <section key={m.location}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-ink">{m.location === "header" ? t("قائمة الرأس", "Header menu") : t("روابط التذييل", "Footer links")}</h2>
              {admin && <button type="button" className="btn btn-primary !min-h-9 text-sm" disabled={pending} onClick={() => start(async () => { show(await saveMenu(m.location, m.items)); })}>{t("حفظ", "Save")}</button>}
            </div>
            <fieldset disabled={!admin}>
              <ul className="grid gap-2">
                {m.items.map((it, i) => (
                  <ItemEditor
                    key={it.id}
                    item={it}
                    depth={0}
                    onChange={(n) => setItems(m.items.map((x, j) => (j === i ? n : x)))}
                    onRemove={() => setItems(m.items.filter((_, j) => j !== i))}
                    onMove={(d) => { const a = [...m.items]; const [x] = a.splice(i, 1); a.splice(Math.max(0, Math.min(a.length, i + d)), 0, x!); setItems(a); }}
                  />
                ))}
              </ul>
              <button type="button" className="btn btn-ghost mt-3 !min-h-9 text-sm" onClick={() => setItems([...m.items, { id: crypto.randomUUID().slice(0, 8), label: {}, href: "/" }])}>+ {t("عنصر", "Item")}</button>
            </fieldset>
          </section>
        );
      })}
      <p className="text-sm text-muted">{t("الروابط الداخلية تبدأ بـ / بدون رمز اللغة (مثل /services) وتُضاف اللغة تلقائيًّا. إظهار/إخفاء أجزاء الرأس والتذييل وشريط الإعلان من «إعدادات الموقع».", "Internal links start with / without the language (e.g. /services); the language is added automatically. Header/footer parts and the announcement bar are switched in Site settings.")}</p>
    </div>
  );
}
