import { Band, SectionHead } from "./Section";
import { num } from "@/lib/i18n";
import type { BlockProps, HeadProps } from "./types";
import type { L } from "@/lib/types";

type P = HeadProps & { text?: L };

/**
 * "Balance sheet" figures with dotted leaders and a double rule.
 * Only firm-confirmed figures are shown (settings.stats.visible); the years figure is derived from the founding year.
 */
export function Stats({ site, props, refCode }: BlockProps<P>) {
  const { stats, brand } = site.settings;
  const years = new Date().getFullYear() - brand.founded_year;
  const items = stats.items
    .map((it) => ({ ...it, value: it.auto_years ? years : it.value }))
    .filter((it) => it.value !== null && (stats.visible || it.auto_years));
  return (
    <Band tone="deep">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHead site={site} refCode={refCode} head={{ eyebrow: props.eyebrow, title: props.title }} align="stack" onDeep />
          {props.text && <p className="lede -mt-6 !text-deep-muted" data-reveal>{site.l(props.text)}</p>}
        </div>
        <dl className="self-end lg:col-span-6 lg:col-start-7">
          {items.map((it, i) => (
            <div key={it.key} className="flex items-baseline gap-4 border-b border-deep-rule py-5" data-reveal style={{ ["--d" as string]: `${i * 90}ms` } as React.CSSProperties}>
              <dt className="text-deep-ink">{site.l(it.label)}</dt>
              <span className="leader !border-deep-rule" aria-hidden="true" />
              <dd className="tnum font-display text-[clamp(2.4rem,4.6vw,3.6rem)] font-semibold leading-none text-orange" data-count={it.value ?? 0} data-suffix={it.suffix ?? ""}>
                {num(it.value ?? 0, site.locale, site.numerals)}
                {it.suffix ?? ""}
              </dd>
            </div>
          ))}
          <div className="mt-1 space-y-1" aria-hidden="true">
            <div className="h-px bg-deep-muted/40" />
            <div className="h-px bg-deep-muted/40" />
          </div>
        </dl>
      </div>
    </Band>
  );
}
