import { Icon } from "@/components/ui/Icon";
import { ContactForm } from "@/components/site/forms/ContactForm";
import { getBranches } from "@/lib/data";
import { href as h, prettyPhone, waLink } from "@/lib/i18n";
import type { BlockProps } from "./types";
import type { Site } from "@/lib/site";

export function contactFormLabels(site: Site) {
  const t = site.t;
  return {
    name: t("form.name"), phone: t("form.phone"), email: t("form.email_optional"), company: t("form.company"), service: t("form.service"),
    general: t("form.service_general"), message: t("form.message"), consent: t("form.consent"), submit: t("form.submit_contact"), sending: t("form.sending"),
    successTitle: t("form.success_title"), successText: t("form.success_text"), errGeneric: t("form.error_generic"), errRate: t("form.error_rate"),
    errRequired: t("form.error_required"), errEmail: t("form.error_email"), errPhone: t("form.error_phone"), errConsent: t("form.error_consent"), phoneHint: t("form.phone_hint"),
  };
}

/** Contact: a deep "concierge" panel of channels + office, beside a raised glass form. */
export async function Contact({ site, props }: BlockProps<{ show_map?: boolean; service?: string }>) {
  const branches = await getBranches();
  const b = branches.find((x) => x.is_primary) ?? branches[0];
  const { contact } = site.settings;
  const ar = site.locale === "ar";
  const channels = [
    contact.whatsapp && { icon: "whatsapp", label: site.t("common.whatsapp"), value: prettyPhone(contact.whatsapp), href: waLink(contact.whatsapp), tone: "wa", ext: true },
    contact.phones[0] && { icon: "phone", label: site.t("common.call"), value: prettyPhone(contact.phones[0]), href: `tel:${contact.phones[0]}`, tone: "call", ext: false },
    { icon: "mail", label: site.t("common.email"), value: contact.email, href: `mailto:${contact.email}`, tone: "mail", ext: false },
  ].filter(Boolean) as { icon: string; label: string; value: string; href: string; tone: string; ext: boolean }[];
  return (
    <section className="relative">
      <div className="container-x section-pad">
        <div className="contact-shell grid overflow-hidden rounded-[2.25rem] lg:grid-cols-12">
          <aside className="contact-concierge relative p-8 text-deep-muted md:p-10 lg:col-span-5">
            <div className="ledger-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
            <div className="relative">
              <span className="eyebrow on-deep">{ar ? "تواصل مباشر" : "Direct lines"}</span>
              <h2 className="display d-1 mt-5 !text-white">{ar ? "لنبدأ الحديث" : "Let's talk"}</h2>
              <p className="mt-3 max-w-sm text-deep-muted">{ar ? "اختر الطريقة الأنسب لك، أو أرسل طلبك وسيعاود أحد المتخصصين الاتصال بك." : "Pick the channel that suits you, or send a request and a specialist will call you back."}</p>
              <ul className="mt-8 grid gap-3">
                {channels.map((c) => (
                  <li key={c.icon}>
                    <a href={c.href} {...(c.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={`channel channel-${c.tone} group flex items-center gap-4 rounded-2xl p-4`}>
                      <span className="channel-icon inline-flex size-12 shrink-0 items-center justify-center rounded-xl"><Icon name={c.icon} size={22} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs text-deep-muted">{c.label}</span>
                        <bdi dir="ltr" className="tnum block truncate font-semibold text-white">{c.value}</bdi>
                      </span>
                      <Icon name="arrow" size={18} className="flip-rtl text-white/50 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                    </a>
                  </li>
                ))}
              </ul>
              {b && (
                <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  {props.show_map !== false && b.lat && b.lng && (
                    <iframe
                      title={site.l(b.name)}
                      src={`https://maps.google.com/maps?q=${b.lat},${b.lng}&z=15&hl=${site.locale}&output=embed`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="contact-map block h-44 w-full"
                    />
                  )}
                  <div className="flex items-start gap-3 p-4">
                    <Icon name="pin" size={18} className="mt-1 shrink-0 text-orange" />
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold text-white">{site.l(b.address)}</p>
                      <p className="mt-1 text-deep-muted">{site.l(b.landmark)}</p>
                      {site.l(b.hours) && <p className="mt-2 text-deep-muted"><Icon name="clock" size={14} className="me-1 inline" />{site.l(b.hours)}</p>}
                      {b.lat && b.lng && (
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-orange">
                          {site.t("common.directions")} ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
          <div className="contact-formside relative p-8 md:p-12 lg:col-span-7">
            <p className="text-sm text-muted">{ar ? "نموذج الاستشارة" : "Consultation request"}</p>
            <h3 className="display d-2 mt-2">{ar ? "أخبرنا بما تحتاجه" : "Tell us what you need"}</h3>
            <div className="mt-8">
              <ContactForm
                locale={site.locale}
                services={site.services.map((s) => ({ slug: s.slug, name: site.l(s.name) }))}
                labels={contactFormLabels(site)}
                privacyHref={h("/privacy", site.locale)}
                defaultService={props.service ?? ""}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
