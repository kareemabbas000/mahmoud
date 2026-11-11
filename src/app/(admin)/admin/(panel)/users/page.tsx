import { requirePage } from "@/lib/admin/auth";
import { getAdminT, bi } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { PageTitle, Forbidden } from "@/components/admin/PageTitle";
import { UsersManager } from "@/components/admin/users/UsersManager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { staff, allowed } = await requirePage("admin");
  const { locale } = await getAdminT();
  if (!allowed) return <Forbidden ar={locale === "ar"} />;
  const sb = (await sessionClient())!;
  const [{ data: users }, { data: invites }] = await Promise.all([
    sb.from("profiles").select("id,email,full_name,role,created_at").order("created_at"),
    sb.from("invitations").select("id,email,role,created_at,expires_at,accepted_at,revoked_at").is("accepted_at", null).is("revoked_at", null).order("created_at", { ascending: false }),
  ]);
  return (
    <>
      <PageTitle title={bi(locale, "المستخدمون والصلاحيات", "Users & roles")} intro={bi(locale, "ادعُ زملاءك وحدّد صلاحية كل منهم. الصلاحيات مطبّقة أيضًا داخل قاعدة البيانات.", "Invite colleagues and choose what each can do. Roles are also enforced inside the database.")} />
      <UsersManager me={staff.id} myRole={staff.role} users={(users ?? []) as never} invites={((invites ?? []).filter((i) => new Date(i.expires_at) > new Date())) as never} />
    </>
  );
}
