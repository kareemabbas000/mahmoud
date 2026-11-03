import { Icon } from "@/components/ui/Icon";
import { SectionHead } from "./Section";
import { num } from "@/lib/i18n";
import type { BlockProps, HeadProps } from "./types";
import type { L } from "@/lib/types";

type P = HeadProps & { text?: L };

const ICON: Record<string, string> = { years: "clock", clients: "team", services: "layers", consultations: "spark" };

/** "Why SCO": a bright gallery of the firm's published figures, each counting up as it enters. */
export function Stats({ site, props }: BlockProps<P>) {
  const { stats, brand } = site.settings;
  const now = new Date().getFullYear();
  const years = now - brand.founded_year;
  const items = stats.items
    .map((it) => ({ ...it, value: it.auto_years ? years : it.value }))
    .filter((it) => it.value !== null && (stats.visible || it.auto_years));
  const fmt = (v: number) => num(v, site.locale, site.numerals);
  return (
    <section className="stats-canvas relative overflow-hidden bg-paper">
      <div aria-hidden="true" className="stats-orbs pointer-events-none absolute inset-0" />
      <div className="container-x section-pad relative">
        <SectionHead site={site} head={{ eyebrow: props.eyebrow, title: props.title, intro: props.text }} align="center" />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-stagger>
          {items.map((it) => {
            const yearsCard = it.key === "years";
            return (
              <li
                key={it.key}
                data-tilt
                className={`stat-card group relative flex min-h-[17rem] flex-col overflow-hidden rounded-[1.75rem] p-7 ${yearsCard ? "bg-deep text-deep-muted" : "bg-surface"}`}
              >
                <span className={`inline-flex size-12 items-center justify-center rounded-2xl ${yearsCard ? "bg-white/10 text-orange" : "bg-gradient-to-br from-blue to-[#3b3ff5] text-white shadow-[0_12px_30px_-12px_var(--blue)]"}`}>
                  <Icon name={ICON[it.key] ?? "spark"} size={22} />
                </span>
                <p className={`stat-num tnum mt-auto pt-8 font-display text-[clamp(2.6rem,3.6vw,3.6rem)] font-bold leading-none ${yearsCard ? "text-deep-ink" : ""}`} dir="ltr">
                  <span data-count={it.value ?? 0} data-suffix={it.key === "clients" ? "+" : ""}>
                    {fmt(it.value ?? 0)}
                    {it.key === "clients" ? "+" : ""}
                  </span>
                </p>
                <p className={`mt-3 font-medium ${yearsCard ? "text-deep-ink" : "text-ink"}`}>{site.l(it.label)}</p>
                {yearsCard ? (
                  <div className="mt-5" aria-hidden="true">
                    <div className="relative h-1 rounded-full bg-white/10">
                      <span className="stat-line absolute inset-y-0 start-0 w-full origin-left rounded-full bg-gradient-to-r from-orange to-[#ffb08a] rtl:origin-right" />
                    </div>
                    <div className="tnum mt-2 flex justify-between text-xs text-deep-muted" dir="ltr">
                      <span>{brand.founded_year}</span>
                      <span>{now}</span>
                    </div>
                  </div>
                ) : (
                  <span className="stat-line mt-5 block h-0.5 w-16 origin-left rounded-full bg-orange rtl:origin-right" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
