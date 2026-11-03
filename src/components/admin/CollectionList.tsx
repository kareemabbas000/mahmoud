"use client";
/* eslint-disable react-hooks/refs -- dnd-kit useSortable returns ref callbacks/listeners by design */

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderItems, togglePublished } from "@/app/actions/admin";
import { getCollection } from "@/lib/admin/collections";
import { Icon } from "@/components/ui/Icon";
import { canEdit, useAdmin, useResult } from "./AdminContext";

type Row = Record<string, unknown> & { id: string };

function titleOf(v: unknown, locale: string): string {
  if (!v) return "—";
  if (typeof v === "string") return v;
  const o = v as Record<string, string>;
  return o[locale] || o.ar || o.en || Object.values(o)[0] || "—";
}

function Item({ row, ck, sortable }: { row: Row; ck: string; sortable: boolean }) {
  const c = getCollection(ck)!;
  const { locale, role, langs, t } = useAdmin();
  const show = useResult();
  const [pub, setPub] = useState(Boolean(row.published));
  const [, start] = useTransition();
  const s = useSortable({ id: row.id, disabled: !sortable });
  const missing = langs.filter((l) => l.enabled && !((row[c.title] as Record<string, string>)?.[l.code])).map((l) => l.native_name);
  const thumb = (row.logo ?? row.photo ?? row.image) as string | undefined;
  return (
    <li ref={s.setNodeRef} style={{ transform: CSS.Transform.toString(s.transform), transition: s.transition }} className={`flex items-center gap-3 border-b border-rule bg-surface px-3 py-2.5 ${s.isDragging ? "relative z-10 shadow-soft" : ""}`}>
      {sortable && (
        <button type="button" className="cursor-grab touch-none p-1 text-faint hover:text-ink" aria-label={t("اسحب لإعادة الترتيب", "Drag to reorder")} {...s.attributes} {...s.listeners}>
          ⋮⋮
        </button>
      )}
      {thumb !== undefined && <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded bg-paper-2">{thumb ? <img src={thumb} alt="" className="size-full object-contain" /> : null}</span>}
      {"icon" in row && <Icon name={String(row.icon)} size={20} className="shrink-0 text-blue" />}
      <Link href={`/admin/c/${ck}/${row.id}`} className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink hover:text-blue">{titleOf(row[c.title], locale)}</span>
        <span className="block truncate text-xs text-faint">
          {[row.slug, row.kind, row.reference, row.group_key, row.destination].filter(Boolean).join(" · ")}
          {missing.length > 0 && <span className="ms-2 text-orange-text">● {t("ينقص:", "missing:")} {missing.join(", ")}</span>}
        </span>
      </Link>
      {"published" in row && (
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            className="size-4 accent-[var(--blue)]"
            checked={pub}
            disabled={!canEdit(role, c.min)}
            onChange={(e) => {
              const v = e.target.checked;
              setPub(v);
              start(async () => {
                if (!show(await togglePublished(ck, row.id, v), v ? t("تم النشر", "Published") : t("تم الإخفاء", "Unpublished"))) setPub(!v);
              });
            }}
          />
          {t("منشور", "Live")}
        </label>
      )}
    </li>
  );
}

export function CollectionList({ ck, rows: initial }: { ck: string; rows: Row[] }) {
  const c = getCollection(ck)!;
  const { locale, role, t } = useAdmin();
  const show = useResult();
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const sortable = Boolean(c.sort) && !q && !filter && canEdit(role, c.min);
  const visible = useMemo(
    () => rows.filter((r) => (!filter || r[c.filters?.key ?? ""] === filter) && (!q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))),
    [rows, q, filter, c.filters],
  );
  const onEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = rows.findIndex((r) => r.id === e.active.id);
    const to = rows.findIndex((r) => r.id === e.over!.id);
    const next = arrayMove(rows, from, to);
    setRows(next);
    if (!show(await reorderItems(ck, next.map((r) => r.id)), t("تم حفظ الترتيب", "Order saved"))) setRows(rows);
  };
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input className="input !min-h-10 max-w-xs" placeholder={t("بحث…", "Search…")} value={q} onChange={(e) => setQ(e.target.value)} />
        {c.filters && (
          <select className="input !min-h-10 max-w-48" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">{t("الكل", "All")}</option>
            {c.filters.options.map((o) => <option key={o.value} value={o.value}>{o.label[locale === "ar" ? 0 : 1]}</option>)}
          </select>
        )}
        <span className="text-sm text-faint">{visible.length}</span>
        {canEdit(role, c.min) && <Link href={`/admin/c/${ck}/new`} className="btn btn-primary ms-auto !min-h-10 text-sm">+ {t("إضافة", "Add")}</Link>}
      </div>
      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-rule p-10 text-center text-muted">{t("لا توجد عناصر.", "Nothing here yet.")}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
          <SortableContext items={visible.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <ul className="overflow-hidden rounded-lg border border-rule">
              {visible.map((r) => <Item key={r.id} row={r} ck={ck} sortable={sortable} />)}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
