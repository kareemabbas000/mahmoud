import { Band, SectionHead } from "./Section";
import { getCertificates } from "@/lib/data";
import { digits } from "@/lib/i18n";
import type { BlockProps, HeadProps } from "./types";

/** A register of credentials; each verified line carries the audit tick. */
export async function Credentials({ site, props, refCode }: BlockProps<HeadProps>) {
  const certs = await getCertificates();
  if (!certs.length) return null;
  return (
    <Band>
      <SectionHead site={site} refCode={refCode} head={props} />
      <ul className="grid gap-3 md:hidden" data-stagger>
        {certs.map((c, i) => (
          <li key={i} className="flex gap-4 rounded-2xl border border-rule bg-surface p-5">
            <svg viewBox="0 0 24 24" width="22" height="22" className="mt-1 shrink-0" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7" fill="none" stroke="var(--orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{site.l(c.title)}</p>
              <p className="mt-1 text-sm text-muted">{site.l(c.issuer)}</p>
              {(c.reference || c.year) && (
                <p className="tnum mt-3 flex gap-4 font-mono text-sm text-ink">
                  {c.reference && <span>{site.t("credentials.reg_no")}: <bdi>{digits(c.reference, site.locale, site.numerals)}</bdi></span>}
                  {c.year && <span className="text-muted">{site.t("credentials.since")} {digits(String(c.year), site.locale, site.numerals)}</span>}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[36rem] border-collapse text-start">
          <thead>
            <tr className="border-b border-rule-strong text-sm text-muted">
              <th scope="col" className="w-10 py-3 font-medium"><span className="sr-only">✓</span></th>
              <th scope="col" className="py-3 text-start font-medium">{site.locale === "ar" ? "الاعتماد" : "Credential"}</th>
              <th scope="col" className="py-3 text-start font-medium">{site.locale === "ar" ? "الجهة" : "Body"}</th>
              <th scope="col" className="py-3 text-end font-medium">{site.t("credentials.reg_no")}</th>
              <th scope="col" className="py-3 text-end font-medium">{site.t("credentials.since")}</th>
            </tr>
          </thead>
          <tbody data-stagger>
            {certs.map((c, i) => (
              <tr key={i} className="cred-row border-b border-rule transition-colors hover:bg-paper-2">
                <td className="py-4 align-top">
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <path d="M5 12.5 9.5 17 19 7" fill="none" stroke="var(--orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="tick-path animate" style={{ ["--len" as string]: 24, ["--d" as string]: `${0.3 + i * 0.08}s` } as React.CSSProperties} />
                  </svg>
                </td>
                <td className="py-4 pe-4 font-medium text-ink">{site.l(c.title)}</td>
                <td className="py-4 pe-4 text-muted">{site.l(c.issuer)}</td>
                <td className="tnum py-4 text-end font-mono text-ink">{c.reference ? <bdi>{digits(c.reference, site.locale, site.numerals)}</bdi> : "—"}</td>
                <td className="tnum py-4 text-end font-mono text-muted">{c.year ? digits(String(c.year), site.locale, site.numerals) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Band>
  );
}
