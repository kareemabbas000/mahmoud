import { SectionHead } from "./Section";
import { num } from "@/lib/i18n";
import type { BlockProps, HeadProps } from "./types";
import type { L } from "@/lib/types";

type P = HeadProps & { steps?: { title: L; text: L }[] };

/**
 * The engagement journey. Desktop: the section pins and the steps travel horizontally with scroll
 * (ScrollScenes → [data-hscroll]); a ledger line fills as you go and the last step earns the tick.
 * Mobile / reduced motion: a vertical timeline.
 */
export function Process({ site, props, refCode }: BlockProps<P>) {
  const steps = props.steps ?? [];
  if (!steps.length) return null;
  return (
    <section data-hscroll className="relative overflow-hidden bg-deep text-deep-muted">
      <div className="ledger-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="relative flex min-h-[100svh] flex-col justify-center py-20 lg:min-h-[calc(100svh-7rem)] lg:py-10">
        <div className="container-x w-full">
          <SectionHead site={site} refCode={refCode} head={props} onDeep />
        </div>
        <div className="relative" data-hscroll-viewport>
          <div className="container-x">
            <div className="relative mb-8 hidden h-px bg-deep-rule lg:block" aria-hidden="true">
              <div data-hscroll-progress className="absolute inset-y-0 start-0 w-full origin-left scale-x-0 bg-orange rtl:origin-right" />
            </div>
          </div>
          <ol data-hscroll-track className="container-x grid gap-6 lg:mx-0 lg:flex lg:w-max lg:max-w-none lg:gap-8 lg:ps-[max(2.5rem,calc((100vw-1280px)/2+2.5rem))] lg:pe-[30vw]">
            {steps.map((s, i) => {
              const last = i === steps.length - 1;
              return (
                <li
                  key={i}
                  className="group relative flex flex-col gap-6 rounded-lg border border-deep-rule bg-deep-2/70 p-7 backdrop-blur-sm lg:w-[26rem] lg:shrink-0 lg:p-9"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-display text-7xl font-semibold leading-none text-transparent [-webkit-text-stroke:1px_var(--orange)] lg:text-8xl">
                      {num(i + 1, site.locale, site.numerals).padStart(2, site.locale === "ar" && site.numerals === "arab" ? "٠" : "0")}
                    </span>
                    {last && (
                      <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
                        <path d="M10 25 19 34 38 13" fill="none" stroke="var(--orange)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="tick-path animate" style={{ ["--len" as string]: 48, ["--d" as string]: "0.2s" } as React.CSSProperties} />
                      </svg>
                    )}
                  </div>
                  <h3 className="display d-3 !text-deep-ink">{site.l(s.title)}</h3>
                  <p className="text-deep-muted">{site.l(s.text)}</p>
                  <span className="wp-ref mt-auto !text-deep-muted/60">{`${refCode}.${i + 1}`}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
