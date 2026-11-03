import { requirePage } from "@/lib/admin/auth";
import { getAdminT } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { PageTitle } from "@/components/admin/PageTitle";
import { MediaManager } from "@/components/admin/MediaManager";

export const metadata = { title: "Media" };

export default async function Media() {
  await requirePage("viewer");
  const { t, locale } = await getAdminT();
  const sb = (await sessionClient())!;
  const { data } = await sb.from("media").select("id,url,path,mime,width,height,alt,created_at").order("created_at", { ascending: false }).limit(500);
  return (
    <>
      <PageTitle title={t("nav.media")} intro={locale === "ar" ? "الصور الأصلية للموقع القديم متاحة أيضًا بالمسار /legacy/… ويمكن لصقها في أي حقل صورة." : "The legacy site's original images are also available under /legacy/… and can be pasted into any image field."} />
      <MediaManager initial={(data ?? []) as never} />
    </>
  );
}
