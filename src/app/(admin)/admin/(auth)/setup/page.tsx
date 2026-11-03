import { AuthShell, authMessages } from "../shell";
import { AuthForm } from "@/components/admin/AuthForm";
import { requestOwnerLink } from "@/app/actions/auth";
import { getAdminT } from "@/lib/admin/i18n";

export const metadata = { title: "Owner setup" };

export default async function Setup() {
  const { locale } = await getAdminT();
  const ar = locale === "ar";
  return (
    <AuthShell
      locale={locale}
      title={ar ? "تفعيل حساب المالك" : "Activate the owner account"}
      intro={ar ? "يعمل هذا مرة واحدة فقط وللبريد المحدد في OWNER_EMAIL. ستصلك رسالة لتعيين كلمة المرور." : "Works once, and only for the email set in OWNER_EMAIL. You'll receive an email to set your password."}
    >
      <AuthForm action={requestOwnerLink} submit={ar ? "أرسل رابط التفعيل" : "Send activation link"} messages={authMessages(ar)} fields={[{ name: "email", label: ar ? "بريد المالك" : "Owner email", type: "email", autoComplete: "email", dir: "ltr" }]} />
    </AuthShell>
  );
}
