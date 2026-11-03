import { notFound } from "next/navigation";
import { getCollection } from "@/lib/admin/collections";
import { requirePage } from "@/lib/admin/auth";
import { getAdminT } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { PageTitle } from "@/components/admin/PageTitle";

export default async function Edit({ params }: { params: Promise<{ collection: string; id: string }> }) {
  const { collection, id } = await params;
  const c = getCollection(collection);
  if (!c) notFound();
  await requirePage("viewer");
  const { locale } = await getAdminT();
  const ar = locale === "ar";
  let row: Record<string, unknown> = { ...c.defaults };
  if (id !== "new") {
    const sb = (await sessionClient())!;
    const { data } = await sb.from(c.table).select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    row = data;
  }
  const title = id === "new" ? (ar ? "إضافة جديد" : "Add new") : String((row[c.title] as Record<string, string>)?.[locale] ?? (row[c.title] as Record<string, string>)?.ar ?? row[c.title] ?? "");
  return (
    <>
      <PageTitle title={title} back={{ href: `/admin/c/${collection}`, label: c.label[ar ? 0 : 1] }} />
      <CollectionForm collectionKey={collection} id={id === "new" ? null : id} initial={row} viewHref={id !== "new" && c.publicPath ? c.publicPath(row) : null} />
    </>
  );
}
