import { Emph } from "./Section";
import { num } from "@/lib/i18n";
import type { BlockProps, HeadProps } from "./types";
import type { L } from "@/lib/types";

type P = HeadProps & { steps?: { title: L; text: L }[] };

/**
 * The engagement journey as a sticky "deck" scene (desktop): the section is tall, its stage is
 * CSS-sticky, and ScrollScenes scrubs the cards from scroll progress. No pinning, no DOM moves —
 * safe with React navigation. Mobile: a vertical sequence.
 */
export function Process({ site, props, refCode }: BlockProps<P>) {
  const steps = props.steps ?? [];
  if (!steps.length) return null;
  const n = (i: number) => num(i, site.locale, site.numerals).padStart(2, site.locale === "ar" && site.numerals === "arab" ? "٠" : "0");
  return (
    <section data-steps style={{ ["--steps" as string]: steps.length } as React.CSSProperties} className="steps-section relative mt-10 bg-deep pt-6 text-deep-muted lg:mt-16">
      <div className="ledger-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="steps-stage relative lg:sticky lg:top-[7.5rem] lg:flex lg:h-[calc(100svh-7.5rem)] lg:items-center">
        <div className="container-x grid w-full gap-12 py-20 lg:grid-cols-12 lg:gap-16 lg:py-0">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-4">
              <span className="wp-ref !text-deep-muted">{refCode}</span>
              {props.eyebrow && <span className="eyebrow !text-orange">{site.l(props.eyebrow)}</span>}
            </div>
            <h2 className="display d-2 mt-5 !text-deep-ink" data-split>
              <Emph text={site.l(props.title)} />
            </h2>
            {props.intro && <p className="mt-5 max-w-md text-deep-muted">{site.l(props.intro)}</p>}
            <div className="mt-10 hidden items-end gap-4 lg:flex" aria-hidden="true">
              <span data-step-counter className="tnum font-display text-7xl font-semibold leading-none text-orange">{n(1)}</span>
              <span className="tnum pb-2 font-display text-2xl text-deep-muted">/ {n(steps.length)}</span>
            </div>
            <div className="mt-6 hidden h-px w-full max-w-md bg-deep-rule lg:block" aria-hidden="true">
              <div data-step-bar className="h-px w-full origin-left scale-x-0 bg-orange rtl:origin-right" />
            </div>
            <ol className="mt-6 hidden max-w-md gap-1 lg:grid" aria-hidden="true">
              {steps.map((s, i) => (
                <li key={i} data-step-label className="flex items-baseline gap-3 text-sm text-deep-muted/60 transition-colors">
                  <span className="wp-ref !text-inherit">{n(i + 1)}</span>
                  {site.l(s.title)}
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:col-span-7">
            <ol className="steps-deck grid gap-5 lg:relative lg:block lg:h-[min(26rem,58svh)]">
              {steps.map((s, i) => {
                const last = i === steps.length - 1;
                return (
                  <li
                    key={i}
                    data-step-card
                    className="relative flex flex-col overflow-hidden rounded-2xl border border-deep-rule bg-gradient-to-br from-deep-2 to-deep p-7 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.7)] lg:absolute lg:inset-0 lg:p-10"
                    style={{ zIndex: steps.length - i }}
                  >
                    <span aria-hidden="true" className="pointer-events-none absolute -end-6 -top-10 font-display text-[12rem] font-bold leading-none text-white/[0.03]">{n(i + 1)}</span>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-3 rounded-full border border-deep-rule px-3 py-1 text-xs text-deep-muted">
                        <span className="size-1.5 rounded-full bg-orange" />
                        {site.locale === "ar" ? "المرحلة" : "Stage"} {n(i + 1)}
                      </span>
                      {last && (
                        <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
                          <path d="M10 25 19 34 38 13" fill="none" stroke="var(--orange)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <h3 className="display d-2 mt-auto pt-10 !text-deep-ink">{site.l(s.title)}</h3>
                    <p className="mt-4 max-w-xl text-lg text-deep-muted">{site.l(s.text)}</p>
                    <span className="wp-ref mt-8 !text-deep-muted/60">{`${refCode}.${i + 1}`}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
