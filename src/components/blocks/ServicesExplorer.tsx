"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export type SvcView = { slug: string; num: string; icon: string; name: string; summary: string; highlights: string[]; href: string };

function jumpTo(i: number, n: number, sec: HTMLElement | null) {
  if (!sec) return;
  const top = sec.getBoundingClientRect().top + window.scrollY;
  const travel = sec.offsetHeight - window.innerHeight;
  window.scrollTo({ top: top + ((i + 0.5) / n) * travel, behavior: "smooth" });
}

/**
 * Desktop: scroll-locked scene — the section holds while each scroll step advances one service
 * (driven by ScrollScenes → [data-svc-scroll]). Mobile: swipeable snap cards.
 */
export function ServicesExplorer({ items, more, head }: { items: SvcView[]; more: string; head: React.ReactNode }) {
  const n = items.length;
  return (
    <>
      <div className="container-x section-pad lg:hidden">
        {head}
        <ul className="snap-x-row" aria-label={more}>
          {items.map((s) => (
            <li key={s.slug}>
              <Link href={s.href} className="flex h-full flex-col rounded-2xl border border-rule bg-surface p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-12 items-center justify-center rounded-xl bg-blue text-on-blue"><Icon name={s.icon} size={24} /></span>
                  <span className="font-display text-3xl font-bold text-rule-strong">{s.num}</span>
                </div>
                <h3 className="display d-3 mt-6">{s.name}</h3>
                <p className="mt-3 text-sm text-muted">{s.summary}</p>
                <ul className="mt-4 grid gap-2 text-sm">
                  {s.highlights.slice(0, 3).map((x) => <li key={x} className="flex items-start gap-2"><Icon name="check" size={16} className="mt-1 shrink-0 text-orange" />{x}</li>)}
                </ul>
                <span className="link-arrow mt-auto pt-5 text-sm">{more}<Icon name="arrow" size={16} className="arrow flip-rtl" /></span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="hidden lg:block" data-svc-scroll style={{ ["--n" as string]: n, height: `calc(${n} * 62svh + 40svh)` } as React.CSSProperties}>
        <div className="scene-stage svc-stage sticky flex items-center">
          <div className="container-x grid w-full grid-cols-12 items-center gap-12">
            <div className="col-span-5">
              {head}
              <ol className="mt-2 grid gap-1">
                {items.map((s, i) => (
                  <li key={s.slug}>
                    <button
                      type="button"
                      data-svc-item
                      onClick={(e) => jumpTo(i, n, (e.currentTarget.closest("[data-svc-scroll]") as HTMLElement) ?? null)}
                      className="svc-item group flex w-full items-center gap-4 rounded-xl px-4 py-3 text-start transition-colors"
                    >
                      <span className="tnum w-7 font-display text-sm text-faint transition-colors">{s.num}</span>
                      <span className="flex-1 font-display text-lg font-semibold text-muted transition-colors">{s.name}</span>
                      <span className="svc-bar h-0.5 w-0 rounded-full bg-orange transition-all duration-500" />
                    </button>
                  </li>
                ))}
              </ol>
              <div className="mt-6 h-1 w-full max-w-sm overflow-hidden rounded-full bg-paper-2" aria-hidden="true">
                <div data-svc-progress className="h-full w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-blue to-orange rtl:origin-right" />
              </div>
            </div>
            <div className="svc-panels relative col-span-7">
              {items.map((s, i) => (
                <article key={s.slug} data-svc-panel className={`svc-panel absolute inset-0 flex flex-col overflow-hidden rounded-[2rem] bg-deep text-deep-muted shadow-[0_40px_90px_-40px_rgb(11_16_51/0.55)] ${i === 0 ? "is-active" : ""}`}>
                  <div className="ledger-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
                  <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 end-4 font-display text-[11rem] font-bold leading-none text-white/[0.04]">{s.num}</span>
                  <div className="relative flex items-center gap-4">
                    <span className="svc-icon inline-flex items-center justify-center rounded-2xl bg-blue text-white shadow-[0_0_50px_-8px_var(--blue)]"><Icon name={s.icon} size={30} /></span>
                    <span className="tnum font-display text-sm text-deep-muted">{s.num} / {items[n - 1]!.num}</span>
                  </div>
                  <h3 className="display d-1 svc-title relative !text-deep-ink">{s.name}</h3>
                  <p className="relative mt-4 max-w-xl leading-relaxed">{s.summary}</p>
                  <ul className="relative mt-6 grid grid-cols-2 gap-x-6 gap-y-3">
                    {s.highlights.map((x) => <li key={x} className="flex items-start gap-2.5 text-sm text-deep-ink"><Icon name="check" size={16} className="mt-1 shrink-0 text-orange" />{x}</li>)}
                  </ul>
                  <Link href={s.href} className="btn btn-accent relative mt-auto self-start">{more}<Icon name="arrow" size={16} className="arrow flip-rtl" /></Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
