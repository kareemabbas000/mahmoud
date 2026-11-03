/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Band, SectionHead } from "./Section";
import { getClients } from "@/lib/data";
import { href as h, num } from "@/lib/i18n";
import type { BlockProps, HeadProps, LinkProp } from "./types";
import type { Client, ClientKind } from "@/lib/types";

type P = HeadProps & { mode?: "marquee" | "full"; link?: LinkProp };

function LogoTile({ c, name, big = false }: { c: Client; name: string; big?: boolean }) {
  return (
    <span className={`logo-tile shine relative flex items-center justify-center overflow-hidden rounded-2xl border border-rule bg-surface ${big ? "h-32 p-6" : "h-24 p-5"}`} title={name}>
      <img src={c.logo!} alt={name} loading="lazy" decoding="async" className="logo-mono relative max-h-16 w-auto object-contain" />
    </span>
  );
}

export async function Clients({ site, props }: BlockProps<P>) {
  const all = await getClients();
  const logos = all.filter((c) => c.logo);
  const count = (k: ClientKind) => all.filter((c) => c.kind === k).length;
  const label: Record<ClientKind, string> = { corporate: site.t("clients.corporate"), donor: site.t("clients.donor"), ngo: site.t("clients.ngo") };
  const short: Record<ClientKind, [string, string]> = { corporate: ["شركة", "companies"], donor: ["جهة مانحة", "donors & agencies"], ngo: ["جمعية ومؤسسة", "NGOs & foundations"] };
  const kinds: ClientKind[] = ["corporate", "donor", "ngo"];

  if (props.mode !== "full") {
    const featured = logos.filter((c) => c.featured).slice(0, 9);
    const names = all.filter((c) => c.kind !== "corporate").map((c) => site.l(c.name));
    return (
      <section className="relative overflow-hidden bg-paper-2">
        <div className="container-x section-pad">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHead site={site} head={props} align="stack" />
              <ul className="-mt-4 grid grid-cols-3 gap-3" data-stagger>
                {kinds.map((k) => (
                  <li key={k} className="rounded-2xl border border-rule bg-surface p-4">
                    <p className="tnum font-display text-3xl font-bold text-ink" dir="ltr">
                      <span data-count={count(k)}>{num(count(k), site.locale, site.numerals)}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted">{short[k][site.locale === "ar" ? 0 : 1]}</p>
                  </li>
                ))}
              </ul>
              {props.link && (
                <Link href={h(props.link.href, site.locale)} className="btn btn-primary mt-8">
                  {site.l(props.link.label)}
                  <Icon name="arrow" size={16} className="arrow flip-rtl" />
                </Link>
              )}
            </div>
            <div className="logo-ring-stage lg:col-span-7" aria-label={site.l(props.title)}>
              <div className="logo-ring-glow" aria-hidden="true" />
              <ul className="logo-ring" style={{ ["--n" as string]: featured.length } as React.CSSProperties}>
                {featured.map((c, i) => (
                  <li key={c.name.en ?? c.name.ar} style={{ ["--i" as string]: i } as React.CSSProperties}>
                    <span className="logo-ring-card">
                      <img src={c.logo!} alt={site.l(c.name)} loading="lazy" decoding="async" />
                    </span>
                  </li>
                ))}
              </ul>
              <div className="logo-ring-floor" aria-hidden="true" />
            </div>
          </div>
        </div>
        <div className="marquee relative overflow-hidden border-t border-rule py-6 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]" aria-hidden="true">
          <ul className="marquee-track flex w-max gap-3">
            {[...names, ...names].map((n, i) => (
              <li key={i} className="whitespace-nowrap rounded-full border border-rule bg-surface px-5 py-2 text-sm text-muted">{n}</li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <>
      <Band tone="surface">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" data-stagger>
          {logos.map((c) => (
            <li key={c.name.en ?? c.name.ar}>
              <LogoTile c={c} name={site.l(c.name)} big />
            </li>
          ))}
        </ul>
      </Band>
      <Band tone="paper-2">
        <div className="grid gap-5 lg:grid-cols-3">
          {kinds.map((k) => {
            const list = all.filter((c) => c.kind === k);
            if (!list.length) return null;
            return (
              <article key={k} className="flex flex-col rounded-[1.75rem] border border-rule bg-surface p-7" data-reveal>
                <div className="flex items-start justify-between gap-4">
                  <h2 className="display d-3">{label[k]}</h2>
                  <span className="tnum rounded-full bg-blue px-3 py-1 font-display text-sm font-bold text-on-blue" dir="ltr">{list.length}</span>
                </div>
                <ol className="mt-6 grid gap-0">
                  {list.map((c, i) => (
                    <li key={i} className="flex items-baseline gap-3 border-t border-rule py-3 text-sm">
                      <span className="tnum w-6 shrink-0 text-xs text-faint" dir="ltr">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-ink">{site.l(c.name)}</span>
                    </li>
                  ))}
                </ol>
              </article>
            );
          })}
        </div>
      </Band>
    </>
  );
}
