import { requirePage } from "@/lib/admin/auth";
import { getAdminT } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { PageTitle } from "@/components/admin/PageTitle";
import { SubscriberActions } from "@/components/admin/SubscriberRow";

export const metadata = { title: "Newsletter" };

export default async function Newsletter() {
  await requirePage("viewer");
  const { locale, t } = await getAdminT();
  const ar = locale === "ar";
  const sb = (await sessionClient())!;
  const { data } = await sb.from("newsletter_subscribers").select("id,email,locale,status,created_at,confirmed_at").order("created_at", { ascending: false }).limit(1000);
  const counts = { confirmed: 0, pending: 0, unsubscribed: 0 } as Record<string, number>;
  (data ?? []).forEach((s) => (counts[s.status] = (counts[s.status] ?? 0) + 1));
  const st: Record<string, string> = { confirmed: ar ? "مؤكَّد" : "Confirmed", pending: ar ? "بانتظار التأكيد" : "Pending", unsubscribed: ar ? "ألغى الاشتراك" : "Unsubscribed" };
  return (
    <>
      <PageTitle title={t("nav.newsletter")} intro={ar ? "اشتراك بتأكيد مزدوج: لا يُعد المشترك نشطًا حتى يضغط رابط التأكيد في بريده." : "Double opt-in: a subscriber only becomes active after clicking the confirmation link."} actions={<a download href="/admin/export/newsletter" className="btn btn-ghost !min-h-10 text-sm">{t("act.export_csv")}</a>} />
      <div className="mb-6 flex flex-wrap gap-3 text-sm">{Object.entries(counts).map(([k, v]) => <span key={k} className="rounded-full bg-paper-2 px-3 py-1">{st[k]}: <b className="tnum">{v}</b></span>)}</div>
      <div className="overflow-x-auto rounded-lg border border-rule bg-surface">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-paper-2 text-muted"><tr>{[ar ? "البريد" : "Email", ar ? "اللغة" : "Language", ar ? "الحالة" : "Status", ar ? "التاريخ" : "Date", ""].map((h, i) => <th key={i} className="px-4 py-3 text-start font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {(data ?? []).length === 0 && <tr><td colSpan={5} className="p-10 text-center text-muted">{t("empty")}</td></tr>}
            {(data ?? []).map((s) => (
              <tr key={s.id} className="border-t border-rule">
                <td className="px-4 py-3"><bdi dir="ltr">{s.email}</bdi></td>
                <td className="px-4 py-3">{s.locale}</td>
                <td className="px-4 py-3">{st[s.status]}</td>
                <td className="tnum px-4 py-3 text-muted">{new Date(s.created_at).toLocaleDateString(ar ? "ar-EG-u-nu-latn" : "en-GB")}</td>
                <td className="px-4 py-3"><SubscriberActions id={s.id} status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
