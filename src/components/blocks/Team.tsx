import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Band, SectionHead } from "./Section";
import { getTeam } from "@/lib/data";
import { href as h } from "@/lib/i18n";
import type { BlockProps, HeadProps, LinkProp } from "./types";
import type { TeamMember } from "@/lib/types";

function Avatar({ m, name, size }: { m: TeamMember; name: string; size: number }) {
  const parts = name.replace(/^(د\.|أ\/|Dr\.)\s*/, "").split(/\s+/).filter(Boolean);
  const ini = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (
    <span className="avatar-ring relative inline-flex shrink-0 rounded-full p-[3px]" style={{ width: size, height: size }}>
      <span className="relative block size-full overflow-hidden rounded-full bg-paper-2">
        {m.photo ? (
          <Image src={m.photo} alt={name} fill sizes={`${size}px`} className="object-cover object-top" />
        ) : (
          <span className="flex size-full items-center justify-center font-display text-lg font-bold text-blue">{ini}</span>
        )}
      </span>
    </span>
  );
}

/** Founder spotlight + refined member cards with small round portraits (sharp at their source resolution). */
export async function Team({ site, props }: BlockProps<HeadProps & { link?: LinkProp }>) {
  const team = await getTeam();
  if (!team.length) return null;
  const [lead, ...rest] = team;
  return (
    <Band tone="paper">
      <SectionHead site={site} head={props} link={props.link} />
      <div className="grid gap-5 lg:grid-cols-12">
        {lead && (
          <article className="relative overflow-hidden rounded-[2rem] bg-deep text-deep-muted lg:col-span-5 lg:row-span-2" data-reveal>
            <div className="ledger-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
            <div aria-hidden="true" className="absolute -top-24 end-[-6rem] size-80 rounded-full bg-[radial-gradient(closest-side,rgb(59_63_245/0.55),transparent)]" />
            <div className="relative grid h-full grid-rows-[auto_1fr]">
              <div className="relative mx-auto mt-8 h-72 w-full max-w-xs">
                <Image src="/legacy/team/mahmoud-al-sheikh-cutout.png" alt={site.l(lead.name)} fill sizes="320px" className="object-contain object-bottom" />
              </div>
              <div className="relative border-t border-deep-rule bg-deep/80 p-7 backdrop-blur">
                <p className="eyebrow on-deep">{site.l(lead.role)}</p>
                <h3 className="display d-3 mt-4 !text-deep-ink">{site.l(lead.name)}</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {(lead.credentials[site.locale] ?? lead.credentials[site.defaultLocale] ?? []).slice(0, 3).map((c) => (
                    <li key={c} className="rounded-full border border-deep-rule px-3 py-1 text-xs text-deep-ink">{c}</li>
                  ))}
                </ul>
                {lead.has_profile && (
                  <Link href={h(`/team/${lead.slug}`, site.locale)} className="link-arrow mt-6 text-sm !text-orange">
                    {site.t("team.profile")}
                    <Icon name="arrow" size={16} className="arrow flip-rtl" />
                  </Link>
                )}
              </div>
            </div>
          </article>
        )}
        <ul className="grid content-start gap-4 sm:grid-cols-2 lg:col-span-7" data-stagger>
          {rest.map((m) => {
            const name = site.l(m.name);
            const creds = m.credentials[site.locale] ?? m.credentials[site.defaultLocale] ?? [];
            return (
              <li key={m.slug} data-tilt className="member-card flex items-center gap-4 rounded-[1.5rem] border border-rule bg-surface p-5">
                <Avatar m={m} name={name} size={76} />
                <div className="min-w-0">
                  <h3 className="font-semibold leading-snug text-ink">{name}</h3>
                  <p className="mt-1 text-sm text-muted">{site.l(m.role)}</p>
                  {creds[0] && <p className="mt-2 inline-block rounded-full bg-blue-wash px-2.5 py-0.5 text-xs text-blue">{creds[0]}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Band>
  );
}
