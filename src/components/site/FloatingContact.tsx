import { Icon } from "@/components/ui/Icon";
import { waLink } from "@/lib/i18n";
import type { Site } from "@/lib/site";

export function FloatingContact({ site }: { site: Site }) {
  const { floating, contact } = site.settings;
  if (!floating.whatsapp && !floating.call) return null;
  return (
    <div
      className="fixed z-30 flex flex-col gap-2"
      style={{ insetInlineEnd: "max(1rem, env(safe-area-inset-right, 0px))", bottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
    >
      {floating.call && contact.phones[0] && (
        <a
          href={`tel:${contact.phones[0]}`}
          aria-label={site.t("common.call")}
          className="inline-flex size-12 items-center justify-center rounded-full border border-rule bg-surface text-ink shadow-soft transition-transform hover:-translate-y-0.5 md:hidden"
        >
          <Icon name="phone" size={20} />
        </a>
      )}
      {floating.whatsapp && contact.whatsapp && (
        <a
          href={waLink(contact.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={site.t("common.whatsapp")}
          data-track="whatsapp_click"
          className="group inline-flex h-12 items-center gap-2 rounded-full bg-[#128C4A] px-3.5 text-white shadow-soft transition-transform hover:-translate-y-0.5"
        >
          <Icon name="whatsapp" size={22} />
          <span className="hidden pe-1 text-sm font-semibold sm:inline">{site.t("common.whatsapp")}</span>
        </a>
      )}
    </div>
  );
}
