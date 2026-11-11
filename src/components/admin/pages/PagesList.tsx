"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createPage, deletePage, setPagePublished, type BlockIn } from "@/app/actions/pages";
import { canEdit, useAdmin, useResult } from "../AdminContext";

export type PageRow = { id: string; slug: string; kind: "system" | "custom"; title: Record<string, string>; published: boolean; draft_updated_at: string | null; updated_at: string; blocks: unknown[] };

const uid = (t: string) => `${t}-${Math.random().toString(36).slice(2, 8)}`;
const STARTERS: { key: string; label: [string, string]; blocks: () => BlockIn[] }[] = [
  { key: "blank", label: ["صفحة فارغة", "Blank page"], blocks: () => [{ id: uid("pageHeader"), type: "pageHeader", props: {} }] },
  { key: "article", label: ["صفحة محتوى", "Content page"], blocks: () => [{ id: uid("pageHeader"), type: "pageHeader", props: {} }, { id: uid("richText"), type: "richText", props: {} }, { id: uid("cta"), type: "cta", props: {} }] },
  { key: "landing", label: ["صفحة هبوط لخدمة", "Service landing page"], blocks: () => [{ id: uid("pageHeader"), type: "pageHeader", props: {} }, { id: uid("textMedia"), type: "textMedia", props: { media_side: "end" } }, { id: uid("cards"), type: "cards", props: { columns: "3", items: [] } }, { id: uid("process"), type: "process", props: { steps: [] } }, { id: uid("faq"), type: "faq", props: { limit: 6 } }, { id: uid("contact"), type: "contact", props: { show_map: true } }] },
];

