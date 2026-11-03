import { requirePage } from "@/lib/admin/auth";
import { getAdminT } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { PageTitle, Forbidden } from "@/components/admin/PageTitle";
import { MenusEditor } from "@/components/admin/MenusEditor";

export default async function Menus() {
  const { allowed } = await requirePage("admin");
  const { t, locale } = await getAdminT();
  if (!allowed) return <Forbidden ar={locale === "ar"} />;
  const sb = (await sessionClient())!;
  const { data } = await sb.from("menus").select("location,items").order("location", { ascending: false });
  return (
    <>
      <PageTitle title={t("nav.menus")} />
      <MenusEditor initial={(data ?? []) as never} />
    </>
  );
}
