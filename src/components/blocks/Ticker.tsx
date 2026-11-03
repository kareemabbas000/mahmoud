import type { BlockProps } from "./types";

/** Kinetic typography band: the firm's services in oversized outline type, two rows sliding against each other with scroll. */
export function Ticker({ site }: BlockProps) {
  const names = site.services.map((s) => site.l(s.name));
  const row = (solidEvery: number) =>
    [...names, ...names].map((n, i) => (
      <span key={i} className="flex items-center gap-12">
        <span className={`ticker-word ${i % solidEvery === 0 ? "solid" : ""}`}>{n}</span>
        <svg className="ticker-sep" viewBox="0 0 48 48" aria-hidden="true"><path d="M8 26 18 36 40 10" fill="none" stroke="var(--orange)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    ));
  return (
    <section dir="ltr" className="relative overflow-hidden border-y border-rule bg-paper py-10 md:py-16" aria-label={names.join("، ")} data-ticker>
      <div className="ticker-row" dir="ltr" data-ticker-row="1" aria-hidden="true">{row(4)}</div>
      <div className="ticker-row mt-2" dir="ltr" data-ticker-row="-1" aria-hidden="true">{row(3).reverse()}</div>
    </section>
  );
}
