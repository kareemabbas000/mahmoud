"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cvLink, deleteEnquiry, replyToEnquiry, saveEnquiryNotes, setEnquiryStatus } from "@/app/actions/inbox";
import { canEdit, useAdmin, useResult } from "./AdminContext";

const S = ["new", "in_progress", "replied", "closed", "spam"] as const;

export function EnquiryActions({ id, status, notes, email, cv, statusLabels, defaultSubject }: { id: string; status: string; notes: string; email: string | null; cv: string | null; statusLabels: Record<string, string>; defaultSubject: string }) {
  const { t, role } = useAdmin();
  const show = useResult();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [st, setSt] = useState(status);
  const [n, setN] = useState(notes);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");
  const editor = canEdit(role, "editor");
  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-rule bg-surface p-5">
        <label className="field">
          <span className="label">{t("الحالة", "Status")}</span>
          <select className="input" disabled={!editor || pending} value={st} onChange={(e) => { const v = e.target.value; const prev = st; setSt(v); start(async () => { if (!show(await setEnquiryStatus(id, v))) setSt(prev); }); }}>
            {S.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
          </select>
        </label>
        {cv && editor && (
          <button type="button" className="btn btn-ghost mt-4 w-full text-sm" onClick={() => start(async () => { const r = await cvLink(cv); if (show(r, "") && r.ok) window.open((r.data as { url: string }).url, "_blank", "noopener"); })}>
            {t("تنزيل السيرة الذاتية (رابط صالح 5 دقائق)", "Download CV (5-minute link)")}
          </button>
        )}
      </div>
      <div className="rounded-lg border border-rule bg-surface p-5">
        <label className="field">
          <span className="label">{t("ملاحظات داخلية", "Internal notes")}</span>
          <textarea className="input" rows={4} disabled={!editor} value={n} onChange={(e) => setN(e.target.value)} />
        </label>
        <button type="button" className="btn btn-ghost mt-3 text-sm" disabled={!editor || pending} onClick={() => start(async () => { show(await saveEnquiryNotes(id, n)); })}>{t("حفظ الملاحظات", "Save notes")}</button>
      </div>
      {editor && (
        <form
          className="rounded-lg border border-rule bg-surface p-5"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await replyToEnquiry(id, subject, body);
              if (show(r, t("تم إرسال الرد", "Reply sent"))) { setBody(""); setSt("replied"); router.refresh(); }
            });
          }}
        >
          <p className="mb-3 font-semibold text-ink">{t("الرد عبر البريد", "Reply by email")}</p>
          {!email ? (
            <p className="text-sm text-muted">{t("لم يترك العميل بريدًا إلكترونيًّا؛ تواصل هاتفيًّا أو عبر واتساب.", "No email was provided — reply by phone or WhatsApp.")}</p>
          ) : (
            <div className="grid gap-3">
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label={t("الموضوع", "Subject")} />
              <textarea className="input" rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder={t("نص الرد…", "Your reply…")} />
              <button className="btn btn-primary justify-self-start" disabled={pending || !body.trim()}>{pending ? "…" : t("إرسال", "Send")}</button>
            </div>
          )}
        </form>
      )}
      {canEdit(role, "admin") && (
        <button type="button" className="btn border border-danger/40 text-sm text-danger hover:bg-danger/10" disabled={pending} onClick={() => start(async () => { if (confirm(t("حذف الطلب نهائيًّا؟", "Delete this enquiry permanently?")) && show(await deleteEnquiry(id), t("تم الحذف", "Deleted"))) router.replace("/admin/enquiries"); })}>
          {t("حذف الطلب", "Delete enquiry")}
        </button>
      )}
    </div>
  );
}
