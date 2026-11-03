import { Emph } from "./Section";
import { num } from "@/lib/i18n";
import type { BlockProps, HeadProps } from "./types";
import type { L } from "@/lib/types";

type P = HeadProps & { text?: L };

/** Abstract constellation (decorative, not data): nodes light up and connect as the clients figure counts. */
function Constellation() {
  const pts = [[12, 70], [26, 40], [40, 62], [52, 28], [64, 55], [78, 34], [88, 66], [70, 80], [34, 84], [56, 72]] as const;
  const links = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 9], [9, 2], [8, 2], [8, 0], [4, 9]] as const;
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      {links.map(([a, b], i) => (
        <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke="var(--deep-muted)" strokeOpacity="0.35" strokeWidth="0.3" data-draw style={{ ["--i" as string]: i } as React.CSSProperties} />
      ))}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.4 : 0.9} fill={i === 3 ? "var(--orange)" : "var(--deep-ink)"} data-node style={{ ["--i" as string]: i } as React.CSSProperties} />
      ))}
    </svg>
  );
}

function Gauge({ accent = false }: { accent?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className="size-28 -rotate-90 rtl:scale-y-[-1]" aria-hidden="true">
      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--deep-rule)" strokeWidth="2" />
      <circle cx="60" cy="60" r="52" fill="none" stroke={accent ? "var(--orange)" : "#a9aeff"} strokeWidth="3" strokeLinecap="round" pathLength={100} strokeDasharray="100" strokeDashoffset="100" data-ring />
      {Array.from({ length: 24 }).map((_, i) => (
        <line key={i} x1="60" y1="2" x2="60" y2={i % 6 === 0 ? 9 : 6} stroke="var(--deep-muted)" strokeOpacity="0.4" strokeWidth="1" transform={`rotate(${i * 15} 60 60)`} />
      ))}
    </svg>
  );
}

/** "Why SCO": an animated bento of the firm's published figures; every number counts up in the page's numerals. */
export function Stats({ site, props, refCode }: BlockProps<P>) {
  const { stats, brand } = site.settings;
  const now = new Date().getFullYear();
  const years = now - brand.founded_year;
  const get = (k: string) => stats.items.find((x) => x.key === k);
  const visible = (k: string) => {
    const it = get(k);
    return it && (it.auto_years || (stats.visible && it.value !== null));
  };
  const fig = (value: number, suffix = "") => (
    <span className="tnum" data-count={value} data-suffix={suffix}>
      {num(value, site.locale, site.numerals)}
      {suffix}
    </span>
  );
  const yearsIt = get("years");
  const clients = get("clients");
  const services = get("services");
  const consult = get("consultations");
  return (
    <section className="grain relative overflow-hidden bg-deep text-deep-muted" data-spot>
      <div aria-hidden="true" className="stats-mesh pointer-events-none absolute inset-0" />
      <div className="ledger-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="container-x relative z-[2] py-24 md:py-32">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-4">
              <span className="wp-ref !text-deep-muted">{refCode}</span>
              {props.eyebrow && <span className="eyebrow !text-orange">{site.l(props.eyebrow)}</span>}
            </div>
            <h2 className="display d-1 mt-5 !text-deep-ink" data-split>
              <Emph text={site.l(props.title)} />
            </h2>
          </div>
          {props.text && <p className="text-lg leading-relaxed text-deep-muted lg:col-span-5" data-reveal>{site.l(props.text)}</p>}
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-6 lg:mt-20" data-stagger>
          {visible("years") && yearsIt && (
            <article className="stat-tile relative overflow-hidden rounded-3xl border border-deep-rule bg-white/[0.03] p-8 backdrop-blur-sm md:col-span-6 lg:col-span-4 lg:row-span-2" data-tilt>
              <p className="text-sm text-deep-muted">{site.l(yearsIt.label)}</p>
              <p className="mt-2 font-display text-[clamp(5rem,12vw,9rem)] font-bold leading-none text-deep-ink">{fig(years)}</p>
              <div className="mt-10" aria-hidden="true">
                <svg viewBox="0 0 300 60" className="w-full overflow-visible rtl:-scale-x-100">
                  <line x1="0" y1="40" x2="300" y2="40" stroke="var(--deep-rule)" strokeWidth="1" />
                  <line x1="0" y1="40" x2="300" y2="40" stroke="var(--orange)" strokeWidth="2" pathLength={100} strokeDasharray="100" strokeDashoffset="100" data-ring />
                  {Array.from({ length: years + 1 }).map((_, i) => (
                    <line key={i} x1={(i / years) * 300} y1={i % 5 === 0 ? 30 : 35} x2={(i / years) * 300} y2="40" stroke="var(--deep-muted)" strokeOpacity={i % 5 === 0 ? 0.8 : 0.35} />
                  ))}
                  <circle cx="0" cy="40" r="5" fill="var(--orange)" data-travel="300" />
                </svg>
                <div className="tnum mt-3 flex justify-between font-display text-sm text-deep-ink">
                  <span>{num(brand.founded_year, site.locale, site.numerals, false)}</span>
                  <span>{num(now, site.locale, site.numerals, false)}</span>
                </div>
              </div>
            </article>
          )}
          {visible("clients") && clients && (
            <article className="stat-tile relative min-h-64 overflow-hidden rounded-3xl border border-deep-rule bg-white/[0.03] p-8 md:col-span-3 lg:col-span-4" data-tilt data-constellation>
              <Constellation />
              <div className="relative">
                <p className="font-display text-[clamp(3.5rem,7vw,5.5rem)] font-bold leading-none text-deep-ink">{fig(clients.value ?? 0, clients.suffix ?? "+")}</p>
                <p className="mt-3 text-deep-muted">{site.l(clients.label)}</p>
              </div>
            </article>
          )}
          {visible("services") && services && (
            <article className="stat-tile relative flex items-center gap-6 overflow-hidden rounded-3xl border border-deep-rule bg-white/[0.03] p-8 md:col-span-3 lg:col-span-2 lg:flex-col lg:items-start" data-tilt>
              <Gauge />
              <div>
                <p className="font-display text-[clamp(2.4rem,4vw,3.4rem)] font-bold leading-none text-deep-ink">{fig(services.value ?? 0)}</p>
                <p className="mt-2 text-sm text-deep-muted">{site.l(services.label)}</p>
              </div>
            </article>
          )}
          {visible("consultations") && consult && (
            <article className="stat-tile relative flex items-center gap-6 overflow-hidden rounded-3xl border border-orange/30 bg-orange/[0.06] p-8 md:col-span-6 lg:col-span-8" data-tilt>
              <Gauge accent />
              <div className="flex-1">
                <p className="font-display text-[clamp(3rem,6vw,5rem)] font-bold leading-none text-deep-ink">{fig(consult.value ?? 0)}</p>
                <p className="mt-2 text-deep-muted">{site.l(consult.label)}</p>
              </div>
              <svg viewBox="0 0 48 48" className="hidden size-20 shrink-0 md:block" aria-hidden="true">
                <path d="M10 25 19 34 38 13" fill="none" stroke="var(--orange)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={100} strokeDasharray="100" strokeDashoffset="100" data-ring />
              </svg>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
