import { SectionHead } from "./Section";
import { num } from "@/lib/i18n";
import type { BlockProps, HeadProps } from "./types";
import type { L } from "@/lib/types";

type P = HeadProps & { text?: L };

/**
 * "Why SCO" — an isometric 3D monument of the firm's figures (CSS 3D + animated @property heights).
 * Column heights use a log scale so every figure reads; columns rise in sequence as the section enters,
 * the stage tilts with the cursor, and the figures count up beneath. Works on phones (no WebGL needed).
 */
export function Stats({ site, props }: BlockProps<P>) {
  const { stats, brand } = site.settings;
  const now = new Date().getFullYear();
  const years = now - brand.founded_year;
  const items = stats.items
    .map((it) => ({ ...it, value: it.auto_years ? years : it.value }))
    .filter((it) => it.value !== null && (stats.visible || it.auto_years)) as { key: string; value: number; label: L }[];
  if (!items.length) return null;
  const max = Math.max(...items.map((i) => Math.log10(i.value + 1)));
  const h = (v: number) => Math.round(50 + (Math.log10(v + 1) / max) * 140); // px
  return (
    <section className="stats-stage-band relative overflow-hidden bg-deep text-deep-muted">
      <div aria-hidden="true" className="stats-glow pointer-events-none absolute inset-0" />
      <div className="container-x section-pad relative">
        <SectionHead site={site} head={{ eyebrow: props.eyebrow, title: props.title, intro: props.text }} align="center" onDeep />

        <div className="iso-wrap" data-reveal data-tilt>
          <div className="iso-plane" style={{ ["--n" as string]: items.length } as React.CSSProperties}>
            <div className="iso-floor" aria-hidden="true" />
            {items.map((it, i) => (
              <div
                key={it.key}
                className={`iso-bar ${it.key === "consultations" ? "is-accent" : ""}`}
                style={{ ["--h" as string]: `${h(it.value)}px`, ["--i" as string]: i } as React.CSSProperties}
                aria-hidden="true"
              >
                <span className="f-top" />
                <span className="f-front" />
                <span className="f-side" />
                <span className="f-glow" />
              </div>
            ))}
          </div>
        </div>

        <ul className="relative z-[1] mt-2 grid grid-cols-2 gap-4 md:mt-6 md:grid-cols-4" data-stagger>
          {items.map((it) => (
            <li key={it.key} className="iso-label rounded-2xl p-5 text-center">
              <p className="tnum font-display text-[clamp(2.2rem,3.4vw,3.2rem)] font-bold leading-none text-deep-ink" dir="ltr">
                <span data-count={it.value} data-suffix={it.key === "clients" ? "+" : ""}>
                  {num(it.value, site.locale, site.numerals)}
                  {it.key === "clients" ? "+" : ""}
                </span>
              </p>
              <p className="mt-2 text-sm text-deep-muted">{site.l(it.label)}</p>
              {it.key === "years" && (
                <p className="tnum mt-1 text-xs text-orange" dir="ltr">
                  {brand.founded_year} — {now}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
