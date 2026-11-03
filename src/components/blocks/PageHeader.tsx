import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Emph } from "./Section";
import type { BlockProps } from "./types";
import type { L } from "@/lib/types";

type P = { eyebrow?: L; title?: L; intro?: L; crumbs?: { name: string; url: string }[] };

export function PageHeader({ site, props, refCode }: BlockProps<P>) {
  const crumbs = props.crumbs ?? [{ name: site.t("nav.home"), url: `/${site.locale}` }, { name: site.l(props.eyebrow) || site.l(props.title), url: "#" }];
  return (
    <section className="relative overflow-hidden border-b border-rule bg-paper">
      <div className="paper-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
      <span aria-hidden="true" data-parallax="0.25" className="pointer-events-none absolute -bottom-10 end-[-2rem] select-none font-display text-[clamp(8rem,26vw,22rem)] font-bold leading-none text-transparent [-webkit-text-stroke:1px_var(--rule-strong)] opacity-60" dir="ltr">{refCode.split("·")[0]}</span>
      <div className="container-x relative pt-10 pb-16 md:pt-14 md:pb-24">
        <Breadcrumbs items={crumbs} label={site.t("a11y.breadcrumb")} />
        <div className="mt-12 grid gap-8 lg:mt-20 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-4">
              <span className="wp-ref">{refCode}</span>
              {props.eyebrow && <span className="eyebrow">{site.l(props.eyebrow)}</span>}
            </div>
            <h1 className="display d-1 mt-5 max-w-[20ch]" data-split>
              <Emph text={site.l(props.title)} />
            </h1>
          </div>
          {props.intro && (
            <p className="lede lg:col-span-4" data-reveal style={{ ["--d" as string]: "150ms" } as React.CSSProperties}>
              {site.l(props.intro)}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
