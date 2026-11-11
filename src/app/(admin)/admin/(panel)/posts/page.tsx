import { requirePage } from "@/lib/admin/auth";
import { getAdminT, bi } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { PageTitle } from "@/components/admin/PageTitle";
import { PostsList, type PostRow } from "@/components/admin/posts/PostsList";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  await requirePage("viewer");
  const { locale } = await getAdminT();
  const sb = (await sessionClient())!;
  const [{ data, error }, { data: cats }] = await Promise.all([
    sb.from("posts").select("id,title,slug,status,publish_at,updated_at,category_id,cover,seo,translation_status,excerpt").order("updated_at", { ascending: false }),
    sb.from("post_categories").select("id,name").order("slug"),
  ]);
  return (
    <>
      <PageTitle
        title={bi(locale, "رؤى ومقالات", "Insights & blog")}
        intro={bi(locale, "اكتب، جدوِل وانشر المقالات بالعربية والإنجليزية مع محسّن SEO مدمج.", "Write, schedule and publish posts in Arabic and English with a built-in SEO optimiser.")}
      />
      {error ? <p className="text-danger">{error.message}</p> : <PostsList rows={(data ?? []) as PostRow[]} cats={(cats ?? []) as { id: string; name: Record<string, string> }[]} />}
    </>
  );
}
