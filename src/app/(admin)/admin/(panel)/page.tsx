import Link from "next/link";
import { requirePage } from "@/lib/admin/auth";
import { getAdminT } from "@/lib/admin/i18n";
import { signOut } from "@/app/actions/auth";
import { Mark } from "@/components/site/Logo";

export const metadata = { title: "Dashboard" };

/** Temporary landing while the full control panel ships (next commits). */
export default async function Dashboard() {
  const { staff } = await requirePage("viewer");
  const { locale } = await getAdminT();
  const ar = locale === "ar";
  return (
    <main className="container-x grid min-h-dvh place-items-center py-20">
      <div className="max-w-lg text-center">
        <div className="flex justify-center"><Mark size={48} /></div>
        <h1 className="display d-2 mt-6">{ar ? `مرحبًا ${staff.full_name ?? ""}` : `Welcome ${staff.full_name ?? ""}`}</h1>
        <p className="mt-3 text-muted">{staff.email} · {staff.role}</p>
        <p className="mt-6 text-muted">{ar ? "لوحة التحكم الكاملة قيد الإطلاق." : "The full control panel is being rolled out."}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href={`/${locale}`} className="btn btn-ghost">{ar ? "عرض الموقع" : "View site"}</Link>
          <form action={signOut}><button className="btn btn-primary">{ar ? "تسجيل الخروج" : "Sign out"}</button></form>
        </div>
      </div>
    </main>
  );
}
