import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Emph } from "./Section";
import { href as h, num } from "@/lib/i18n";
import type { BlockProps, HeadProps, LinkProp } from "./types";
import type { L } from "@/lib/types";

/** Line icons for the six audit stages: plan, policies, controls, letter, year-end, report. */
const STEP_ICONS = [
  <g key="plan"><circle cx="16" cy="16" r="11" /><circle cx="16" cy="16" r="6" /><circle cx="16" cy="16" r="1.6" className="fill" /><path d="M16 2v4M16 26v4M2 16h4M26 16h4" /></g>,
  <g key="pol"><path d="M8 4h11l5 5v12" /><path d="M19 4v5h5" /><path d="M8 4v24h8" /><path d="M12 13h7M12 17h5" /><circle cx="22" cy="23" r="4" /><path d="m25 26 3.5 3.5" /></g>,
  <g key="ctl"><path d="M16 3 26 7v8c0 7-4.5 11.5-10 14C10.5 26.5 6 22 6 15V7Z" /><path d="m11.5 16 3.2 3.2 6-6.4" /></g>,
  <g key="ltr"><rect x="4" y="8" width="24" height="17" rx="2.5" /><path d="m5 10 11 8 11-8" /><path d="M21 4h7v7" className="accent" /></g>,
  <g key="ye"><path d="M16 4 28 10 16 16 4 10Z" /><path d="m4 16 12 6 12-6" /><path d="m4 22 12 6 12-6" /></g>,
  <g key="rep"><circle cx="16" cy="13" r="9" /><path d="m12 13 3 3 5-6" /><path d="M11 21.5 9 29l7-3 7 3-2-7.5" /></g>,
];

type P = HeadProps & { steps?: { title: L; text: L }[]; link?: LinkProp };

/**
 * The engagement journey as a sticky "deck" scene (desktop): the section is tall, its stage is
 * CSS-sticky, and ScrollScenes scrubs the cards from scroll progress. No pinning, no DOM moves —
 * safe with React navigation. Mobile: a vertical sequence.
 */
export function Process({ site, props }: BlockProps<P>) {
  const steps = props.steps ?? [];
  if (!steps.length) return null;
  const n = (i: number) => num(i, site.locale, site.numerals).padStart(2, site.locale === "ar" && site.numerals === "arab" ? "٠" : "0");
  return (
    <section data-steps style={{ ["--steps" as string]: steps.length } as React.CSSProperties} className="steps-section relative mt-10 bg-deep pt-6 text-deep-muted lg:mt-16">
      <div className="ledger-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="steps-stage scene-stage relative lg:sticky lg:flex lg:items-center">
        <div className="container-x grid w-full gap-12 py-20 lg:grid-cols-12 lg:gap-16 lg:py-0">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-4">
              {props.eyebrow && <span className="eyebrow !text-orange">{site.l(props.eyebrow)}</span>}
            </div>
            <h2 className="display d-2 mt-5 !text-deep-ink" data-split>
              <Emph text={site.l(props.title)} />
            </h2>
            {props.intro && <p className="mt-5 max-w-md text-deep-muted">{site.l(props.intro)}</p>}
            {props.link && (
              <Link href={h(props.link.href, site.locale)} className="link-arrow mt-5 text-sm !text-[#ffb08a]">
                {site.l(props.link.label)}
                <Icon name="arrow" size={16} className="arrow flip-rtl" />
              </Link>
            )}
            <div className="steps-count mt-10 hidden items-end gap-4 lg:flex" aria-hidden="true">
              <span data-step-counter className="tnum font-display text-7xl font-semibold leading-none text-orange">{n(1)}</span>
              <span className="tnum pb-2 font-display text-2xl text-deep-muted">/ {n(steps.length)}</span>
            </div>
            <div className="mt-6 hidden h-px w-full max-w-md bg-deep-rule lg:block" aria-hidden="true">
              <div data-step-bar className="h-px w-full origin-left scale-x-0 bg-orange rtl:origin-right" />
            </div>
            <ol className="steps-list mt-6 hidden max-w-md gap-1 lg:grid" aria-hidden="true">
              {steps.map((s, i) => (
                <li key={i} data-step-label className="flex items-baseline gap-3 text-sm text-deep-muted/60 transition-colors">
                  <span className="wp-ref !text-inherit">{n(i + 1)}</span>
                  {site.l(s.title)}
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:col-span-7">
            <ol className="steps-deck m-stack grid gap-5 lg:relative lg:block" data-mstack>
              {steps.map((s, i) => {
                const last = i === steps.length - 1;
                return (
                  <li key={i} data-step-card className={`step-card relative flex flex-col overflow-hidden rounded-[1.75rem] p-7 lg:absolute lg:inset-0 lg:p-10 ${last ? "is-last" : ""}`} style={{ zIndex: steps.length - i, ["--i" as string]: i } as React.CSSProperties}>
                    <span aria-hidden="true" className="step-mesh" />
                    <div className="relative flex items-center gap-4">
                      <span className="step-icon" aria-hidden="true">
                        <svg viewBox="0 0 32 32">{STEP_ICONS[i % STEP_ICONS.length]}</svg>
                      </span>
                      <span className="step-pill">
                        {site.locale === "ar" ? "المرحلة" : "Stage"} <b className="tnum" dir="ltr">{n(i + 1)}</b>
                        <span className="opacity-50"> / </span>
                        <span className="tnum" dir="ltr">{n(steps.length)}</span>
                      </span>
                    </div>
                    <h3 className="display d-2 relative mt-auto pt-10 !text-deep-ink">{site.l(s.title)}</h3>
                    <p className="relative mt-4 max-w-xl text-lg leading-relaxed text-deep-muted">{site.l(s.text)}</p>
                    <div className="step-track relative mt-8" aria-hidden="true">
                      {steps.map((_, k) => <span key={k} className={k < i ? "is-done" : k === i ? "is-now" : ""} />)}
                    </div>
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
