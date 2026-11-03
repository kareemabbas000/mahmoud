import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Band, SectionHead } from "./Section";
import { getTeam } from "@/lib/data";
import { href as h } from "@/lib/i18n";
import type { BlockProps, HeadProps, LinkProp } from "./types";
import type { TeamMember } from "@/lib/types";

function Initials({ name }: { name: string }) {
  const parts = name.replace(/^(د\.|أ\/|Dr\.)\s*/, "").split(/\s+/).filter(Boolean);
  const ini = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (
    <span className="flex size-full items-center justify-center bg-[repeating-linear-gradient(135deg,var(--paper-2)_0_10px,var(--surface)_10px_20px)]">
      <span className="font-display text-5xl font-semibold text-faint">{ini}</span>
    </span>
  );
}

function Portrait({ m, name, sizes }: { m: TeamMember; name: string; sizes: string }) {
  return m.photo ? (
    <Image src={m.photo} alt={name} fill sizes={sizes} className="object-cover object-top grayscale transition-[filter] duration-700 group-hover:grayscale-0" />
  ) : (
    <Initials name={name} />
  );
}

export async function Team({ site, props, refCode }: BlockProps<HeadProps & { link?: LinkProp }>) {
  const team = await getTeam();
  if (!team.length) return null;
  const [lead, ...rest] = team;
  const compact = Boolean(props.link);
  return (
    <Band tone="surface">
      <SectionHead site={site} refCode={refCode} head={props} link={props.link} />
      {lead && !compact && (
        <article className="group mb-16 grid gap-10 border-b border-rule pb-16 md:grid-cols-12" data-reveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-paper-2 md:col-span-5 lg:col-span-4">
            <Portrait m={lead} name={site.l(lead.name)} sizes="(min-width:768px) 33vw, 100vw" />
          </div>
          <div className="md:col-span-7 lg:col-span-8">
            <p className="eyebrow">{site.l(lead.role)}</p>
            <h3 className="display d-2 mt-4">{site.l(lead.name)}</h3>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {(lead.credentials[site.locale] ?? lead.credentials[site.defaultLocale] ?? []).map((c) => (
                <li key={c} className="flex items-start gap-3 border-t border-rule pt-3 text-muted">
                  <Icon name="check" size={18} className="mt-1 shrink-0 text-orange" />
                  {c}
                </li>
              ))}
            </ul>
            {lead.has_profile && (
              <Link href={h(`/team/${lead.slug}`, site.locale)} className="btn btn-ghost mt-10">
                {site.t("team.profile")}
                <Icon name="arrow" size={16} className="arrow flip-rtl" />
              </Link>
            )}
          </div>
        </article>
      )}
      <ul data-stagger className={`grid gap-x-6 gap-y-12 sm:grid-cols-2 ${compact ? "lg:grid-cols-3 xl:grid-cols-6" : "lg:grid-cols-3"}`}>
        {(compact ? team : rest).map((m) => {
          const name = site.l(m.name);
          const inner = (
            <>
              <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-paper-2">
                <Portrait m={m} name={name} sizes="(min-width:1024px) 25vw, 50vw" />
                {!m.photo && <span className="absolute inset-x-0 bottom-0 bg-surface/80 py-1.5 text-center text-xs text-muted backdrop-blur">{site.t("team.photo_pending")}</span>}
              </div>
              <h3 className="mt-5 font-semibold text-ink transition-colors group-hover:text-blue">{name}</h3>
              <p className="mt-1 text-sm text-muted">{site.l(m.role)}</p>
              {!compact && (m.credentials[site.locale] ?? []).length > 0 && (
                <p className="mt-2 text-sm text-faint">{(m.credentials[site.locale] ?? []).join(" · ")}</p>
              )}
            </>
          );
          return (
            <li key={m.slug} className="group">
              {m.has_profile ? <Link href={h(`/team/${m.slug}`, site.locale)}>{inner}</Link> : inner}
            </li>
          );
        })}
      </ul>
    </Band>
  );
}
