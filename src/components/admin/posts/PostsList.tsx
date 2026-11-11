"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createPost, deletePost, duplicatePost, setPostStatus } from "@/app/actions/posts";
import { canEdit, useAdmin, useResult } from "../AdminContext";

export type PostRow = {
  id: string;
  title: Record<string, string>;
  slug: Record<string, string>;
  status: "draft" | "scheduled" | "published";
  publish_at: string | null;
  updated_at: string;
  category_id: string | null;
  cover: string | null;
  excerpt: Record<string, string>;
  seo: Record<string, { focus_keyword?: string }>;
  translation_status: Record<string, string>;
};

export function statusOf(p: Pick<PostRow, "status" | "publish_at">) {
  if (p.status === "draft") return "draft" as const;
  if (p.publish_at && new Date(p.publish_at) > new Date()) return "scheduled" as const;
  return "published" as const;
}

export function PostsList({ rows, cats }: { rows: PostRow[]; cats: { id: string; name: Record<string, string> }[] }) {
  const { t, locale, langs, role } = useAdmin();
  const show = useResult();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [st, setSt] = useState<"all" | "draft" | "scheduled" | "published">("all");
  const [cat, setCat] = useState("");
  const [pending, start] = useTransition();
  const editor = canEdit(role, "editor");
  const admin = canEdit(role, "admin");
  const fmt = (d: string | null) => (d ? new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d)) : "—");
  const title = (p: PostRow) => p.title?.[locale] || p.title?.ar || p.title?.en || t("بدون عنوان", "Untitled");
  const counts = useMemo(() => ({ all: rows.length, draft: rows.filter((r) => statusOf(r) === "draft").length, scheduled: rows.filter((r) => statusOf(r) === "scheduled").length, published: rows.filter((r) => statusOf(r) === "published").length }), [rows]);
  const list = rows.filter((r) => (st === "all" || statusOf(r) === st) && (!cat || r.category_id === cat) && (!q || JSON.stringify([r.title, r.slug, r.excerpt]).toLowerCase().includes(q.toLowerCase())));
  const chip = { draft: "bg-paper-2 text-muted", scheduled: "bg-[#fff4e5] text-[#9a4b00]", published: "bg-[#e5f6ec] text-[#0f7a4a]" };
  const label = { draft: t("مسودة", "Draft"), scheduled: t("مجدول", "Scheduled"), published: t("منشور", "Published") };

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        {editor && (
          <button
            type="button"
            disabled={pending}
            className="btn btn-primary !min-h-11"
            onClick={() =>
              start(async () => {
                const r = await createPost();
                if (show(r, "") && r.ok) router.push(`/admin/posts/${(r.data as { id: string }).id}`);
              })
            }
          >
            + {t("مقال جديد", "New post")}
          </button>
        )}
        <div className="flex flex-wrap gap-1 rounded-full bg-paper-2 p-1 text-sm">
          {(["all", "published", "scheduled", "draft"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setSt(k)} className={`rounded-full px-3.5 py-1.5 ${st === k ? "bg-surface font-semibold text-ink shadow-soft" : "text-muted hover:text-ink"}`}>
              {k === "all" ? t("الكل", "All") : label[k]} <span className="tnum text-faint">{counts[k]}</span>
            </button>
          ))}
        </div>
        {cats.length > 0 && (
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="ed-input !w-auto">
            <option value="">{t("كل التصنيفات", "All categories")}</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name?.[locale] || c.name?.ar || c.name?.en}</option>)}
          </select>
        )}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("بحث في العناوين والروابط…", "Search titles and slugs…")} className="ed-input ms-auto !w-64" />
      </div>

      {list.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-rule-strong bg-surface p-14 text-center">
          <p className="font-display text-xl text-ink">{rows.length ? t("لا نتائج مطابقة", "No matching posts") : t("لا توجد مقالات بعد", "No posts yet")}</p>
          <p className="mt-2 max-w-md text-sm text-muted">{t("ابدأ أول مقال: المحرر يحفظ مسودتك تلقائيًا ويقيّم جودة SEO أثناء الكتابة.", "Start your first post: the editor keeps a local backup as you type and scores your SEO live.")}</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-rule bg-surface">
          {list.map((p) => {
            const s = statusOf(p);
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-4 border-b border-rule px-4 py-3 last:border-b-0 hover:bg-paper-2/60">
                <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-paper-2">
                  {p.cover ? <img src={p.cover} alt="" className="size-full object-cover" /> : <span className="text-xs text-faint">—</span>}
                </span>
                <Link href={`/admin/posts/${p.id}`} className="min-w-0 flex-1 basis-[13rem]">
                  <span className="block truncate font-semibold text-ink hover:text-blue">{title(p)}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-faint">
                    <span className={`rounded-full px-2 py-0.5 font-medium ${chip[s]}`}>{label[s]}</span>
                    <span>{s === "draft" ? `${t("آخر تعديل", "Edited")} ${fmt(p.updated_at)}` : fmt(p.publish_at)}</span>
                    {p.seo?.[locale]?.focus_keyword && <span>· 🎯 {p.seo[locale]!.focus_keyword}</span>}
                    {langs.filter((l) => l.enabled).map((l) => (
                      <span key={l.code} className={`rounded px-1.5 ${p.title?.[l.code] ? "bg-blue-wash text-blue" : "bg-paper-2 text-faint line-through"}`} title={p.title?.[l.code] ? "" : t("ترجمة ناقصة", "Missing translation")}>
                        {l.code.toUpperCase()}
                      </span>
                    ))}
                  </span>
                </Link>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {s !== "draft" && p.slug?.[locale] && (
                    <a href={`/${locale}/insights/${p.slug[locale]}`} target="_blank" className="rounded-full border border-rule px-3 py-1.5 hover:bg-paper-2">{t("عرض", "View")} ↗</a>
                  )}
                  {editor && (
                    <>
                      <button type="button" className="rounded-full border border-rule px-3 py-1.5 hover:bg-paper-2" onClick={() => start(async () => { const r = await setPostStatus(p.id, s === "draft" ? "published" : "draft"); if (show(r, s === "draft" ? t("تم النشر", "Published") : t("أُعيد إلى المسودات", "Moved to drafts"))) router.refresh(); })}>
                        {s === "draft" ? t("نشر", "Publish") : t("إلغاء النشر", "Unpublish")}
                      </button>
                      <button type="button" className="rounded-full border border-rule px-3 py-1.5 hover:bg-paper-2" onClick={() => start(async () => { const r = await duplicatePost(p.id); if (show(r, t("تم إنشاء نسخة", "Duplicated")) && r.ok) router.push(`/admin/posts/${(r.data as { id: string }).id}`); })}>
                        {t("تكرار", "Duplicate")}
                      </button>
                    </>
                  )}
                  {admin && (
                    <button type="button" className="rounded-full border border-danger/30 px-3 py-1.5 text-danger hover:bg-danger/5" onClick={() => { if (confirm(t("حذف المقال نهائيًا؟", "Delete this post permanently?"))) start(async () => { if (show(await deletePost(p.id), t("تم الحذف", "Deleted"))) router.refresh(); }); }}>
                      {t("حذف", "Delete")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
