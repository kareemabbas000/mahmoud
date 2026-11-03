import { requirePage } from "@/lib/admin/auth";
import { getAdminT } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { PageTitle } from "@/components/admin/PageTitle";
import { TranslationsEditor } from "@/components/admin/TranslationsEditor";

export default async function Translations() {
  await requirePage("viewer");
  const { t, locale } = await getAdminT();
  const sb = (await sessionClient())!;
  const { data } = await sb.from("ui_strings").select("key,values").order("key");
  return (
    <>
      <PageTitle title={t("nav.translations")} intro={locale === "ar" ? "كل نصوص واجهة الموقع (الأزرار، النماذج، الرسائل، شريط الكوكيز…) بكل اللغات. محتوى الصفحات والخدمات يُعدّل من أقسامه." : "Every interface text on the site (buttons, forms, messages, cookie banner…) in every language. Page and service content is edited in its own section."} />
      <TranslationsEditor initial={(data ?? []) as never} />
    </>
  );
}
