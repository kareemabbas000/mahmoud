import { AuthShell, authMessages } from "../shell";
import { AuthForm } from "@/components/admin/AuthForm";
import { requestReset } from "@/app/actions/auth";
import { getAdminT } from "@/lib/admin/i18n";

export const metadata = { title: "Reset password" };

export default async function Reset() {
  const { locale } = await getAdminT();
  const ar = locale === "ar";
  return (
    <AuthShell locale={locale} title={ar ? "إعادة تعيين كلمة المرور" : "Reset your password"}>
      <AuthForm action={requestReset} submit={ar ? "أرسل الرابط" : "Send reset link"} messages={authMessages(ar)} fields={[{ name: "email", label: ar ? "البريد الإلكتروني" : "Email", type: "email", autoComplete: "email", dir: "ltr" }]} />
    </AuthShell>
  );
}
