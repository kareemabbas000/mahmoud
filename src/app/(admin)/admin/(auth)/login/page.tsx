import Link from "next/link";
import { AuthShell, authMessages } from "../shell";
import { AuthForm } from "@/components/admin/AuthForm";
import { sendMagicLink, signIn } from "@/app/actions/auth";
import { getAdminT } from "@/lib/admin/i18n";

export const metadata = { title: "Sign in" };

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { locale } = await getAdminT();
  const ar = locale === "ar";
  const { e } = await searchParams;
  const m = authMessages(ar);
  return (
    <AuthShell
      locale={locale}
      title={ar ? "مرحبًا بعودتك" : "Welcome back"}
      intro={ar ? "سجّل الدخول لإدارة موقع المكتب الاستشاري المتخصص." : "Sign in to manage the Specialized Consulting Office website."}
      footer={
        <div className="grid gap-2">
          <Link href="/admin/reset" className="text-blue hover:underline">{ar ? "نسيت كلمة المرور؟" : "Forgot your password?"}</Link>
          <Link href="/admin/setup" className="hover:text-ink">{ar ? "أول تشغيل؟ تفعيل حساب المالك" : "First run? Activate the owner account"}</Link>
        </div>
      }
    >
      {e && <p role="alert" className="mb-4 rounded-md bg-danger/10 p-3 text-sm text-danger">{m[e] ?? m.generic}</p>}
      <AuthForm
        action={signIn}
        submit={ar ? "دخول" : "Sign in"}
        messages={m}
        fields={[
          { name: "email", label: ar ? "البريد الإلكتروني" : "Email", type: "email", autoComplete: "email", dir: "ltr" },
          { name: "password", label: ar ? "كلمة المرور" : "Password", type: "password", autoComplete: "current-password", dir: "ltr" },
        ]}
      />
      <details className="auth-alt mt-6 text-sm">
        <summary className="cursor-pointer text-muted hover:text-ink">{ar ? "أو أرسل لي رابط دخول بالبريد" : "Or email me a sign-in link"}</summary>
        <div className="mt-4">
          <AuthForm action={sendMagicLink} submit={ar ? "إرسال الرابط" : "Send link"} messages={m} fields={[{ name: "email", label: ar ? "البريد الإلكتروني" : "Email", type: "email", autoComplete: "email", dir: "ltr" }]} />
        </div>
      </details>
    </AuthShell>
  );
}
