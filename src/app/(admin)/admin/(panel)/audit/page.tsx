import Link from "next/link";
import { requirePage } from "@/lib/admin/auth";
import { getAdminT, bi } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { PageTitle, Forbidden } from "@/components/admin/PageTitle";

export const dynamic = "force-dynamic";

const ENTITY: Record<string, [string, string]> = {
  pages: ["صفحة", "Page"], posts: ["مقال", "Post"], services: ["خدمة", "Service"], team_members: ["عضو فريق", "Team member"], clients: ["عميل", "Client"], certificates: ["اعتماد", "Credential"],
  branches: ["فرع", "Branch"], faqs: ["سؤال", "FAQ"], gallery_items: ["صورة معرض", "Gallery item"], settings: ["إعدادات", "Settings"], menus: ["قائمة", "Menu"], languages: ["لغة", "Language"],
  ui_strings: ["نص واجهة", "UI text"], redirects: ["تحويل", "Redirect"], profiles: ["مستخدم", "User"], invitations: ["دعوة", "Invitation"], media: ["ملف وسائط", "Media"], enquiries: ["طلب", "Enquiry"],
  post_categories: ["تصنيف", "Category"], post_tags: ["وسم", "Tag"], authors: ["كاتب", "Author"], newsletter_subscribers: ["مشترك", "Subscriber"],
};
const ACTION: Record<string, [string, string, string]> = { insert: ["أضاف", "created", "#0f7a4a"], update: ["عدّل", "updated", "#2b2ff5"], delete: ["حذف", "deleted", "#b42318"] };
const PAGE = 50;

function brief(v: unknown): string {
  if (v === null || v === undefined) return "∅";
  if (typeof v === "string") return v.length > 80 ? `${v.slice(0, 80)}…` : v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  const s = JSON.stringify(v);
  return s.length > 80 ? `${s.slice(0, 80)}…` : s;
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ p?: string; entity?: string; who?: string }> }) {
  const { allowed } = await requirePage("admin");
  const { locale } = await getAdminT();
  if (!allowed) return <Forbidden ar={locale === "ar"} />;
  const sp = await searchParams;
  const page = Math.max(0, Number(sp.p ?? 0) || 0);
  const sb = (await sessionClient())!;
  let q = sb.from("audit_log").select("id,at,actor_email,action,entity,entity_id,diff", { count: "exact" }).order("at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
  if (sp.entity && /^[a-z_]+$/.test(sp.entity)) q = q.eq("entity", sp.entity);
  if (sp.who) q = q.ilike("actor_email", `%${sp.who.replace(/[%_]/g, "")}%`);
  const { data, count, error } = await q;
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  const L = (x: [string, string] | undefined, fallback: string) => (x ? (locale === "ar" ? x[0] : x[1]) : fallback);
  const qs = (p: number) => `?${new URLSearchParams({ ...(sp.entity ? { entity: sp.entity } : {}), ...(sp.who ? { who: sp.who } : {}), p: String(p) })}`;
  return (
    <>
      <PageTitle title={bi(locale, "سجل التغييرات", "Audit log")} intro={bi(locale, "كل إضافة وتعديل وحذف في المحتوى والإعدادات، بمن قام به ومتى.", "Every create, edit and delete across content and settings — who did it and when.")} />
      <form className="mb-4 flex flex-wrap gap-2">
        <select name="entity" defaultValue={sp.entity ?? ""} className="ed-input !w-48">
          <option value="">{bi(locale, "كل الأنواع", "All types")}</option>
          {Object.entries(ENTITY).map(([k, v]) => <option key={k} value={k}>{L(v, k)}</option>)}
        </select>
        <input name="who" defaultValue={sp.who ?? ""} placeholder={bi(locale, "بريد المستخدم", "User email")} className="ed-input !w-56" dir="ltr" />
        <button className="btn btn-ghost !min-h-10 !px-4 text-sm">{bi(locale, "تصفية", "Filter")}</button>
      </form>
      {error ? (
        <p className="text-danger">{error.message}</p>
      ) : !data?.length ? (
        <p className="rounded-2xl border border-dashed border-rule-strong p-10 text-center text-muted">{bi(locale, "لا توجد سجلات.", "No entries.")}</p>
      ) : (
        <ol className="overflow-hidden rounded-2xl border border-rule bg-[var(--solid)]">
          {data.map((r) => {
            const a = ACTION[r.action] ?? [r.action, r.action, "#64748b"];
            const changes = r.action === "update" && r.diff ? Object.entries(r.diff as Record<string, { old: unknown; new: unknown }>).slice(0, 6) : [];
            return (
              <li key={r.id} className="border-b border-rule px-4 py-3 text-sm last:border-b-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="size-2 rounded-full" style={{ background: a[2] }} />
                  <b className="text-ink" dir="ltr">{r.actor_email ?? bi(locale, "النظام", "System")}</b>
                  <span className="text-muted">{locale === "ar" ? a[0] : a[1]}</span>
                  <span className="rounded-full bg-paper-2 px-2 py-0.5 text-xs">{L(ENTITY[r.entity], r.entity)}</span>
                  {r.entity_id && <code className="text-xs text-faint" dir="ltr">{String(r.entity_id).slice(0, 36)}</code>}
                  <span className="ms-auto text-xs text-faint">{fmt.format(new Date(r.at))}</span>
                </div>
                {changes.length > 0 && (
                  <details className="mt-1.5">
                    <summary className="cursor-pointer text-xs text-blue">{bi(locale, "الحقول المتغيرة", "Changed fields")}: {changes.map(([k]) => k).join(", ")}</summary>
                    <ul className="mt-2 grid gap-1 rounded-xl bg-paper-2 p-3 text-xs" dir="ltr">
                      {changes.map(([k, v]) => (
                        <li key={k} className="break-all"><b>{k}</b>: <span className="text-danger line-through">{brief(v?.old)}</span> → <span className="text-[#0f7a4a]">{brief(v?.new)}</span></li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <div className="mt-4 flex items-center justify-between text-sm">
        {page > 0 ? <Link href={qs(page - 1)} className="text-blue">← {bi(locale, "الأحدث", "Newer")}</Link> : <span />}
        <span className="text-faint">{count ?? 0} {bi(locale, "سجل", "entries")}</span>
        {(page + 1) * PAGE < (count ?? 0) ? <Link href={qs(page + 1)} className="text-blue">{bi(locale, "الأقدم", "Older")} →</Link> : <span />}
      </div>
    </>
  );
}
