import { requirePage } from "@/lib/admin/auth";
import { getAdminT, bi } from "@/lib/admin/i18n";
import { PageTitle } from "@/components/admin/PageTitle";
import { AccountForms } from "@/components/admin/AccountForms";

export const dynamic = "force-dynamic";

export default async function Account() {
  const { staff } = await requirePage("viewer");
  const { locale } = await getAdminT();
  return (
    <>
      <PageTitle title={bi(locale, "حسابي", "My account")} intro={bi(locale, "اسمك وكلمة المرور والأجهزة المسجّل دخولها.", "Your name, password and signed-in devices.")} />
      <AccountForms email={staff.email} name={staff.full_name ?? ""} role={staff.role} />
    </>
  );
}
