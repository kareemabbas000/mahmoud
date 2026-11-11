import { requirePage } from "@/lib/admin/auth";
import { getAdminT, bi } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { PageTitle } from "@/components/admin/PageTitle";
import { PagesList, type PageRow } from "@/components/admin/pages/PagesList";

export const dynamic = "force-dynamic";

export default async function PagesPage() {
  await requirePage("viewer");
  const { locale } = await getAdminT();
  const sb = (await sessionClient())!;
  const [{ data, error }, { data: templates }] = await Promise.all([
    sb.from("pages").select("id,slug,kind,title,published,draft_updated_at,updated_at,blocks").order("slug"),
    sb.from("page_templates").select("id,name,blocks").order("created_at", { ascending: false }),
  ]);
  return (
    <>
      <PageTitle
        title={bi(locale, "الصفحات", "Pages")}
        intro={bi(locale, "عدّل أي صفحة بالسحب والإفلات: أضف الأقسام، أعد ترتيبها، احفظ مسودة وانشرها عندما تكون جاهزة.", "Edit any page by drag and drop: add sections, reorder them, keep a draft and publish when ready.")}
      />
      {error ? <p className="text-danger">{error.message}</p> : <PagesList rows={(data ?? []) as PageRow[]} templates={(templates ?? []) as { id: string; name: Record<string, string>; blocks: unknown[] }[]} />}
    </>
  );
}
