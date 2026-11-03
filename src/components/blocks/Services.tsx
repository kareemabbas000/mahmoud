import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Band, SectionHead } from "./Section";
import { ServicesExplorer } from "./ServicesExplorer";
import { href as h } from "@/lib/i18n";
import type { BlockProps, HeadProps } from "./types";

type P = HeadProps & { layout?: "grid" | "list" };

/** Services as a ledger index: reference, title, summary, and a tick that draws on hover. */
export function Services({ site, props, refCode }: BlockProps<P>) {
  const { services, locale } = site;
  const detailed = props.layout === "list";
  if (!detailed) {
    return (
      <section className="relative bg-surface">
        <ServicesExplorer
          more={site.t("common.learn_more")}
          head={<SectionHead site={site} head={props} align="stack" />}
          items={services.map((s, i) => ({
            slug: s.slug,
            num: String(i + 1).padStart(2, "0"),
            icon: s.icon,
            name: site.l(s.name),
            summary: site.l(s.summary),
            highlights: s.highlights[locale] ?? s.highlights[site.defaultLocale] ?? [],
            href: h(`/services/${s.slug}`, locale),
          }))}
        />
      </section>
    );
  }
  return (
    <Band tone="paper">
      <SectionHead site={site} refCode={refCode} head={props} />
      <ol className="border-b border-rule" data-stagger>
        {services.map((s, i) => (
          <li key={s.slug} className="border-t border-rule">
            <Link
              href={h(`/services/${s.slug}`, locale)}
              className="group grid grid-cols-[3rem_1fr_auto] items-start gap-x-4 gap-y-3 py-7 transition-colors md:grid-cols-[4rem_minmax(0,5fr)_minmax(0,6fr)_3rem] md:items-center md:gap-x-8 md:py-9"
            >
              <span className="wp-ref pt-2 md:pt-0">B·{String(i + 1).padStart(2, "0")}</span>
              <span className="flex items-center gap-4">
                <span className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-rule text-blue transition-colors group-hover:border-blue group-hover:bg-blue group-hover:text-on-blue">
                  <Icon name={s.icon} size={22} />
                </span>
                <span className="display d-3 transition-colors group-hover:text-blue">{site.l(s.name)}</span>
              </span>
              <span className="col-span-3 text-muted md:col-span-1 md:col-start-3 md:row-start-1">
                {site.l(s.summary)}
                {detailed && (
                  <span className="mt-4 flex flex-wrap gap-2">
                    {(s.highlights[locale] ?? s.highlights[site.defaultLocale] ?? []).map((x) => (
                      <span key={x} className="rounded-full border border-rule px-3 py-1 text-xs text-text">{x}</span>
                    ))}
                  </span>
                )}
              </span>
              <span className="col-start-3 row-start-1 inline-flex size-11 items-center justify-center justify-self-end rounded-full border border-rule transition-all group-hover:border-orange group-hover:bg-orange group-hover:text-on-orange md:col-start-4">
                <Icon name="arrow" size={18} className="flip-rtl" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Band>
  );
}
