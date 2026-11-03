import { HeaderClient, type NavItem } from "./HeaderClient";
import { Logo } from "./Logo";
import { href, prettyPhone, tr, waLink } from "@/lib/i18n";
import type { Site } from "@/lib/site";

export function Header({ site }: { site: Site }) {
  const { settings, locale, t } = site;
  const header = site.menus.find((m) => m.location === "header");
  const svcRefs = new Map(site.services.map((s, i) => [`/services/${s.slug}`, { ref: `B·${String(i + 1).padStart(2, "0")}`, summary: site.l(s.summary) }]));
  const iconFor = (u: string) => {
    const k = u.replace(/^\/+/, "").split("/")[0] ?? "";
    return ({ about: "building", services: "layers", team: "team", clients: "handshake", gallery: "image", insights: "book", blog: "book", faq: "help", contact: "phone", careers: "target" } as Record<string, string>)[k] ?? "spark";
  };
  const items: NavItem[] = (header?.items ?? []).map((it) => ({
    id: it.id,
    icon: iconFor(it.href),
    label: tr(it.label, locale, site.defaultLocale),
    href: href(it.href, locale),
    children: it.children?.map((c) => ({
      id: c.id,
      label: tr(c.label, locale, site.defaultLocale),
      href: href(c.href, locale),
      ...(svcRefs.get(c.href) ?? {}),
    })),
  }));
  const phone = settings.contact.phones[0];
  return (
    <HeaderClient
      locale={locale}
      logo={<Logo site={site} />}
      items={items}
      langs={site.langs.map((l) => ({ code: l.code, native: l.native_name }))}
      cta={settings.header.show_cta ? { label: site.l(settings.header.cta_label), href: href(settings.header.cta_url, locale) } : null}
      phone={settings.header.show_phone && phone ? { display: prettyPhone(phone), tel: phone } : null}
      email={settings.contact.email}
      whatsapp={settings.contact.whatsapp ? waLink(settings.contact.whatsapp) : null}
      showTheme={settings.header.show_theme_toggle}
      showLang={settings.header.show_language_switcher}
      labels={{
        open: t("a11y.menu_open"),
        close: t("a11y.menu_close"),
        theme: t("a11y.theme"),
        language: t("a11y.language"),
        nav: t("a11y.main_nav"),
        light: t("theme.light"),
        dark: t("theme.dark"),
        system: t("theme.system"),
        viewAll: t("common.view_all"),
      }}
    />
  );
}
