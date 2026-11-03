import Link from "next/link";
import { Mark } from "@/components/site/Logo";

/** Static, bilingual 404 (kept static so every localized route can be prerendered). */
export default function NotFound() {
  return (
    <section className="container-x grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <div className="flex justify-center">
          <Mark size={56} />
        </div>
        <p className="wp-ref mt-8">ERR·404</p>
        <h1 className="display d-1 mt-3" lang="ar" dir="rtl">الصفحة غير موجودة</h1>
        <p className="display d-3 mt-2 text-muted" lang="en" dir="ltr">Page not found</p>
        <div className="mt-10 flex justify-center gap-3">
          <Link href="/ar" className="btn btn-primary" lang="ar">الرئيسية</Link>
          <Link href="/en" className="btn btn-ghost" lang="en">Home</Link>
        </div>
      </div>
    </section>
  );
}
