import { SmartImage } from "@/components/ui/SmartImage";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Band, SectionHead } from "./Section";
import { getTeam } from "@/lib/data";
import { href as h } from "@/lib/i18n";
import type { BlockProps, HeadProps, LinkProp } from "./types";
import type { TeamMember } from "@/lib/types";

function Avatar({ m, name, size }: { m: TeamMember; name: string; size: number }) {
  return (
    <span className="avatar-ring relative inline-flex shrink-0 rounded-full p-[3px]" style={{ width: size, height: size }}>
      <span className="relative block size-full overflow-hidden rounded-full bg-paper-2">
        {m.photo ? (
          <SmartImage src={m.photo} alt={name} fill sizes={`${size}px`} className="object-cover object-top" />
        ) : (
          <svg viewBox="0 0 64 64" className="avatar-ph size-full" role="img" aria-label={name}>
            <circle cx="32" cy="25" r="11" fill="#8f97ff" opacity="0.9" />
            <path d="M12 60c1.5-11 9.5-18 20-18s18.5 7 20 18Z" fill="#8f97ff" opacity="0.9" />
          </svg>
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
          <article className="founder-card group relative overflow-hidden rounded-[2rem] text-muted lg:col-span-5 lg:row-span-2" data-reveal>
            <div className="founder-visual relative mx-auto mt-8 aspect-[4/4.2] w-[82%]">
              <svg viewBox="0 0 200 200" className="founder-rings absolute inset-x-0 top-0 w-full" aria-hidden="true">
                {[96, 80, 64, 48].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="0.4" />)}
              </svg>
              <div className="founder-arch absolute inset-x-[8%] bottom-0 top-[6%] overflow-hidden">
                <div className="founder-light absolute inset-0" aria-hidden="true" />
                <SmartImage
                  src={site.settings.images?.founder_cutout || lead.photo || "/legacy/team/mahmoud-al-sheikh-cutout.png"}
                  alt={site.l(lead.name)}
                  fill
                  quality={92}
                  sizes="(min-width:1024px) 30vw, 80vw"
                  className="founder-img object-contain object-bottom"
                />
                <div className="founder-floor absolute inset-x-[10%] bottom-0 h-6" aria-hidden="true" />
              </div>
              <span className="founder-chip absolute start-0 top-[22%]"><b className="tnum" dir="ltr">21145</b> {site.t("credentials.reg_no")}</span>
              <span className="founder-chip absolute end-0 top-[48%]">{site.locale === "ar" ? "منذ" : "Since"} <b className="tnum" dir="ltr">{site.settings.brand.founded_year}</b></span>
            </div>
            <div className="relative p-7 pt-5">
              <p className="eyebrow">{site.l(lead.role)}</p>
              <h3 className="display d-3 mt-4">{site.l(lead.name)}</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {(lead.credentials[site.locale] ?? lead.credentials[site.defaultLocale] ?? []).slice(0, 3).map((c) => (
                  <li key={c} className="rounded-full border border-rule bg-surface px-3 py-1 text-xs text-ink">{c}</li>
                ))}
              </ul>
              {lead.has_profile && (
                <Link href={h(`/team/${lead.slug}`, site.locale)} className="link-arrow mt-6 text-sm !text-orange">
                  {site.t("team.profile")}
                  <Icon name="arrow" size={16} className="arrow flip-rtl" />
                </Link>
              )}
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
