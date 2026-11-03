import { notFound } from "next/navigation";
import { getCollection } from "@/lib/admin/collections";
import { requirePage } from "@/lib/admin/auth";
import { getAdminT } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { CollectionList } from "@/components/admin/CollectionList";
import { PageTitle } from "@/components/admin/PageTitle";

export default async function List({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const c = getCollection(collection);
  if (!c) notFound();
  await requirePage("viewer");
  const { locale } = await getAdminT();
  const sb = (await sessionClient())!;
  const { data, error } = await sb.from(c.table).select("*").order(c.sort ? "sort" : c.table === "redirects" ? "source" : "slug", { ascending: true });
  return (
    <>
      <PageTitle title={c.label[locale === "ar" ? 0 : 1]} />
      {error ? <p className="text-danger">{error.message}</p> : <CollectionList ck={collection} rows={(data ?? []) as never} />}
    </>
  );
}
