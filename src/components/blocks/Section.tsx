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

/** Section header: pill label → heading, with the intro (and link) set opposite on desktop. */
export function SectionHead({
  site, head, link, align = "split", onDeep = false,
}: { site: Site; refCode?: string; head: HeadProps; link?: LinkProp; align?: "split" | "stack" | "center"; onDeep?: boolean }) {
  const eyebrow = site.l(head.eyebrow);
  const title = site.l(head.title);
  const intro = site.l(head.intro);
  if (!eyebrow && !title && !intro) return null;
  const linkEl = link && (
    <Link href={h(link.href, site.locale)} className={`link-arrow mt-5 text-sm ${onDeep ? "!text-deep-ink" : ""}`} data-reveal>
      {site.l(link.label)}
      <Icon name="arrow" size={16} className="arrow flip-rtl" />
    </Link>
  );
  if (align === "center")
    return (
      <div className="sec-head mx-auto mb-12 flex max-w-3xl flex-col items-center text-center md:mb-14">
        {eyebrow && <span className={`eyebrow ${onDeep ? "on-deep" : ""}`}>{eyebrow}</span>}
        {title && <h2 className={`display d-2 mt-5 ${onDeep ? "!text-deep-ink" : ""}`} data-split><Emph text={title} /></h2>}
        {intro && <p className={`lede mx-auto mt-4 ${onDeep ? "!text-deep-muted" : ""}`} data-reveal>{intro}</p>}
        {linkEl}
      </div>
    );
  return (
    <div className={`sec-head mb-12 md:mb-14 ${align === "split" ? "grid gap-6 lg:grid-cols-12 lg:items-end" : "grid gap-4"}`}>
      <div className={align === "split" ? "lg:col-span-7" : ""}>
        {eyebrow && <span className={`eyebrow ${onDeep ? "on-deep" : ""}`}>{eyebrow}</span>}
        {title && <h2 className={`display d-2 mt-5 max-w-[24ch] ${onDeep ? "!text-deep-ink" : ""}`} data-split><Emph text={title} /></h2>}
      </div>
      {(intro || link) && (
        <div className={align === "split" ? "lg:col-span-5 lg:pb-1" : ""}>
          {intro && <p className={`lede ${onDeep ? "!text-deep-muted" : ""}`} data-reveal>{intro}</p>}
          {linkEl}
        </div>
      )}
    </div>
  );
}

export function Band({ children, tone = "paper", className = "", id }: { children: ReactNode; tone?: "paper" | "surface" | "deep" | "paper-2"; className?: string; id?: string }) {
  const bg = { paper: "bg-paper", surface: "bg-surface", deep: "bg-deep text-deep-muted", "paper-2": "bg-paper-2" }[tone];
  return (
    <section id={id} className={`relative ${bg} ${className}`}>
      <div className="container-x section-pad">{children}</div>
    </section>
  );
}
