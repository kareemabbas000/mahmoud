/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Band, SectionHead } from "./Section";
import { getClients } from "@/lib/data";
import { href as h, num } from "@/lib/i18n";
import type { BlockProps, HeadProps, LinkProp } from "./types";
import type { Client, ClientKind } from "@/lib/types";

type P = HeadProps & { mode?: "marquee" | "full"; link?: LinkProp };

function LogoTile({ c, name }: { c: Client; name: string }) {
  return (
    <span className="logo-tile flex h-24 w-40 shrink-0 items-center justify-center rounded-md border border-rule bg-surface px-5" title={name}>
      <img src={c.logo!} alt={name} decoding="async" className="logo-mono max-h-14 w-auto object-contain" />
    </span>
  );
}

export async function Clients({ site, props, refCode }: BlockProps<P>) {
  const all = await getClients();
  const withLogo = all.filter((c) => c.logo && (props.mode === "full" || c.featured));
  if (props.mode !== "full") {
    const loop = [...withLogo, ...withLogo];
    return (
      <Band tone="paper-2">
        <SectionHead site={site} refCode={refCode} head={props} link={props.link} />
        <div className="marquee relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]" tabIndex={0} aria-label={site.l(props.title)}>
          <ul className="marquee-track flex w-max gap-4">
            {loop.map((c, i) => (
              <li key={i} aria-hidden={i >= withLogo.length || undefined}>
                <LogoTile c={c} name={site.l(c.name)} />
              </li>
            ))}
          </ul>
          <ul className="marquee-track marquee-reverse mt-4 flex w-max gap-4" aria-hidden="true">
            {[...loop].reverse().map((c, i) => (
              <li key={i}>
                <LogoTile c={c} name={site.l(c.name)} />
              </li>
            ))}
          </ul>
        </div>
      </Band>
    );
  }
  const groups: ClientKind[] = ["corporate", "donor", "ngo"];
  const label: Record<ClientKind, string> = { corporate: site.t("clients.corporate"), donor: site.t("clients.donor"), ngo: site.t("clients.ngo") };
  const letters = { corporate: "C", donor: "D", ngo: "N" } as const;
  return (
    <>
      <Band tone="surface">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {withLogo.map((c) => (
            <li key={c.name.en ?? c.name.ar} data-reveal>
              <span className="logo-tile flex h-28 items-center justify-center rounded-md border border-rule bg-surface p-5">
                <img src={c.logo!} alt={site.l(c.name)} loading="lazy" className="logo-mono max-h-16 w-auto object-contain" />
              </span>
            </li>
          ))}
        </ul>
      </Band>
      {groups.map((g, gi) => {
        const list = all.filter((c) => c.kind === g);
        if (!list.length) return null;
        return (
          <Band key={g} tone={gi % 2 ? "paper-2" : "paper"}>
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <span className="wp-ref">{`${refCode.split("·")[0]}·${letters[g]}`}</span>
                <h2 className="display d-3 mt-4" data-split>{label[g]}</h2>
                <p className="mt-3 font-mono text-sm text-faint" dir="ltr">
                  n = {num(list.length, "en")}
                </p>
              </div>
              <ol className="columns-1 gap-10 sm:columns-2 lg:col-span-8">
                {list.map((c, i) => (
                  <li key={i} className="mb-0 flex break-inside-avoid items-baseline gap-4 border-b border-rule py-3.5">
                    <span className="wp-ref w-7 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-ink">{site.l(c.name)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Band>
        );
      })}
    </>
  );
}

export function ClientsLink({ site, link }: { site: BlockProps["site"]; link: LinkProp }) {
  return (
    <Link href={h(link.href, site.locale)} className="link-arrow">
      {site.l(link.label)}
      <Icon name="arrow" size={16} className="arrow flip-rtl" />
    </Link>
  );
}
