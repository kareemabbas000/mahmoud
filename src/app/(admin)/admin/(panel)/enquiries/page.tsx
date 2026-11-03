/* eslint-disable @next/next/no-html-link-for-pages -- CSV downloads from route handlers, not page navigation */
import Link from "next/link";
import { requirePage } from "@/lib/admin/auth";
import { getAdminT } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { PageTitle } from "@/components/admin/PageTitle";

export const metadata = { title: "Enquiries" };
const S = ["new", "in_progress", "replied", "closed", "spam"] as const;

export default async function Enquiries({ searchParams }: { searchParams: Promise<{ status?: string; kind?: string }> }) {
  await requirePage("viewer");
  const { locale, t } = await getAdminT();
  const ar = locale === "ar";
  const { status = "", kind = "" } = await searchParams;
  const sb = (await sessionClient())!;
  let q = sb.from("enquiries").select("id,kind,status,name,phone,email,service,created_at").order("created_at", { ascending: false }).limit(300);
  if (S.includes(status as never)) q = q.eq("status", status);
  if (["contact", "consultation", "career"].includes(kind)) q = q.eq("kind", kind);
  const { data } = await q;
  const kinds: Record<string, string> = { contact: ar ? "تواصل" : "Contact", consultation: ar ? "استشارة" : "Consultation", career: ar ? "وظيفة" : "Career" };
  const chip = (href: string, label: string, on: boolean) => <Link href={href} className={`rounded-full border px-3 py-1 text-sm ${on ? "border-ink bg-ink text-paper" : "border-rule text-muted hover:text-ink"}`}>{label}</Link>;
  return (
    <>
      <PageTitle title={t("nav.enquiries")} actions={<a download href="/admin/export/enquiries" className="btn btn-ghost !min-h-10 text-sm">{t("act.export_csv")}</a>} />
      <div className="mb-3 flex flex-wrap gap-2">
        {chip(`/admin/enquiries${kind ? `?kind=${kind}` : ""}`, ar ? "كل الحالات" : "All statuses", !status)}
        {S.map((s) => chip(`/admin/enquiries?status=${s}${kind ? `&kind=${kind}` : ""}`, t(`status.${s}` as never), status === s))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {chip(`/admin/enquiries${status ? `?status=${status}` : ""}`, ar ? "كل الأنواع" : "All types", !kind)}
        {Object.entries(kinds).map(([k, l]) => chip(`/admin/enquiries?kind=${k}${status ? `&status=${status}` : ""}`, l, kind === k))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-rule bg-surface">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="bg-paper-2 text-muted"><tr>{[ar ? "التاريخ" : "Date", ar ? "النوع" : "Type", ar ? "الاسم" : "Name", ar ? "الهاتف" : "Phone", ar ? "الخدمة" : "Service", ar ? "الحالة" : "Status"].map((h) => <th key={h} className="px-4 py-3 text-start font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {(data ?? []).length === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted">{t("empty")}</td></tr>}
            {(data ?? []).map((e) => (
              <tr key={e.id} className={`border-t border-rule ${e.status === "new" ? "font-semibold" : ""}`}>
                <td className="tnum px-4 py-3 text-muted">{new Date(e.created_at).toLocaleString(ar ? "ar-EG-u-nu-latn" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="px-4 py-3">{kinds[e.kind]}</td>
                <td className="px-4 py-3"><Link href={`/admin/enquiries/${e.id}`} className="text-blue hover:underline">{e.name}</Link></td>
                <td className="px-4 py-3"><bdi dir="ltr">{e.phone}</bdi></td>
                <td className="px-4 py-3 text-muted">{e.service || "—"}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${e.status === "new" ? "bg-orange text-on-orange" : "bg-paper-2"}`}>{t(`status.${e.status}` as never)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
