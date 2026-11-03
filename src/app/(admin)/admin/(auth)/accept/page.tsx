import { AuthShell, authMessages } from "../shell";
import { AuthForm } from "@/components/admin/AuthForm";
import { acceptInvitation } from "@/app/actions/auth";
import { getAdminT } from "@/lib/admin/i18n";

export const metadata = { title: "Accept invitation" };

export default async function Accept({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const { locale } = await getAdminT();
  const ar = locale === "ar";
  return (
    <AuthShell locale={locale} title={ar ? "قبول الدعوة" : "Accept your invitation"} intro={ar ? "أنشئ كلمة مرور للانضمام إلى لوحة التحكم." : "Create a password to join the control panel."}>
      <AuthForm
        action={acceptInvitation}
        hidden={{ token }}
        submit={ar ? "إنشاء الحساب" : "Create account"}
        messages={authMessages(ar)}
        fields={[
          { name: "full_name", label: ar ? "الاسم" : "Your name", autoComplete: "name" },
          { name: "password", label: ar ? "كلمة المرور (10 أحرف على الأقل)" : "Password (at least 10 characters)", type: "password", autoComplete: "new-password", dir: "ltr" },
        ]}
      />
    </AuthShell>
  );
}
