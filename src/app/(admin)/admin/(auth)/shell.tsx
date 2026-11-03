import Link from "next/link";
import { Mark } from "@/components/site/Logo";
import { LocaleToggle } from "@/components/admin/LocaleToggle";
import type { AdminLocale } from "@/lib/admin/i18n";

export function AuthShell({ title, intro, children, locale, footer }: { title: string; intro?: string; children: React.ReactNode; locale: AdminLocale; footer?: React.ReactNode }) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-deep px-4 py-16">
      <div className="ledger-grid absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="absolute end-4 top-4"><LocaleToggle locale={locale} onDeep /></div>
      <div className="relative w-full max-w-md rounded-xl border border-rule bg-surface p-8 shadow-soft">
        <div className="flex items-center gap-3">
          <Mark size={34} />
          <span className="font-mono text-lg tracking-[0.14em] text-ink" dir="ltr">SCO</span>
        </div>
        <h1 className="display d-3 mt-6">{title}</h1>
        {intro && <p className="mt-2 text-sm text-muted">{intro}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 border-t border-rule pt-4 text-sm text-muted">{footer}</div>}
        <Link href="/ar" className="mt-6 block text-center text-xs text-faint hover:text-ink">sco-eg.com</Link>
      </div>
    </main>
  );
}

export const authMessages = (ar: boolean): Record<string, string> => ({
  generic: ar ? "حدث خطأ. حاول مرة أخرى." : "Something went wrong. Please try again.",
  not_configured: ar ? "لم يتم ربط Supabase بعد (متغيرات البيئة غير موجودة)." : "Supabase is not configured (missing environment variables).",
  invalid_credentials: ar ? "البريد أو كلمة المرور غير صحيحة." : "Incorrect email or password.",
  rate_limited: ar ? "طلبات كثيرة. انتظر قليلًا ثم حاول مجددًا." : "Too many requests. Wait a moment and try again.",
  link_sent: ar ? "إذا كان البريد مسجلًا فستصلك رسالة تحتوي رابط الدخول." : "If this email is registered, a sign-in link is on its way.",
  owner_link_sent: ar ? "إذا كان هذا هو بريد المالك المعتمد فستصلك رسالة لإكمال التفعيل." : "If this is the configured owner email, you'll receive a link to finish setup.",
  owner_env_missing: ar ? "لم يُضبط OWNER_EMAIL في متغيرات البيئة." : "OWNER_EMAIL is not set in the environment.",
  reset_sent: ar ? "إذا كان البريد مسجلًا فستصلك رسالة لإعادة تعيين كلمة المرور." : "If this email is registered, a reset link is on its way.",
  weak_password: ar ? "كلمة المرور يجب ألا تقل عن 10 أحرف." : "Use at least 10 characters for the password.",
  invalid_invite: ar ? "الدعوة غير صالحة أو منتهية أو أُلغيت." : "This invitation is invalid, expired or revoked.",
  already_registered: ar ? "هذا البريد مسجل بالفعل. سجّل الدخول بدلًا من ذلك." : "This email is already registered. Sign in instead.",
  link_invalid: ar ? "الرابط غير صالح أو منتهي الصلاحية." : "The link is invalid or has expired.",
});
