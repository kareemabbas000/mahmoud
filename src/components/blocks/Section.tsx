import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { href as h } from "@/lib/i18n";
import type { Site } from "@/lib/site";
import type { HeadProps, LinkProp } from "./types";

/** Renders *emphasis* inside display titles as the accent colour. */
export function Emph({ text }: { text: string }) {
  const parts = text.split(/\*(.+?)\*/g);
  return <>{parts.map((p, i) => (i % 2 ? <em key={i}>{p}</em> : p))}</>;
}

export function SectionHead({ site, refCode, head, link, align = "split", onDeep = false }: { site: Site; refCode: string; head: HeadProps; link?: LinkProp; align?: "split" | "stack"; onDeep?: boolean }) {
  const eyebrow = site.l(head.eyebrow);
  const title = site.l(head.title);
  const intro = site.l(head.intro);
  if (!eyebrow && !title && !intro) return null;
  return (
    <div className={`mb-12 md:mb-16 ${align === "split" ? "grid gap-6 lg:grid-cols-12" : "grid gap-5"}`}>
      <div className={align === "split" ? "lg:col-span-4" : ""}>
        <div className="flex items-center gap-4">
          <span className={`wp-ref ${onDeep ? "!text-deep-muted" : ""}`}>{refCode}</span>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        </div>
      </div>
      <div className={align === "split" ? "lg:col-span-8" : ""}>
        {title && (
          <h2 className={`display d-2 max-w-[22ch] ${onDeep ? "!text-deep-ink" : ""}`} data-split>
            <Emph text={title} />
          </h2>
        )}
        {intro && <p className={`lede mt-5 ${onDeep ? "!text-deep-muted" : ""}`} data-reveal>{intro}</p>}
        {link && (
          <Link href={h(link.href, site.locale)} className="link-arrow mt-6" data-reveal>
            {site.l(link.label)}
            <Icon name="arrow" size={16} className="arrow flip-rtl" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function Band({ children, tone = "paper", className = "", id }: { children: ReactNode; tone?: "paper" | "surface" | "deep" | "paper-2"; className?: string; id?: string }) {
  const bg = { paper: "bg-paper", surface: "bg-surface", deep: "bg-deep text-deep-muted", "paper-2": "bg-paper-2" }[tone];
  return (
    <section id={id} className={`relative ${bg} ${className}`}>
      <div className="container-x py-20 md:py-28">
        <div className="rule-draw mb-10 md:mb-14" data-rule aria-hidden="true" style={tone === "deep" ? { background: "var(--deep-rule)" } : undefined} />
        {children}
      </div>
    </section>
  );
}
