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
    { label: t("nav.dashboard"), items: [{ href: "/admin", label: t("nav.dashboard") }] },
    {
      label: t("nav.content"),
      items: [
        { href: "/admin/pages", label: t("nav.pages") },
        { href: "/admin/posts", label: t("nav.posts") },
        { href: "/admin/c/services", label: t("nav.services") },
        { href: "/admin/c/team", label: t("nav.team") },
        { href: "/admin/c/clients", label: t("nav.clients") },
        { href: "/admin/c/certificates", label: t("nav.certificates") },
        { href: "/admin/c/branches", label: t("nav.branches") },
        { href: "/admin/c/faqs", label: t("nav.faqs") },
        { href: "/admin/c/gallery", label: t("nav.gallery") },
        { href: "/admin/taxonomy", label: t("nav.taxonomy") },
        { href: "/admin/media", label: t("nav.media") },
      ],
    },
    {
      label: t("nav.engage"),
      items: [
        { href: "/admin/enquiries", label: t("nav.enquiries"), badge: newEnquiries ?? 0 },
        { href: "/admin/newsletter", label: t("nav.newsletter") },
      ],
    },
    {
      label: t("nav.site"),
      items: [
        { href: "/admin/translations", label: t("nav.translations") },
        ...(admin
          ? [
              { href: "/admin/settings", label: t("nav.settings") },
              { href: "/admin/menus", label: t("nav.menus") },
              { href: "/admin/languages", label: t("nav.languages") },
              { href: "/admin/tracking", label: t("nav.tracking") },
              { href: "/admin/c/redirects", label: t("nav.redirects") },
            ]
          : []),
      ],
    },
    ...(admin ? [{ label: t("nav.admin"), items: [{ href: "/admin/users", label: t("nav.users") }, { href: "/admin/audit", label: t("nav.audit") }] }] : []),
  ];
  return (
    <AdminProvider locale={locale} role={staff.role} langs={(langs ?? []) as AdminLang[]}>
      <Sidebar
        groups={groups}
        footer={
          <div className="grid gap-3 text-sm">
            <div>
              <p className="truncate font-medium text-ink">{staff.full_name || staff.email}</p>
              <p className="text-xs text-faint">{t(`role.${staff.role}` as never)}</p>
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
        <main className="mx-auto max-w-6xl px-4 py-8 pt-16 lg:px-10 lg:pt-10">{children}</main>
      </div>
    </AdminProvider>
  );
}
