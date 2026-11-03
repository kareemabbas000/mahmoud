import { notFound } from "next/navigation";
import { requirePage } from "@/lib/admin/auth";
import { getAdminT } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { PageTitle } from "@/components/admin/PageTitle";
import { EnquiryActions } from "@/components/admin/EnquiryActions";
import { prettyPhone, waLink } from "@/lib/i18n";

export default async function Enquiry({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePage("viewer");
  const { locale, t } = await getAdminT();
  const ar = locale === "ar";
  const sb = (await sessionClient())!;
  const [{ data: e }, { data: replies }] = await Promise.all([
    sb.from("enquiries").select("*").eq("id", id).maybeSingle(),
    sb.from("enquiry_replies").select("*").eq("enquiry_id", id).order("created_at"),
  ]);
  if (!e) notFound();
  const row = (k: string, v: React.ReactNode) => v ? <div className="grid grid-cols-[8rem_1fr] gap-3 border-t border-rule py-3"><dt className="text-muted">{k}</dt><dd className="min-w-0 break-words text-ink">{v}</dd></div> : null;
  const labels = Object.fromEntries(["new", "in_progress", "replied", "closed", "spam"].map((s) => [s, t(`status.${s}` as never)]));
  return (
    <>
      <PageTitle title={e.name} back={{ href: "/admin/enquiries", label: t("nav.enquiries") }} intro={new Date(e.created_at).toLocaleString(ar ? "ar-EG-u-nu-latn" : "en-GB", { dateStyle: "full", timeStyle: "short" })} />
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="grid content-start gap-6">
          <dl className="rounded-lg border border-rule bg-surface px-5 text-sm">
            {row(ar ? "النوع" : "Type", e.kind)}
            {row(ar ? "الهاتف" : "Phone", e.phone && <span className="flex gap-3"><a href={`tel:${e.phone}`} className="text-blue"><bdi dir="ltr">{prettyPhone(e.phone)}</bdi></a><a href={waLink(e.phone)} target="_blank" rel="noopener noreferrer" className="text-success">WhatsApp ↗</a></span>)}
            {row(ar ? "البريد" : "Email", e.email && <a href={`mailto:${e.email}`} className="text-blue"><bdi dir="ltr">{e.email}</bdi></a>)}
            {row(ar ? "المنشأة" : "Company", e.company)}
            {row(ar ? "الخدمة" : "Service", e.service)}
            {row(ar ? "الوظيفة" : "Position", e.job_title)}
            {row(ar ? "اللغة" : "Language", e.locale)}
            {row(ar ? "الصفحة" : "Page", e.source_url && <span dir="ltr" className="text-xs">{e.source_url}</span>)}
          </dl>
          {e.message && <div className="whitespace-pre-wrap rounded-lg border-s-2 border-orange bg-surface p-5">{e.message}</div>}
          {(replies ?? []).length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold text-ink">{ar ? "الردود" : "Replies"}</h2>
              <ol className="grid gap-3">
                {(replies ?? []).map((r) => (
                  <li key={r.id} className="rounded-lg border border-rule bg-surface p-4 text-sm">
                    <p className="flex justify-between text-muted"><span className="font-semibold text-ink">{r.subject}</span><span>{new Date(r.created_at).toLocaleString(ar ? "ar-EG-u-nu-latn" : "en-GB")}</span></p>
                    <p className="mt-2 whitespace-pre-wrap">{r.body}</p>
                    <p className={`mt-2 text-xs ${r.delivery === "sent" ? "text-success" : "text-danger"}`}>{r.delivery === "sent" ? (ar ? "أُرسل" : "Sent") : `${ar ? "لم يُرسل" : "Not sent"}: ${r.error ?? ""}`}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
        <EnquiryActions id={e.id} status={e.status} notes={e.notes ?? ""} email={e.email} cv={e.cv_path} statusLabels={labels} defaultSubject={ar ? "ردًّا على طلبكم – المكتب الاستشاري المتخصص" : "Re: your enquiry – Specialized Consulting Office"} />
      </div>
    </>
  );
}
