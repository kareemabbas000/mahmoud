"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeMyPassword, signOutEverywhere, updateMyName } from "@/app/actions/account";
import { useAdmin } from "./AdminContext";

const ROLE: Record<string, [string, string]> = { owner: ["المالك", "Owner"], admin: ["مسؤول", "Admin"], editor: ["محرر", "Editor"], viewer: ["مشاهد", "Viewer"] };

/** Strength: length + variety. Shown live so people pick a good password without a rules lecture. */
function strength(p: string): 0 | 1 | 2 | 3 {
  if (p.length < 10) return 0;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length;
  return p.length >= 14 && kinds >= 3 ? 3 : kinds >= 2 ? 2 : 1;
}

export function AccountForms({ email, name, role }: { email: string; name: string; role: string }) {
  const { t, toast } = useAdmin();
  const router = useRouter();
  const [n, setN] = useState(name);
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, start] = useTransition();
  const s = strength(pw);
  const errText = (d?: string) =>
    d === "wrong_password" ? t("كلمة المرور الحالية غير صحيحة.", "Your current password is incorrect.")
    : d === "weak_password" ? t("اختر كلمة مرور من 10 أحرف على الأقل، ويفضل أن تكون جملة يسهل تذكرها.", "Use at least 10 characters — a memorable phrase works well.")
    : d === "same_password" ? t("كلمة المرور الجديدة مطابقة للحالية.", "The new password is the same as the current one.")
    : d === "rate_limited" ? t("محاولات كثيرة. انتظر ربع ساعة ثم حاول مجددًا.", "Too many attempts. Wait 15 minutes and try again.")
    : t("تعذّر الحفظ. حاول مرة أخرى.", "Couldn't save. Please try again.");

  return (
    <div className="grid max-w-3xl gap-6">
      <section className="grid gap-5 rounded-xl border border-rule bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-blue-wash text-xl font-semibold text-blue">{(n || email).slice(0, 1).toUpperCase()}</span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{n || email}</p>
            <p className="truncate text-sm text-muted" dir="ltr">{email}</p>
          </div>
          <span className="ms-auto rounded-full bg-paper-2 px-3 py-1 text-xs font-semibold text-muted">{t(...(ROLE[role] ?? ["", role]))}</span>
        </div>
        <form
          className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await updateMyName(n);
              if (r.ok) { toast("ok", t("تم حفظ الاسم", "Name saved")); router.refresh(); }
              else toast("err", errText(r.detail));
            });
          }}
        >
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-ink">{t("الاسم الظاهر", "Display name")}</span>
            <input className="ed-input" value={n} onChange={(e) => setN(e.target.value)} autoComplete="name" required minLength={2} maxLength={120} />
          </label>
          <button className="btn btn-primary !min-h-11" disabled={busy || n.trim() === name.trim()}>{t("حفظ الاسم", "Save name")}</button>
        </form>
      </section>

      <section className="grid gap-4 rounded-xl border border-rule bg-surface p-5 sm:p-6">
        <div>
          <h2 className="font-semibold text-ink">{t("تغيير كلمة المرور", "Change password")}</h2>
          <p className="mt-1 text-sm text-muted">{t("للحماية نطلب كلمة المرور الحالية أولًا.", "For your security we ask for your current password first.")}</p>
        </div>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (pw !== pw2) return toast("err", t("كلمتا المرور غير متطابقتين.", "The two new passwords don't match."));
            start(async () => {
              const r = await changeMyPassword(cur, pw);
              if (r.ok) {
                toast("ok", t("تم تغيير كلمة المرور", "Password changed"));
                setCur(""); setPw(""); setPw2("");
              } else toast("err", errText(r.detail));
            });
          }}
        >
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-ink">{t("كلمة المرور الحالية", "Current password")}</span>
            <input className="ed-input" dir="ltr" type={show ? "text" : "password"} value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-ink">{t("كلمة المرور الجديدة", "New password")}</span>
              <input className="ed-input" dir="ltr" type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required minLength={10} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-ink">{t("تأكيد كلمة المرور الجديدة", "Confirm new password")}</span>
              <input className="ed-input" dir="ltr" type={show ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required minLength={10} />
            </label>
          </div>
          <div className="grid gap-1.5" aria-live="polite">
            <div className="grid grid-cols-3 gap-1.5" aria-hidden="true">
              {[1, 2, 3].map((i) => <span key={i} className={`h-1.5 rounded-full ${s >= i ? (s === 1 ? "bg-danger" : s === 2 ? "bg-orange" : "bg-[#0f7a4a]") : "bg-paper-2"}`} />)}
            </div>
            <span className="text-xs text-muted">
              {pw.length === 0 ? t("10 أحرف على الأقل. الجملة الطويلة أقوى من الرموز المعقدة.", "At least 10 characters. A long phrase beats complex symbols.")
                : s === 0 ? t("قصيرة جدًا", "Too short") : s === 1 ? t("مقبولة", "OK") : s === 2 ? t("جيدة", "Good") : t("قوية", "Strong")}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> {t("إظهار كلمات المرور", "Show passwords")}
            </label>
            <button className="btn btn-primary !min-h-11" disabled={busy || !cur || pw.length < 10 || pw !== pw2}>{t("تغيير كلمة المرور", "Change password")}</button>
          </div>
        </form>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rule bg-surface p-5 sm:p-6">
        <div>
          <h2 className="font-semibold text-ink">{t("الأجهزة", "Devices")}</h2>
          <p className="mt-1 text-sm text-muted">{t("نسيت تسجيل الخروج من جهاز آخر؟ أخرِج حسابك من كل الأجهزة دفعة واحدة.", "Left yourself signed in somewhere? Sign out of every device at once.")}</p>
        </div>
        <form action={signOutEverywhere}>
          <button className="btn btn-ghost !min-h-11">{t("تسجيل الخروج من كل الأجهزة", "Sign out everywhere")}</button>
        </form>
      </section>
    </div>
  );
}
