import { Band, SectionHead } from "./Section";
import { getCertificates } from "@/lib/data";
import type { BlockProps, HeadProps, LinkProp } from "./types";

/** Certificate-style cards with a self-drawing tick seal. No tables, no horizontal scroll. */
export async function Credentials({ site, props }: BlockProps<HeadProps & { link?: LinkProp }>) {
  const certs = await getCertificates();
  if (!certs.length) return null;
  return (
    <Band tone="surface">
      <SectionHead site={site} head={props} link={props.link} align="center" />
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-stagger>
        {certs.map((c, i) => (
          <li key={i} data-tilt className="cert-card relative flex gap-5 overflow-hidden rounded-[1.5rem] border border-rule bg-paper p-6">
            <span className="cert-seal relative inline-flex size-14 shrink-0 items-center justify-center rounded-full">
              <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true">
                <path d="M12 25 20 33 36 15" fill="none" stroke="var(--orange)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength={100} strokeDasharray="100" strokeDashoffset="100" data-ring />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold leading-snug text-ink">{site.l(c.title)}</h3>
              <p className="mt-1 text-sm text-muted">{site.l(c.issuer)}</p>
              {(c.reference || c.year) && (
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {c.reference && (
                    <span className="tnum rounded-full bg-blue-wash px-3 py-1 font-medium text-blue">
                      {site.t("credentials.reg_no")} <bdi dir="ltr">{c.reference}</bdi>
                    </span>
                  )}
                  {c.year && <span className="tnum rounded-full border border-rule px-3 py-1 text-muted">{site.t("credentials.since")} {c.year}</span>}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Band>
  );
}
