/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Emph } from "./Section";
import { HeroStage } from "./HeroStage";
import { getClients, getServices } from "@/lib/data";
import { href as h, prettyPhone, waLink } from "@/lib/i18n";
import type { BlockProps, LinkProp } from "./types";
import type { L } from "@/lib/types";

type P = { eyebrow?: L; title?: L; subtitle?: L; primary?: LinkProp; secondary?: LinkProp; show_contacts?: boolean };

/** Opening: headline and actions beside a CSS-3D "stamped report" scene; trust row of client marks below. */
export async function Hero({ site, props }: BlockProps<P>) {
  const { settings, locale, t } = site;
  const phone = settings.contact.phones[0];
  const second = props.secondary;
  const [clients, services] = await Promise.all([getClients(), getServices()]);
  const logos = clients.filter((c) => c.featured && c.logo).slice(0, 8);
  const ar = locale === "ar";
  const chips = [
    { big: String(settings.brand.founded_year), small: ar ? "منذ عام" : "Since" },
    { big: "21145", small: t("credentials.reg_no") },
    ...(services.length ? [{ big: String(services.length), small: ar ? "خدمة متخصصة" : "specialist services" }] : []),
  ];
  return (
    <section data-hero className="hero relative isolate overflow-hidden">
      <div aria-hidden="true" className="hero-cone pointer-events-none absolute inset-x-0 top-0 -z-10 h-full" />
      <div data-hero-grid className="ledger-grid pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
      <div className="container-x relative grid min-h-[min(50rem,calc(100svh-6rem))] items-center gap-6 pb-10 pt-6 lg:grid-cols-12 lg:gap-10 lg:pt-12">
        {settings.theme.hero_3d !== false && (
          <div className="order-first lg:order-none lg:col-span-6 lg:col-start-7 lg:row-start-1">
            <HeroStage chips={chips} seal={ar ? "المكتب الاستشاري المتخصص • مراجعة • ضرائب • " : "SPECIALIZED CONSULTING OFFICE • AUDIT • TAX • "} ar={ar} />
          </div>
        )}
      <div className="flex flex-col items-center text-center lg:col-span-6 lg:col-start-1 lg:row-start-1 lg:items-start lg:text-start" data-hero-copy>
        <h1 className="display d-hero hero-title max-w-[16ch]" data-split>
          <Emph text={site.l(props.title)} />
        </h1>
        {props.subtitle && (
          <p className="lede mx-auto mt-6 max-w-xl lg:mx-0" data-reveal style={{ ["--d" as string]: "200ms" } as React.CSSProperties}>
            {site.l(props.subtitle)}
          </p>
        )}
        <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start" data-reveal style={{ ["--d" as string]: "320ms" } as React.CSSProperties}>
          {props.primary && (
            <Link href={h(props.primary.href, locale)} className="btn btn-accent">
              {site.l(props.primary.label)}
              <Icon name="arrow" size={16} className="arrow flip-rtl" />
            </Link>
          )}
          {second && (
            <Link href={second.href === "whatsapp" ? waLink(settings.contact.whatsapp) : h(second.href, locale)} className="btn btn-ghost">
              {site.l(second.label)}
            </Link>
          )}
        </div>
        {props.show_contacts && (
          <dl className="glass mt-10 inline-flex flex-wrap items-center justify-center gap-x-8 gap-y-2 rounded-full border border-rule px-6 py-3 text-sm" data-reveal style={{ ["--d" as string]: "420ms" } as React.CSSProperties}>
            {phone && (
              <div className="flex items-center gap-2">
                <dt className="sr-only">{t("common.phone")}</dt>
                <Icon name="phone" size={15} className="text-orange" />
                <dd><a href={`tel:${phone}`} className="tnum text-ink hover:text-orange"><bdi dir="ltr">{prettyPhone(phone)}</bdi></a></dd>
              </div>
            )}
            <div className="flex items-center gap-2">
              <dt className="sr-only">{t("common.email")}</dt>
              <Icon name="mail" size={15} className="text-orange" />
              <dd><a href={`mailto:${settings.contact.email}`} className="text-ink hover:text-orange"><bdi dir="ltr">{settings.contact.email}</bdi></a></dd>
            </div>
          </dl>
        )}
      </div>
        {logos.length > 0 && (
          <div className="w-full text-center lg:col-span-12" data-reveal style={{ ["--d" as string]: "520ms" } as React.CSSProperties}>
            <p className="text-xs text-faint">{locale === "ar" ? "موضع ثقة شركات ومؤسسات رائدة" : "Trusted by leading companies and institutions"}</p>
            <ul className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {logos.map((c) => (
                <li key={c.name.en ?? c.name.ar} className="hero-logo flex h-14 w-24 items-center justify-center rounded-xl px-3 sm:w-28">
                  <img src={c.logo!} alt={site.l(c.name)} className="max-h-9 w-auto object-contain" loading="eager" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
