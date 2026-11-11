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
  const { data } = await sb.from("media").select("id,url,path,mime,size,width,height,alt,created_at").order("created_at", { ascending: false }).limit(500);
  return (
    <>
      <PageTitle title={t("nav.media")} intro={locale === "ar" ? "ارفع الصور ونظّمها، واعرف أين تُستخدم كل صورة، واستبدل أي صورة على الموقع في كل أماكنها بضغطة." : "Upload and organise images, see where each one is used, and replace any image on the website everywhere at once."} />
      <MediaManager initial={(data ?? []) as never} />
    </>
  );
}
