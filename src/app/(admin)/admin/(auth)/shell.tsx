import Link from "next/link";
import { Mark } from "@/components/site/Logo";
import { LocaleToggle } from "@/components/admin/LocaleToggle";
import type { AdminLocale } from "@/lib/admin/i18n";

/** Split-screen auth layout: brand panel (desktop) beside a clean form card; a compact brand header on phones. */
export function AuthShell({ title, intro, children, locale, footer }: { title: string; intro?: string; children: React.ReactNode; locale: AdminLocale; footer?: React.ReactNode }) {
  const ar = locale === "ar";
  const points = ar
    ? ["الصفحات والمقالات بمحرر احترافي", "الطلبات والنشرة البريدية في مكان واحد", "صلاحيات وسجل تغييرات لكل فريقك"]
    : ["Pages and posts with a professional editor", "Enquiries and newsletter in one place", "Roles and an activity log for your team"];
  return (
    <main className="auth-wrap">
      <aside className="auth-brand" aria-hidden="true">
        <span className="auth-aura" />
        <div className="relative flex items-center gap-3">
          <span className="auth-mark"><Mark size={30} onDeep /></span>
          <span className="text-lg font-bold tracking-[0.12em] text-white" dir="ltr" style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}>SCO</span>
        </div>
        <div className="relative mt-auto">
          <p className="text-sm font-semibold text-[#ffb08a]">{ar ? "لوحة التحكم" : "Control panel"}</p>
          <p className="mt-3 max-w-md font-display text-[clamp(1.8rem,2.6vw,2.6rem)] font-bold leading-tight text-white">
            {ar ? "كل ما في موقعك، تديره من مكان واحد." : "Everything on your website, managed from one place."}
          </p>
          <ul className="mt-8 grid gap-3">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-[0.95rem] text-[#c9cdf5]">
                <span className="auth-tick">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-10 text-xs text-[#8f95c4]">{ar ? "المكتب الاستشاري المتخصص" : "Specialized Consulting Office"}</p>
      </aside>

      <section className="auth-side">
        <div className="flex items-center justify-between gap-3">
          <Link href="/en" className="flex items-center gap-2.5 lg:invisible">
            <Mark size={30} />
            <span className="font-bold tracking-[0.12em] text-ink" dir="ltr" style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}>SCO</span>
          </Link>
          <LocaleToggle locale={locale} />
        </div>
        <div className="auth-card">
          <h1 className="auth-title">{title}</h1>
          {intro && <p className="mt-2 text-[0.95rem] text-muted">{intro}</p>}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-7 border-t border-rule pt-5 text-sm text-muted">{footer}</div>}
        </div>
        <Link href={ar ? "/ar" : "/en"} className="text-center text-xs text-faint hover:text-ink">← {ar ? "العودة إلى الموقع" : "Back to the website"}</Link>
      </section>
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
  owner_env_missing: ar ? "لم يُضبط OWNER_EMAIL ولا SUPABASE_SERVICE_ROLE_KEY في إعدادات Vercel." : "Neither OWNER_EMAIL nor SUPABASE_SERVICE_ROLE_KEY is set in Vercel.",
  reset_sent: ar ? "إذا كان البريد مسجلًا فستصلك رسالة لإعادة تعيين كلمة المرور." : "If this email is registered, a reset link is on its way.",
  weak_password: ar ? "كلمة المرور يجب ألا تقل عن 10 أحرف." : "Use at least 10 characters for the password.",
  invalid_invite: ar ? "الدعوة غير صالحة أو منتهية أو أُلغيت." : "This invitation is invalid, expired or revoked.",
  already_registered: ar ? "هذا البريد مسجل بالفعل. سجّل الدخول بدلًا من ذلك." : "This email is already registered. Sign in instead.",
  link_invalid: ar ? "الرابط غير صالح أو منتهي الصلاحية." : "The link is invalid or has expired.",
});
