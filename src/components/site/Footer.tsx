import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "./Logo";
import { NewsletterForm } from "./forms/NewsletterForm";
import { CookieSettingsLink } from "./consent/CookieSettingsLink";
import { href, prettyPhone, tr, waLink } from "@/lib/i18n";
import type { Site } from "@/lib/site";
import type { Branch } from "@/lib/types";

export function Footer({ site, branch }: { site: Site; branch: Branch | null }) {
  const { settings, locale, t, l } = site;
  const f = settings.footer;
  const footerMenu = site.menus.find((m) => m.location === "footer");
  const socials = settings.social.filter((s) => s.enabled && s.url);

  return (
    <footer className="relative overflow-hidden bg-deep text-deep-muted" data-theme-scope="deep">
      <div className="ledger-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="container-x relative pt-20 pb-10">
        <div className="footer-top grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-12 lg:gap-12">
          <div className="col-span-2 lg:col-span-4">
            <Logo site={site} onDeep />
            <p className="mt-6 max-w-sm leading-relaxed">{l(f.about)}</p>
            {f.show_social && socials.length > 0 && (
              <ul className="mt-8 flex gap-2" aria-label={t("footer.follow")}>
                {socials.map((s) => (
                  <li key={s.platform}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.platform}
                      className="inline-flex size-10 items-center justify-center rounded-full border border-deep-rule text-deep-ink transition-colors hover:border-orange hover:text-orange"
                    >
                      <Icon name={s.platform} size={18} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {f.show_services && (
            <div className="lg:col-span-3">
              <h2 className="mb-5 text-sm font-semibold text-deep-ink">{t("footer.services")}</h2>
              <ul className="grid gap-2.5">
                {site.services.map((s) => (
                  <li key={s.slug} className="flex items-baseline gap-3">
                    <Link href={href(`/services/${s.slug}`, locale)} className="link-u hover:text-deep-ink">
                      {l(s.name)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {footerMenu?.items.map((group) => (
            <div key={group.id} className="lg:col-span-2">
              <h2 className="mb-5 text-sm font-semibold text-deep-ink">{tr(group.label, locale, site.defaultLocale)}</h2>
              <ul className="grid gap-2.5">
                {(group.children ?? []).map((c) => (
                  <li key={c.id}>
                    <Link href={href(c.href, locale)} className="link-u hover:text-deep-ink">
                      {tr(c.label, locale, site.defaultLocale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom mt-16 grid gap-10 border-t border-deep-rule pt-12 lg:grid-cols-12">
          {f.show_contact && (
            <address className="not-italic lg:col-span-4">
              <h2 className="mb-5 text-sm font-semibold text-deep-ink">{t("footer.contact")}</h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                {branch && (
                  <div className="flex gap-3 sm:col-span-2">
                    <Icon name="pin" size={18} className="mt-1 shrink-0 text-orange" />
                    <div>
                      <dt className="sr-only">{t("common.address")}</dt>
                      <dd className="text-deep-ink">{l(branch.address)}</dd>
                      <dd className="text-sm">{l(branch.landmark)}</dd>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <Icon name="phone" size={18} className="mt-1 shrink-0 text-orange" />
                  <div>
                    <dt className="sr-only">{t("common.phone")}</dt>
                    {[...settings.contact.phones, ...settings.contact.landlines].map((p) => (
                      <dd key={p}>
                        <a href={`tel:${p}`} className="tnum text-deep-ink hover:text-orange">
                          <bdi dir="ltr">{prettyPhone(p)}</bdi>
                        </a>
                      </dd>
                    ))}
                  </div>
                </div>
                <div className="grid content-start gap-3">
                  <div className="flex gap-3">
                    <Icon name="mail" size={18} className="mt-1 shrink-0 text-orange" />
                    <div>
                      <dt className="sr-only">{t("common.email")}</dt>
                      <dd>
                        <a href={`mailto:${settings.contact.email}`} className="text-deep-ink hover:text-orange">
                          <bdi dir="ltr">{settings.contact.email}</bdi>
                        </a>
                      </dd>
                    </div>
                  </div>
                  {settings.contact.whatsapp && (
                    <div className="flex gap-3">
                      <Icon name="whatsapp" size={18} className="mt-1 shrink-0 text-orange" />
                      <div>
                        <dt className="sr-only">{t("common.whatsapp")}</dt>
                        <dd>
                          <a href={waLink(settings.contact.whatsapp)} target="_blank" rel="noopener noreferrer" className="text-deep-ink hover:text-orange">
                            <bdi dir="ltr">{prettyPhone(settings.contact.whatsapp)}</bdi>
                          </a>
                        </dd>
                      </div>
                    </div>
                  )}
                  {branch && l(branch.hours) && (
                    <div className="flex gap-3">
                      <Icon name="clock" size={18} className="mt-1 shrink-0 text-orange" />
                      <div>
                        <dt className="sr-only">{t("common.hours")}</dt>
                        <dd>{l(branch.hours)}</dd>
                      </div>
                    </div>
                  )}
                </div>
              </dl>
            </address>
          )}
          {f.show_map && branch?.lat && branch?.lng && (
            <figure className="footer-map relative overflow-hidden rounded-[1.5rem] border border-deep-rule lg:col-span-4">
              <iframe
                title={l(branch.name)}
                src={`https://maps.google.com/maps?q=${branch.lat},${branch.lng}&z=16&hl=${locale}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-56 w-full sm:h-64 lg:h-full lg:min-h-64"
              />
              <figcaption className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-full bg-[#070918]/85 px-4 py-2 text-xs text-deep-ink backdrop-blur">
                <span className="flex items-center gap-2 truncate"><Icon name="pin" size={14} className="shrink-0 text-orange" />{l(branch.name)}</span>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`} target="_blank" rel="noopener noreferrer" className="pointer-events-auto shrink-0 font-semibold text-orange">{t("common.directions")} ↗</a>
              </figcaption>
            </figure>
          )}
          {f.show_newsletter && (
            <div className="lg:col-span-4">
              <h2 className="mb-2 text-sm font-semibold text-deep-ink">{t("newsletter.title")}</h2>
              <p className="mb-5 text-sm">{t("newsletter.text")}</p>
              <NewsletterForm
                locale={locale}
                onDeep
                labels={{
                  placeholder: t("newsletter.placeholder"),
                  submit: t("newsletter.submit"),
                  success: t("newsletter.check_email"),
                  error: t("form.error_generic"),
                  invalid: t("form.error_email"),
                  rate: t("form.error_rate"),
                }}
              />
            </div>
          )}
        </div>

        <p
          className="pointer-events-none mt-16 select-none font-mono text-[clamp(4rem,17vw,15rem)] font-medium leading-[0.8] tracking-[0.12em] text-transparent [-webkit-text-stroke:1px_var(--deep-rule)]"
          aria-hidden="true"
          dir="ltr"
        >
          SCO
        </p>

        <div className="mt-6 flex flex-col gap-4 border-t border-deep-rule pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>{l(f.copyright)}</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link href={href("/privacy", locale)} className="hover:text-deep-ink">
                {t("cookie.policy")}
              </Link>
            </li>
            <li>
              <CookieSettingsLink label={t("footer.cookie_settings")} />
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
