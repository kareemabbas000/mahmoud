import Link from "next/link";
import { atLeast, requirePage } from "@/lib/admin/auth";
import { getAdminT } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { PageTitle } from "@/components/admin/PageTitle";
import { Icon, type IconName } from "@/components/ui/Icon";

export const metadata = { title: "Dashboard" };

const LOCALIZED: { table: string; field: string; label: [string, string]; href: string }[] = [
  { table: "services", field: "name", label: ["الخدمات", "Services"], href: "/admin/c/services" },
  { table: "team_members", field: "name", label: ["الفريق", "Team"], href: "/admin/c/team" },
  { table: "clients", field: "name", label: ["العملاء", "Clients"], href: "/admin/c/clients" },
  { table: "faqs", field: "question", label: ["الأسئلة", "FAQ"], href: "/admin/c/faqs" },
  { table: "gallery_items", field: "caption", label: ["المعرض", "Gallery"], href: "/admin/c/gallery" },
  { table: "pages", field: "title", label: ["الصفحات", "Pages"], href: "/admin/pages" },
  { table: "posts", field: "title", label: ["المقالات", "Insights"], href: "/admin/posts" },
  { table: "ui_strings", field: "values", label: ["نصوص الواجهة", "Interface texts"], href: "/admin/translations" },
];

