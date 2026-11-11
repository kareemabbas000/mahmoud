import type { Metadata } from "next";
import { SmartImage } from "@/components/ui/SmartImage";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { RichText } from "@/components/site/RichText";
import { JsonLd } from "@/components/site/JsonLd";
import { Icon } from "@/components/ui/Icon";
import { Credentials } from "@/components/blocks/Credentials";
import { Cta } from "@/components/blocks/Cta";
import { getEnabledLanguages, getTeam } from "@/lib/data";
import { ensureLocale, getSite } from "@/lib/site";
import { abs, pageMeta } from "@/lib/seo";
import { getPage } from "@/lib/data";

/** New items (created in the panel) render on first visit, then stay cached until edited. */
export const dynamicParams = true;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const [team, langs] = await Promise.all([getTeam(), getEnabledLanguages()]);
  return langs.flatMap((l) => team.filter((m) => m.has_profile).map((m) => ({ locale: l.code, slug: m.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const m = (await getTeam()).find((x) => x.slug === slug && x.has_profile);
  if (!m) return {};
  const site = await getSite(locale);
  return pageMeta(site, { path: `/team/${slug}`, title: site.l(m.name), description: `${site.l(m.role)} – ${(m.credentials[locale] ?? []).join("، ")}`, image: m.photo });
}

export default async function MemberPage({ params }: Props) {
  const { locale, slug } = await params;
  await ensureLocale(locale, `/team/${slug}`);
  const [site, team, home] = await Promise.all([getSite(locale), getTeam(), getPage("")]);
  const m = team.find((x) => x.slug === slug && x.has_profile);
  if (!m) notFound();
  const name = site.l(m.name);
  // The lead member (first in Team order) uses the cut-out portrait from Settings → Site images.
  const cutout = (m.slug === team[0]?.slug ? site.settings.images?.founder_cutout : null) || m.photo;
  const cta = home?.blocks.find((b) => b.type === "cta");
  return (
    <>
      <section className="relative overflow-hidden bg-deep text-deep-muted">
        <div className="ledger-grid absolute inset-0" aria-hidden="true" />
        <div className="container-x relative grid gap-10 pt-10 lg:grid-cols-12">
          <div className="pb-16 lg:col-span-7 lg:pb-24">
            <Breadcrumbs
              onDeep
              label={site.t("a11y.breadcrumb")}
              items={[
                { name: site.t("nav.home"), url: `/${locale}` },
                { name: site.locale === "ar" ? "فريق العمل" : "Team", url: `/${locale}/team` },
                { name, url: `/${locale}/team/${slug}` },
              ]}
            />
            <p className="eyebrow mt-14 !text-orange">{site.l(m.role)}</p>
            <h1 className="display d-1 mt-5 !text-deep-ink" data-split>{name}</h1>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {(m.credentials[locale] ?? m.credentials[site.defaultLocale] ?? []).map((c) => (
                <li key={c} className="flex items-start gap-3 border-t border-deep-rule pt-3 text-deep-ink">
                  <Icon name="check" size={18} className="mt-1 shrink-0 text-orange" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          {cutout && (
            <div className="relative self-end lg:col-span-5">
              <SmartImage src={cutout} alt={name} width={796} height={1341} priority sizes="(min-width:1024px) 40vw, 90vw" className="mx-auto h-auto max-h-[36rem] w-auto object-contain object-bottom" />
            </div>
          )}
        </div>
      </section>
      <section className="bg-paper">
        <div className="container-x grid gap-12 py-16 md:py-24 lg:grid-cols-12">
          <div className="lg:col-span-8 lg:col-start-3">
            <RichText doc={m.bio[locale] ?? m.bio[site.defaultLocale]} />
          </div>
        </div>
      </section>
      <Credentials site={site} props={{ eyebrow: { ar: "القيد والعضويات", en: "Registrations & memberships" }, title: { ar: "اعتمادات مهنية موثّقة", en: "Documented professional credentials" } }} refCode="D·02" index={2} />
      {cta && <Cta site={site} props={cta.props} refCode="D·03" index={3} />}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name,
          jobTitle: site.l(m.role),
          image: m.photo ? abs(m.photo) : undefined,
          worksFor: { "@id": `${abs("/")}#organization`.replace(/\/#/, "/#") },
        }}
      />
    </>
  );
}
