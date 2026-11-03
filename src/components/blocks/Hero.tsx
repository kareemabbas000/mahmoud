import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Emph } from "./Section";
import { href as h, prettyPhone, waLink } from "@/lib/i18n";
import type { BlockProps, LinkProp } from "./types";
import type { L } from "@/lib/types";

type P = { eyebrow?: L; title?: L; subtitle?: L; primary?: LinkProp; secondary?: LinkProp; show_contacts?: boolean };

/** Working papers on a ledger grid; the orange audit tick is drawn once, as if by the reviewer's pen. */
function HeroVisual() {
  const rows = [0.62, 0.38, 0.51, 0.27, 0.44];
  return (
    <svg viewBox="0 0 520 520" className="h-full w-full" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="sheen" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.08" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M10 450 C 110 420 150 440 210 380 S 330 330 380 260 S 470 170 510 120" fill="none" stroke="var(--blue)" strokeOpacity="0.55" strokeWidth="1.2" className="hero-ledger" />
      <g className="hero-sheet hero-sheet-3" style={{ transformOrigin: "300px 260px" }}>
        <rect x="190" y="70" width="250" height="330" rx="4" transform="rotate(7 315 235)" fill="var(--deep-2)" stroke="var(--deep-rule)" />
      </g>
      <g className="hero-sheet hero-sheet-2" style={{ transformOrigin: "280px 270px" }}>
        <rect x="150" y="90" width="250" height="330" rx="4" transform="rotate(-3.5 275 255)" fill="var(--deep-2)" stroke="var(--deep-rule)" />
      </g>
      <g className="hero-sheet hero-sheet-1">
        <rect x="120" y="110" width="250" height="330" rx="4" fill="#f7f8fc" />
        <rect x="120" y="110" width="250" height="330" rx="4" fill="url(#sheen)" />
        <rect x="144" y="136" width="90" height="7" rx="2" fill="#0b1033" opacity="0.85" />
        <rect x="144" y="151" width="140" height="4" rx="2" fill="#8a90ad" opacity="0.6" />
        <text x="346" y="146" textAnchor="end" fontFamily="var(--f-mono)" fontSize="10" fill="#8a90ad" style={{ direction: "ltr" }}>WP B·01</text>
        {rows.map((w, i) => (
          <g key={i}>
            <line x1="144" x2="346" y1={190 + i * 34} y2={190 + i * 34} stroke="#dadde9" />
            <rect x="144" y={178 + i * 34} width={70 + (i % 3) * 18} height="5" rx="2" fill="#525874" opacity="0.45" />
            <rect x={346 - 150 * w} y={178 + i * 34} width={150 * w} height="5" rx="2" fill="#1a1f3d" opacity="0.7" />
          </g>
        ))}
        {/* accountant's double rule under the total */}
        <line x1="236" x2="346" y1="368" y2="368" stroke="#1a1f3d" strokeWidth="1.2" />
        <line x1="236" x2="346" y1="372" y2="372" stroke="#1a1f3d" strokeWidth="1.2" />
        <rect x="270" y="352" width="76" height="6" rx="2" fill="#04019f" />
        <path d="M148 388 L166 408 L204 364" fill="none" stroke="var(--orange)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="tick-path animate" style={{ ["--len" as string]: 90, ["--d" as string]: "0.9s" } as React.CSSProperties} />
      </g>
    </svg>
  );
}

export function Hero({ site, props }: BlockProps<P>) {
  const { settings, locale, t } = site;
  const phone = settings.contact.phones[0];
  const second = props.secondary;
  return (
    <section data-hero className="relative isolate overflow-hidden bg-deep text-deep-muted">
      <div data-hero-grid className="ledger-grid absolute -inset-y-24 inset-x-0 -z-10" aria-hidden="true" />
      <div data-hero-glow aria-hidden="true" className="absolute -top-40 end-[-10%] -z-10 size-[40rem] rounded-full bg-[radial-gradient(closest-side,rgb(4_1_159/0.55),transparent)] blur-2xl" />
      <div className="container-x grid min-h-[min(46rem,calc(100svh-7rem))] items-center gap-10 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-7" data-hero-copy>
          {props.eyebrow && (
            <p className="eyebrow !text-orange" data-reveal>
              {site.l(props.eyebrow)}
            </p>
          )}
          <h1 className="display d-hero mt-6 !text-deep-ink" data-split>
            <Emph text={site.l(props.title)} />
          </h1>
          {props.subtitle && (
            <p className="lede mt-7 !text-deep-muted" data-reveal style={{ ["--d" as string]: "200ms" } as React.CSSProperties}>
              {site.l(props.subtitle)}
            </p>
          )}
          <div className="mt-10 flex flex-wrap gap-3" data-reveal style={{ ["--d" as string]: "320ms" } as React.CSSProperties}>
            {props.primary && (
              <Link href={h(props.primary.href, locale)} className="btn btn-accent">
                {site.l(props.primary.label)}
                <Icon name="arrow" size={16} className="arrow flip-rtl" />
              </Link>
            )}
            {second && (
              <Link href={second.href === "whatsapp" ? waLink(settings.contact.whatsapp) : h(second.href, locale)} className="btn btn-on-deep">
                {site.l(second.label)}
              </Link>
            )}
          </div>
          {props.show_contacts && (
            <dl className="mt-12 grid max-w-xl grid-cols-2 gap-6 border-t border-deep-rule pt-6 text-sm" data-reveal style={{ ["--d" as string]: "420ms" } as React.CSSProperties}>
              {phone && (
                <div>
                  <dt className="text-deep-muted">{t("common.phone")}</dt>
                  <dd className="mt-1">
                    <a href={`tel:${phone}`} className="tnum text-deep-ink hover:text-orange">
                      <bdi dir="ltr">{prettyPhone(phone)}</bdi>
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-deep-muted">{t("common.email")}</dt>
                <dd className="mt-1">
                  <a href={`mailto:${settings.contact.email}`} className="text-deep-ink hover:text-orange">
                    <bdi dir="ltr">{settings.contact.email}</bdi>
                  </a>
                </dd>
              </div>
            </dl>
          )}
        </div>
        <div className="relative hidden aspect-square w-full max-w-[34rem] justify-self-center sm:block lg:col-span-5">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
