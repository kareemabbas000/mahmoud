import Link from "next/link";
import { getAdminT } from "@/lib/admin/i18n";
import { requirePage } from "@/lib/admin/auth";
import { PageTitle } from "@/components/admin/PageTitle";

export default async function Taxonomy() {
  await requirePage("viewer");
  const { locale } = await getAdminT();
  const ar = locale === "ar";
  const items = [
    { href: "/admin/c/categories", t: ar ? "التصنيفات" : "Categories" },
    { href: "/admin/c/tags", t: ar ? "الوسوم" : "Tags" },
    { href: "/admin/c/authors", t: ar ? "الكُتّاب" : "Authors" },
  ];
  return (
    <>
      <PageTitle title={ar ? "التصنيفات والوسوم والكُتّاب" : "Categories, tags & authors"} />
      <div className="grid gap-4 sm:grid-cols-3">{items.map((i) => <Link key={i.href} href={i.href} className="rounded-lg border border-rule bg-surface p-6 font-semibold text-ink hover:border-blue">{i.t} →</Link>)}</div>
    </>
  );
}
