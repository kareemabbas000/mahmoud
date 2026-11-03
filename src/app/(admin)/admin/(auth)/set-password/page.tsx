import { redirect } from "next/navigation";
import { AuthShell, authMessages } from "../shell";
import { AuthForm } from "@/components/admin/AuthForm";
import { setPassword } from "@/app/actions/auth";
import { getAdminT } from "@/lib/admin/i18n";
import { getStaff } from "@/lib/admin/auth";

export const metadata = { title: "Set password" };

export default async function SetPasswordPage() {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login?e=link_invalid");
  const { locale } = await getAdminT();
  const ar = locale === "ar";
  return (
    <AuthShell locale={locale} title={ar ? "تعيين كلمة المرور" : "Set your password"} intro={staff.email}>
      <AuthForm
        action={setPassword}
        submit={ar ? "حفظ والمتابعة" : "Save and continue"}
        messages={authMessages(ar)}
        fields={[
          { name: "full_name", label: ar ? "الاسم" : "Your name", autoComplete: "name", defaultValue: staff.full_name ?? "" },
          { name: "password", label: ar ? "كلمة المرور الجديدة (10 أحرف على الأقل)" : "New password (at least 10 characters)", type: "password", autoComplete: "new-password", dir: "ltr" },
        ]}
      />
    </AuthShell>
  );
}
