import { requirePage } from "@/lib/admin/auth";
import { getAdminT } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { PageTitle, Forbidden } from "@/components/admin/PageTitle";
import { LanguagesEditor } from "@/components/admin/LanguagesEditor";

export default async function Languages() {
  const { allowed } = await requirePage("admin");
  const { t, locale } = await getAdminT();
  if (!allowed) return <Forbidden ar={locale === "ar"} />;
  const sb = (await sessionClient())!;
  const { data } = await sb.from("languages").select("code,name,native_name,dir,enabled,is_default,sort").order("sort");
  return (
    <>
      <PageTitle title={t("nav.languages")} />
      <LanguagesEditor initial={(data ?? []) as never} />
    </>
  );
}
