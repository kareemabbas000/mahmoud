"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export type SvcView = { slug: string; ref: string; icon: string; name: string; summary: string; highlights: string[]; href: string };

/** Desktop: index rows + a sticky preview panel that follows hover/focus. Mobile: swipeable snap cards. */
export function ServicesExplorer({ items, more }: { items: SvcView[]; more: string }) {
  const [cur, setCur] = useState(0);
  const a = items[cur]!;
  return (
    <>
      {/* Mobile / tablet carousel */}
      <ul className="snap-x-row lg:hidden" aria-label={more}>
        {items.map((s) => (
          <li key={s.slug}>
            <Link href={s.href} className="flex h-full flex-col rounded-2xl border border-rule bg-surface p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-blue text-on-blue"><Icon name={s.icon} size={26} /></span>
                <span className="wp-ref">{s.ref}</span>
              </div>
              <h3 className="display d-3 mt-8">{s.name}</h3>
              <p className="mt-3 text-sm text-muted">{s.summary}</p>
              <ul className="mt-5 grid gap-2 text-sm">
                {s.highlights.slice(0, 3).map((h) => <li key={h} className="flex items-start gap-2 text-text"><Icon name="check" size={16} className="mt-1 shrink-0 text-orange" />{h}</li>)}
              </ul>
              <span className="link-arrow mt-auto pt-6 text-sm">{more}<Icon name="arrow" size={16} className="arrow flip-rtl" /></span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop explorer */}
      <div className="hidden gap-12 lg:grid lg:grid-cols-12">
        <ol className="lg:col-span-7" data-stagger>
          {items.map((s, i) => (
            <li key={s.slug} className="border-t border-rule last:border-b">
              <Link
                href={s.href}
                onMouseEnter={() => setCur(i)}
                onFocus={() => setCur(i)}
                className="group grid grid-cols-[4rem_1fr_auto] items-center gap-6 py-7"
              >
                <span className={`wp-ref transition-colors ${cur === i ? "!text-orange" : ""}`}>{s.ref}</span>
                <span className={`display d-3 transition-all duration-500 ${cur === i ? "translate-x-0 text-blue rtl:translate-x-0" : "text-ink"} group-hover:translate-x-2 rtl:group-hover:-translate-x-2`}>{s.name}</span>
                <span className={`inline-flex size-12 items-center justify-center rounded-full border transition-all duration-300 ${cur === i ? "border-orange bg-orange text-on-orange" : "border-rule text-ink"}`}>
                  <Icon name="arrow" size={18} className="flip-rtl" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
        <aside className="lg:col-span-5">
          <div className="sticky top-36 overflow-hidden rounded-3xl bg-deep p-10 text-deep-muted shadow-[0_40px_90px_-40px_rgb(11_16_51/0.6)]" data-spot>
            <div className="ledger-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
            <div key={a.slug} className="relative animate-[rise_0.6s_var(--ease-out-quint)_both]">
              <div className="flex items-center justify-between">
                <span className="relative inline-flex size-20 items-center justify-center rounded-2xl bg-blue text-white shadow-[0_0_60px_-10px_var(--blue)]">
                  <Icon name={a.icon} size={36} />
                </span>
                <span className="font-display text-6xl font-bold text-white/10">{a.ref.slice(-2)}</span>
              </div>
              <h3 className="display d-2 mt-10 !text-deep-ink">{a.name}</h3>
              <p className="mt-4 text-lg leading-relaxed">{a.summary}</p>
              <ul className="mt-8 grid gap-3">
                {a.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3 border-t border-deep-rule pt-3 text-deep-ink">
                    <Icon name="check" size={18} className="mt-1 shrink-0 text-orange" />{h}
                  </li>
                ))}
              </ul>
              <Link href={a.href} className="btn btn-accent mt-10">{more}<Icon name="arrow" size={16} className="arrow flip-rtl" /></Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
