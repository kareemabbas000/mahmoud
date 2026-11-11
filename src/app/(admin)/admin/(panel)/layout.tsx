import Link from "next/link";
import { requirePage, atLeast } from "@/lib/admin/auth";
import { getAdminT } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { AdminProvider, type AdminLang } from "@/components/admin/AdminContext";
import { Sidebar, type NavGroup } from "@/components/admin/Sidebar";
import { LocaleToggle } from "@/components/admin/LocaleToggle";
import { signOut } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { staff } = await requirePage("viewer");
  const { t, locale } = await getAdminT();
  const sb = (await sessionClient())!;
  const [{ data: langs }, { count: newEnquiries }] = await Promise.all([
    sb.from("languages").select("code,native_name,dir,enabled,is_default").order("sort"),
    sb.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  const admin = atLeast(staff.role, "admin");
  const groups: NavGroup[] = [
    { label: t("nav.dashboard"), items: [{ href: "/admin", icon: "chart", label: t("nav.dashboard") }] },
    {
      label: t("nav.content"),
      items: [
        { href: "/admin/pages", icon: "layers", label: t("nav.pages") },
        { href: "/admin/posts", icon: "book", label: t("nav.posts") },
        { href: "/admin/c/services", icon: "audit", label: t("nav.services") },
        { href: "/admin/c/team", icon: "team", label: t("nav.team") },
        { href: "/admin/c/clients", icon: "handshake", label: t("nav.clients") },
        { href: "/admin/c/certificates", icon: "shield", label: t("nav.certificates") },
        { href: "/admin/c/branches", icon: "pin", label: t("nav.branches") },
        { href: "/admin/c/faqs", icon: "help", label: t("nav.faqs") },
        { href: "/admin/c/gallery", icon: "image", label: t("nav.gallery") },
        { href: "/admin/taxonomy", icon: "ledger", label: t("nav.taxonomy") },
        { href: "/admin/media", icon: "image", label: t("nav.media") },
      ],
    },
    {
      label: t("nav.engage"),
      items: [
        { href: "/admin/enquiries", icon: "mail", label: t("nav.enquiries"), badge: newEnquiries ?? 0 },
        { href: "/admin/newsletter", icon: "mail", label: t("nav.newsletter") },
      ],
    },
    {
      label: t("nav.site"),
      items: [
        { href: "/admin/translations", icon: "globe", label: t("nav.translations") },
        ...(admin
          ? [
              { href: "/admin/settings", icon: "spark", label: t("nav.settings") },
              { href: "/admin/menus", icon: "menu", label: t("nav.menus") },
              { href: "/admin/languages", icon: "globe", label: t("nav.languages") },
              { href: "/admin/tracking", icon: "chart", label: t("nav.tracking") },
              { href: "/admin/c/redirects", icon: "arrow", label: t("nav.redirects") },
            ]
          : []),
      ],
    },
    ...(admin ? [{ label: t("nav.admin"), items: [{ href: "/admin/users", icon: "team", label: t("nav.users") }, { href: "/admin/audit", icon: "clock", label: t("nav.audit") }] }] : []),
  ];
  return (
    <AdminProvider locale={locale} role={staff.role} langs={(langs ?? []) as AdminLang[]}>
      <Sidebar
        title={t("app.title")}
        groups={groups}
        footer={
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-wash font-semibold text-blue">{(staff.full_name || staff.email).slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{staff.full_name || staff.email}</p>
                <p className="text-xs text-faint">{t(`role.${staff.role}` as never)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <LocaleToggle locale={locale} />
              <Link href={`/${locale}`} target="_blank" className="rounded-full border border-rule px-3 py-1.5 hover:bg-paper-2">{t("app.view_site")} ↗</Link>
              <form action={signOut}><button className="rounded-full border border-rule px-3 py-1.5 hover:bg-paper-2">{t("app.sign_out")}</button></form>
            </div>
          </div>
        }
      />
      <div className="min-h-dvh lg:ps-72">
        <main className="adm-main mx-auto max-w-[100rem] px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pt-8">{children}</main>
      </div>
    </AdminProvider>
  );
}
