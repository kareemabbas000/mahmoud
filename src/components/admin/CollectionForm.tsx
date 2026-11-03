"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteItem, saveItem } from "@/app/actions/admin";
import { getCollection } from "@/lib/admin/collections";
import { FieldEditor } from "./Fields";
import { canEdit, useAdmin, useResult } from "./AdminContext";

export function CollectionForm({ collectionKey, id, initial, viewHref }: { collectionKey: string; id: string | null; initial: Record<string, unknown>; viewHref?: string | null }) {
  const c = getCollection(collectionKey)!;
  const { t, role, locale } = useAdmin();
  const show = useResult();
  const router = useRouter();
  const [row, setRow] = useState<Record<string, unknown>>(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const editable = canEdit(role, c.min);
  const set = (k: string, v: unknown) => {
    setRow((r) => ({ ...r, [k]: v }));
    setDirty(true);
  };
  const save = () =>
    start(async () => {
      const r = await saveItem(collectionKey, id, row);
      if (show(r, t("تم الحفظ — التغييرات على الموقع الآن", "Saved — live on the site now")) && r.ok) {
        setDirty(false);
        if (!id) router.replace(`/admin/c/${collectionKey}/${(r.data as { id: string }).id}`);
        else router.refresh();
      }
    });
  const remove = () =>
    start(async () => {
      if (!confirm(t("حذف هذا العنصر نهائيًّا؟", "Delete this item permanently?"))) return;
      const r = await deleteItem(collectionKey, id!);
      if (show(r, t("تم الحذف", "Deleted"))) router.replace(`/admin/c/${collectionKey}`);
    });
  const side = c.fields.filter((f) => ["published", "sort", "featured", "has_profile", "is_primary", "enabled", "kind", "icon", "status", "group_key"].includes(f.key));
  const main = c.fields.filter((f) => !side.includes(f));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="grid gap-8 lg:grid-cols-[1fr_20rem]"
    >
      <fieldset disabled={!editable} className="grid gap-6">
        {main.map((f) => <FieldEditor key={f.key} f={f} value={row[f.key]} onChange={(v) => set(f.key, v)} />)}
      </fieldset>
      <aside className="grid content-start gap-4 lg:sticky lg:top-24">
        <div className="grid gap-3 rounded-lg border border-rule bg-surface p-4">
          <button className="btn btn-primary w-full" disabled={!editable || pending || (!dirty && Boolean(id))}>{pending ? t("جارٍ الحفظ…", "Saving…") : id ? t("حفظ ونشر", "Save & publish") : t("إنشاء", "Create")}</button>
          {dirty && <p className="text-center text-xs text-orange-text">{t("لديك تغييرات غير محفوظة", "You have unsaved changes")}</p>}
          {viewHref && <Link href={`/${locale}${viewHref}`} target="_blank" className="btn btn-ghost w-full text-sm">{t("عرض على الموقع ↗", "View on site ↗")}</Link>}
        </div>
        <fieldset disabled={!editable} className="grid gap-3 rounded-lg border border-rule bg-surface p-4">
          {side.map((f) => <FieldEditor key={f.key} f={f} value={row[f.key]} onChange={(v) => set(f.key, v)} />)}
        </fieldset>
        {id && canEdit(role, "admin") && (
          <button type="button" onClick={remove} className="btn w-full border border-danger/40 text-sm text-danger hover:bg-danger/10" disabled={pending}>
            {t("حذف", "Delete")}
          </button>
        )}
        {!editable && <p className="rounded-md bg-paper-2 p-3 text-sm text-muted">{t("صلاحية المشاهدة فقط.", "View-only access.")}</p>}
      </aside>
    </form>
  );
}
