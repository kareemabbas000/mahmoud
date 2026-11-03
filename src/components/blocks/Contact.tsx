import { Icon } from "@/components/ui/Icon";
import { ContactForm } from "@/components/site/forms/ContactForm";
import { MapEmbed } from "./MapEmbed";
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

export async function Contact({ site, props }: BlockProps<{ show_map?: boolean; service?: string }>) {
  const branches = await getBranches();
  const { contact } = site.settings;
  return (
    <section className="bg-paper">
      <div className="container-x grid gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <ContactForm
            locale={site.locale}
            services={site.services.map((s) => ({ slug: s.slug, name: site.l(s.name) }))}
            labels={contactFormLabels(site)}
            privacyHref={h("/privacy", site.locale)}
            defaultService={props.service}
          />
        </div>
        <aside className="lg:col-span-5">
          <div className="sticky top-32 grid gap-6">
            {branches.map((b, i) => (
              <div key={i} className="rounded-lg border border-rule bg-surface p-6">
                <p className="eyebrow">{site.l(b.name)}</p>
                <dl className="mt-5 grid gap-4">
                  <div className="flex gap-3">
                    <Icon name="pin" size={20} className="mt-0.5 shrink-0 text-blue" />
                    <div>
                      <dt className="sr-only">{site.t("common.address")}</dt>
                      <dd className="font-medium text-ink">{site.l(b.address)}</dd>
                      <dd className="text-sm text-muted">{site.l(b.landmark)}</dd>
                      {b.lat && b.lng && (
                        <dd className="mt-2">
                          <a href={`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`} target="_blank" rel="noopener noreferrer" className="link-arrow text-sm">
                            {site.t("common.directions")}
                            <Icon name="external" size={14} />
                          </a>
                        </dd>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Icon name="phone" size={20} className="mt-0.5 shrink-0 text-blue" />
                    <div>
                      <dt className="sr-only">{site.t("common.phone")}</dt>
                      {b.phones.map((p) => (
                        <dd key={p}>
                          <a href={`tel:${p}`} className="tnum text-ink hover:text-blue"><bdi dir="ltr">{prettyPhone(p)}</bdi></a>
                        </dd>
                      ))}
                    </div>
                  </div>
                  {b.email && (
                    <div className="flex gap-3">
                      <Icon name="mail" size={20} className="mt-0.5 shrink-0 text-blue" />
                      <div>
                        <dt className="sr-only">{site.t("common.email")}</dt>
                        <dd><a href={`mailto:${b.email}`} className="text-ink hover:text-blue"><bdi dir="ltr">{b.email}</bdi></a></dd>
                      </div>
                    </div>
                  )}
                  {site.l(b.hours) && (
                    <div className="flex gap-3">
                      <Icon name="clock" size={20} className="mt-0.5 shrink-0 text-blue" />
                      <div>
                        <dt className="sr-only">{site.t("common.hours")}</dt>
                        <dd className="text-ink">{site.l(b.hours)}</dd>
                      </div>
                    </div>
                  )}
                </dl>
                {props.show_map !== false && b.lat && b.lng && (
                  <div className="mt-6">
                    <MapEmbed lat={b.lat} lng={b.lng} label={site.l(b.name)} loadLabel={site.locale === "ar" ? "عرض الخريطة" : "Show map"} />
                  </div>
                )}
              </div>
            ))}
            {contact.whatsapp && (
              <a href={waLink(contact.whatsapp)} target="_blank" rel="noopener noreferrer" data-track="whatsapp_click" className="btn w-full bg-[#128C4A] text-white hover:bg-[#0f7a40]">
                <Icon name="whatsapp" size={20} />
                {site.t("common.whatsapp")} · <bdi dir="ltr">{prettyPhone(contact.whatsapp)}</bdi>
              </a>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