export function PagesList({ rows, templates }: { rows: PageRow[]; templates: { id: string; name: Record<string, string>; blocks: unknown[] }[] }) {
  const { t, locale, role } = useAdmin();
  const show = useResult();
  const router = useRouter();
  const [pending, start] = useTransition();
  const dlg = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState({ ar: "", en: "", slug: "", start: "article" });
  const editor = canEdit(role, "editor");
  const admin = canEdit(role, "admin");
  const title = (r: PageRow) => r.title?.[locale] || r.title?.ar || r.title?.en || r.slug || "/";
  const home = rows.filter((r) => r.slug === "");
  const sys = rows.filter((r) => r.slug !== "" && r.kind === "system");
  const custom = rows.filter((r) => r.kind === "custom");
  const fmt = (d: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { dateStyle: "medium" }).format(new Date(d));

  const Row = ({ r }: { r: PageRow }) => (
    <li className="flex flex-wrap items-center gap-3 border-b border-rule px-4 py-3 last:border-b-0 hover:bg-paper-2/60">
      <Link href={`/admin/pages/${r.id}`} className="min-w-0 flex-1">
        <span className="block font-semibold text-ink hover:text-blue">{title(r)}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-faint">
          <span dir="ltr">/{locale}/{r.slug}</span>
          <span>· {(r.blocks?.length ?? 0)} {t("قسم", "sections")}</span>
          <span>· {t("آخر تحديث", "Updated")} {fmt(r.updated_at)}</span>
          {r.draft_updated_at && <span className="rounded-full bg-[#fff4e5] px-2 py-0.5 font-medium text-[#9a4b00]">{t("مسودة غير منشورة", "Unpublished draft")}</span>}
          {!r.published && <span className="rounded-full bg-paper-2 px-2 py-0.5 font-medium text-muted">{t("مخفية", "Hidden")}</span>}
        </span>
      </Link>
      <div className="flex flex-wrap gap-1.5 text-xs">
        {r.published && <a href={`/${locale}/${r.slug}`} target="_blank" className="rounded-full border border-rule px-3 py-1.5 hover:bg-paper-2">{t("عرض", "View")} ↗</a>}
        <Link href={`/admin/pages/${r.id}`} className="rounded-full bg-blue px-3 py-1.5 font-semibold text-white">{t("تحرير", "Edit")}</Link>
        {editor && r.slug !== "" && (
          <button type="button" className="rounded-full border border-rule px-3 py-1.5 hover:bg-paper-2" onClick={() => start(async () => { if (show(await setPagePublished(r.id, !r.published), r.published ? t("أُخفيت الصفحة", "Page hidden") : t("الصفحة ظاهرة", "Page visible"))) router.refresh(); })}>
            {r.published ? t("إخفاء", "Hide") : t("إظهار", "Show")}
          </button>
        )}
        {admin && r.kind === "custom" && (
          <button type="button" className="rounded-full border border-danger/30 px-3 py-1.5 text-danger hover:bg-danger/5" onClick={() => { if (confirm(t("حذف الصفحة نهائيًا؟", "Delete this page permanently?"))) start(async () => { if (show(await deletePage(r.id), t("تم الحذف", "Deleted"))) router.refresh(); }); }}>
            {t("حذف", "Delete")}
          </button>
        )}
      </div>
    </li>
  );

  return (
    <div className="grid gap-6">
      {editor && (
        <div>
          <button type="button" className="btn btn-primary !min-h-11" onClick={() => dlg.current?.showModal()}>+ {t("صفحة جديدة", "New page")}</button>
        </div>
      )}
      {[
        [t("الصفحة الرئيسية", "Home page"), home],
        [t("صفحات الموقع", "Site pages"), sys],
        [t("صفحات مخصّصة", "Custom pages"), custom],
      ].map(([label, list]) =>
        (list as PageRow[]).length ? (
          <section key={label as string}>
            <h2 className="mb-2 text-sm font-semibold text-muted">{label as string}</h2>
            <ul className="overflow-hidden rounded-2xl border border-rule bg-surface">{(list as PageRow[]).map((r) => <Row key={r.id} r={r} />)}</ul>
          </section>
        ) : null,
      )}

      <dialog ref={dlg} className="ed-dialog !w-[min(34rem,94vw)]">
        <form
          className="grid gap-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const tpl = templates.find((x) => x.id === form.start);
            const starter = STARTERS.find((s) => s.key === form.start);
            const blocks = tpl ? (tpl.blocks as BlockIn[]) : starter ? starter.blocks() : [];
            start(async () => {
              const r = await createPage({ slug: form.slug, title: { ar: form.ar, en: form.en }, blocks });
              if (show(r, t("تم إنشاء الصفحة", "Page created")) && r.ok) {
                dlg.current?.close();
                router.push(`/admin/pages/${(r.data as { id: string }).id}`);
              }
            });
          }}
        >
          <h2 className="font-display text-xl text-ink">{t("صفحة جديدة", "New page")}</h2>
          <label className="grid gap-1 text-sm"><span className="text-muted">{t("العنوان بالعربية", "Arabic title")}</span><input dir="rtl" required className="ed-input" value={form.ar} onChange={(e) => setForm({ ...form, ar: e.target.value })} /></label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">{t("العنوان بالإنجليزية", "English title")}</span>
            <input dir="ltr" className="ed-input" value={form.en} onChange={(e) => setForm({ ...form, en: e.target.value, slug: form.slug && form.slug !== slugOf(form.en) ? form.slug : slugOf(e.target.value) })} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">{t("رابط الصفحة (حروف إنجليزية صغيرة وشرطات)", "Page address (lowercase latin letters and hyphens)")}</span>
            <span className="flex items-center gap-1 rounded-xl border border-rule-strong bg-[var(--solid)] px-3" dir="ltr"><span className="text-faint">/{locale}/</span><input required className="min-h-10 flex-1 bg-transparent outline-none" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9/-]/g, "-") })} placeholder="tax-guide" /></span>
          </label>
          <fieldset className="grid gap-2 text-sm">
            <legend className="mb-1 text-muted">{t("ابدأ من", "Start from")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[...STARTERS.map((s) => ({ id: s.key, name: t(...s.label) })), ...templates.map((x) => ({ id: x.id, name: `★ ${x.name?.[locale] || x.name?.ar || x.name?.en}` }))].map((o) => (
                <label key={o.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 ${form.start === o.id ? "border-blue bg-blue-wash" : "border-rule"}`}>
                  <input type="radio" name="start" className="accent-[var(--blue)]" checked={form.start === o.id} onChange={() => setForm({ ...form, start: o.id })} />
                  {o.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <button disabled={pending} className="btn btn-primary !min-h-10 !px-5 text-sm">{t("إنشاء وفتح المحرر", "Create and open the builder")}</button>
            <button type="button" className="btn btn-ghost !min-h-10 !px-5 text-sm" onClick={() => dlg.current?.close()}>{t("إلغاء", "Cancel")}</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

function slugOf(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}
