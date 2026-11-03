import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { href, waLink } from "@/lib/i18n";
import type { Site } from "@/lib/site";

/**
 * Phones: an app-style dock pinned above the home indicator (call · WhatsApp · book), so nothing floats over content.
 * Tablets and up: the WhatsApp pill in the corner.
 */
export function FloatingContact({ site }: { site: Site }) {
  const { floating, contact, header } = site.settings;
  const phone = contact.phones[0];
  const wa = floating.whatsapp && contact.whatsapp ? waLink(contact.whatsapp) : null;
  const cta = header.show_cta ? { label: site.l(header.cta_label), href: href(header.cta_url, site.locale) } : null;
  return (
    <>
      <nav className="m-dock md:hidden" aria-label={site.locale === "ar" ? "تواصل سريع" : "Quick contact"}>
        {floating.call && phone && (
          <a href={`tel:${phone}`} className="m-dock-btn" aria-label={site.t("common.call")}>
            <Icon name="phone" size={19} />
            <span>{site.t("common.call")}</span>
          </a>
        )}
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" data-track="whatsapp_click" className="m-dock-btn is-wa" aria-label={site.t("common.whatsapp")}>
            <Icon name="whatsapp" size={20} />
            <span>{site.t("common.whatsapp")}</span>
          </a>
        )}
        {cta && (
          <Link href={cta.href} className="m-dock-cta">
            {cta.label}
            <Icon name="arrow" size={15} className="flip-rtl" />
          </Link>
        )}
      </nav>
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={site.t("common.whatsapp")}
          data-track="whatsapp_click"
          className="fixed z-30 hidden h-12 items-center gap-2 rounded-full bg-[#128C4A] px-3.5 text-white shadow-soft transition-transform hover:-translate-y-0.5 md:inline-flex"
          style={{ insetInlineEnd: "1.25rem", bottom: "1.25rem" }}
        >
          <Icon name="whatsapp" size={22} />
          <span className="pe-1 text-sm font-semibold">{site.t("common.whatsapp")}</span>
        </a>
      )}
    </>
  );
}