export default async function Dashboard() {
  const { staff } = await requirePage("viewer");
  const { locale } = await getAdminT();
  const ar = locale === "ar";
  const sb = (await sessionClient())!;
  const { data: langs } = await sb.from("languages").select("code,native_name,enabled").order("sort");
  const enabled = (langs ?? []).filter((l) => l.enabled);
  const coverage = await Promise.all(
    LOCALIZED.map(async (x) => {
      const { data } = await sb.from(x.table).select(x.field);
      const rows = (data ?? []) as unknown as Record<string, Record<string, string>>[];
      return { ...x, total: rows.length, missing: Object.fromEntries(enabled.map((l) => [l.code, rows.filter((r) => !r[x.field]?.[l.code]).length])) };
    }),
  );
  const [{ count: newCount }, { data: recent }, { count: subs }, { count: posts }] = await Promise.all([
    sb.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    sb.from("enquiries").select("id,kind,name,status,created_at").order("created_at", { ascending: false }).limit(6),
    sb.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    sb.from("posts").select("id", { count: "exact", head: true }),
  ]);
  const admin = atLeast(staff.role, "admin");
  const L = (a: string, e: string) => (ar ? a : e);
  const tasks: { href: string; icon: IconName; title: string; text: string }[] = [
    { href: "/admin/pages", icon: "layers", title: L("تعديل الصفحات والأقسام", "Edit pages and sections"), text: L("أضف أقسامًا أو أخفها أو رتّبها وعدّل نصوصها وصورها مع معاينة مباشرة.", "Add, hide or reorder sections and edit their text and images with a live preview.") },
    { href: "/admin/posts", icon: "book", title: L("كتابة مقال", "Write an article"), text: L("محرر احترافي مع محسّن SEO وجدولة النشر.", "A professional editor with an SEO optimiser and scheduling.") },
    { href: "/admin/media", icon: "image", title: L("الصور واستبدالها", "Images and replacing them"), text: L("ارفع صورًا، واعرف أين تُستخدم، واستبدل أي صورة في كل مكان.", "Upload, see where each image is used, and replace any image everywhere.") },
    ...(admin
      ? [
          { href: "/admin/settings?tab=theme", icon: "spark" as IconName, title: L("المظهر والألوان", "Look and colours"), text: L("الوضع الفاتح/الداكن، ألوان العلامة، الحركة والخلفية.", "Light/dark mode, brand colours, motion and background.") },
          { href: "/admin/settings?tab=contact", icon: "phone" as IconName, title: L("بيانات التواصل", "Contact details"), text: L("الهواتف والبريد وواتساب في كل الموقع.", "Phones, email and WhatsApp across the site.") },
          { href: "/admin/settings?tab=header", icon: "menu" as IconName, title: L("الرأس والتذييل والإعلان", "Header, footer and announcement"), text: L("زر الحجز وشريط الإعلان وما يظهر في التذييل.", "The booking button, announcement bar and footer content.") },
          { href: "/admin/languages", icon: "globe" as IconName, title: L("اللغات ولغة الدخول", "Languages and landing language"), text: L("اختر اللغة التي يفتح بها الموقع وفعّل اللغات.", "Choose the language the site opens in and enable languages.") },
          { href: "/admin/users", icon: "team" as IconName, title: L("دعوة فريقك", "Invite your team"), text: L("أضف محررين أو مسؤولين بصلاحيات محددة.", "Add editors or admins with the right permissions.") },
        ]
      : []),
    { href: "/admin/account", icon: "shield", title: L("كلمة المرور والحساب", "Password and account"), text: L("غيّر كلمة المرور واسمك، أو اخرج من كل الأجهزة.", "Change your password and name, or sign out everywhere.") },
  ];
  const stat = (label: string, value: number | null, href: string) => (
    <Link href={href} className="rounded-lg border border-rule bg-surface p-5 transition-colors hover:border-blue">
      <p className="text-sm text-muted">{label}</p>
      <p className="tnum mt-2 font-display text-4xl font-semibold text-ink">{value ?? 0}</p>
    </Link>
  );
  return (
    <>
      <PageTitle title={ar ? `أهلًا ${staff.full_name ?? ""}` : `Welcome ${staff.full_name ?? ""}`} intro={ar ? "نظرة سريعة على الموقع والطلبات واكتمال الترجمات." : "An overview of the site, incoming requests and translation coverage."} />
      {/* Task hub: what people come here to do, in plain words, each one click from the right screen. */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-muted">{ar ? "ماذا تريد أن تفعل؟" : "What would you like to do?"}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tasks.map((x) => (
            <li key={x.href}>
              <Link href={x.href} className="group flex h-full items-start gap-3 rounded-xl border border-rule bg-surface p-4 transition-colors hover:border-blue">
                <span className="grid size-10 flex-none place-items-center rounded-xl bg-blue-wash text-blue"><Icon name={x.icon} size={19} /></span>
                <span className="min-w-0">
                  <b className="block text-sm font-semibold text-ink group-hover:text-blue">{x.title}</b>
                  <span className="mt-0.5 block text-xs text-muted">{x.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat(ar ? "طلبات جديدة" : "New enquiries", newCount, "/admin/enquiries")}
        {stat(ar ? "مشتركون مؤكَّدون" : "Confirmed subscribers", subs, "/admin/newsletter")}
        {stat(ar ? "مقالات" : "Articles", posts, "/admin/posts")}
        {stat(ar ? "لغات مفعّلة" : "Enabled languages", enabled.length, "/admin/languages")}
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-rule bg-surface p-5">
          <h2 className="font-semibold text-ink">{ar ? "اكتمال الترجمة" : "Translation coverage"}</h2>
          <table className="mt-4 w-full text-sm">
            <thead><tr className="text-start text-muted"><th className="py-2 text-start font-medium">{ar ? "القسم" : "Section"}</th>{enabled.map((l) => <th key={l.code} className="py-2 text-end font-medium">{l.native_name}</th>)}</tr></thead>
            <tbody>
              {coverage.map((c) => (
                <tr key={c.table} className="border-t border-rule">
                  <td className="py-2"><Link href={c.href} className="hover:text-blue">{c.label[ar ? 0 : 1]}</Link> <span className="text-faint">({c.total})</span></td>
                  {enabled.map((l) => {
                    const m = c.missing[l.code] ?? 0;
                    return <td key={l.code} className={`tnum py-2 text-end ${m ? "text-orange-text" : "text-success"}`}>{m ? `${m} ${ar ? "ناقص" : "missing"}` : "✓"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="rounded-lg border border-rule bg-surface p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold text-ink">{ar ? "أحدث الطلبات" : "Latest enquiries"}</h2><Link href="/admin/enquiries" className="text-sm text-blue">{ar ? "الكل" : "All"}</Link></div>
          <ul className="mt-3 divide-y divide-rule">
            {(recent ?? []).length === 0 && <li className="py-6 text-center text-sm text-muted">{ar ? "لا توجد طلبات بعد." : "No enquiries yet."}</li>}
            {(recent ?? []).map((e) => (
              <li key={e.id}><Link href={`/admin/enquiries/${e.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-blue"><span className="truncate">{e.name} <span className="text-xs text-faint">· {e.kind}</span></span><span className="text-xs text-muted">{new Date(e.created_at).toLocaleDateString(ar ? "ar-EG-u-nu-latn" : "en-GB")}</span></Link></li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
