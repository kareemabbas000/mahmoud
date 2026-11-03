import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Mark } from "@/components/site/Logo";
import { Emph } from "./Section";
import { href as h, waLink } from "@/lib/i18n";
import type { BlockProps, LinkProp } from "./types";
import type { L } from "@/lib/types";

type P = { title?: L; text?: L; primary?: LinkProp; secondary?: LinkProp };

export function Cta({ site, props }: BlockProps<P>) {
  const to = (x: string) => (x === "whatsapp" ? waLink(site.settings.contact.whatsapp) : h(x, site.locale));
  const ext = (x: string) => (x === "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {});
  return (
    <section className="bg-paper">
      <div className="container-x py-16 md:py-24">
        <div data-expand className="cta-glow relative overflow-hidden rounded-xl bg-blue px-6 py-14 text-on-blue md:px-16 md:py-20 dark:bg-blue-wash dark:text-ink">
          <div className="pointer-events-none absolute -end-10 -top-10 opacity-[0.12]" aria-hidden="true">
            <svg viewBox="0 0 48 48" width="320" height="320"><path d="M11 25.5 18.5 33 44 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div className="relative grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <Mark size={40} animate />
              <h2 className="display d-1 mt-6 !text-current" data-split>
                <Emph text={site.l(props.title)} />
              </h2>
              {props.text && <p className="mt-5 max-w-xl text-lg opacity-85">{site.l(props.text)}</p>}
            </div>
            <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
              {props.primary && (
                <Link href={to(props.primary.href)} {...ext(props.primary.href)} className="btn btn-accent">
                  {site.l(props.primary.label)}
                  <Icon name="arrow" size={16} className="arrow flip-rtl" />
                </Link>
              )}
              {props.secondary && (
                <a href={to(props.secondary.href)} {...ext(props.secondary.href)} className="btn border-current/30 border text-current hover:border-current">
                  {props.secondary.href === "whatsapp" && <Icon name="whatsapp" size={18} />}
                  {site.l(props.secondary.label)}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
