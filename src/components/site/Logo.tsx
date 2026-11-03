/* eslint-disable @next/next/no-img-element */
import type { Site } from "@/lib/site";

/**
 * Vector redraw of the SCO mark (blue frame + orange audit tick breaking out of it),
 * used until the original vector logo is supplied. Uploaded logos (panel → Settings → Brand)
 * replace it, with a separate dark-mode variant.
 */
export function Mark({ size = 36, animate = false, onDeep = false }: { size?: number; animate?: boolean; onDeep?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="shrink-0">
      <rect x="4" y="9" width="32" height="32" rx="3" fill="none" stroke={onDeep ? "#a9aeff" : "var(--blue)"} strokeWidth="5" />
      <path
        d="M11 25.5 18.5 33 44 6"
        fill="none"
        stroke="var(--orange)"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? "tick-path animate" : undefined}
        style={{ ["--len" as string]: 56 } as React.CSSProperties}
      />
    </svg>
  );
}

export function Logo({ site, onDeep = false }: { site: Site; onDeep?: boolean }) {
  const { brand } = site.settings;
  const name = site.l(brand.name);
  if (brand.logo_light) {
    return (
      <span className="inline-flex items-center">
        <img src={brand.logo_light} alt={`${brand.short_name} – ${name}`} className="h-10 w-auto dark:hidden" />
        <img src={brand.logo_dark || brand.logo_light} alt="" aria-hidden="true" className="hidden h-10 w-auto dark:block" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-3">
      <Mark onDeep={onDeep} />
      <span className="flex flex-col leading-none">
        <span className={`font-mono text-[1.35rem] font-medium tracking-[0.14em] ${onDeep ? "text-deep-ink" : "text-ink"}`} dir="ltr">
          {brand.short_name}
        </span>
        <span className={`mt-1 hidden text-[0.72rem] font-medium sm:block ${onDeep ? "text-deep-muted" : "text-muted"}`}>{name}</span>
      </span>
      <span className="sr-only">{name}</span>
    </span>
  );
}
