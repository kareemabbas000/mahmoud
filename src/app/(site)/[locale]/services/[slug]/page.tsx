import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { RichText } from "@/components/site/RichText";
import { JsonLd } from "@/components/site/JsonLd";
import { Icon } from "@/components/ui/Icon";
import { Contact } from "@/components/blocks/Contact";
import { getEnabledLanguages, getService, getServices } from "@/lib/data";
import { ensureLocale, getSite } from "@/lib/site";
import { pageMeta, serviceLd } from "@/lib/seo";
import { docHeadings } from "@/lib/rich";
import { href as h, prettyPhone } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const [services, langs] = await Promise.all([getServices(), getEnabledLanguages()]);
  return langs.flatMap((l) => services.map((s) => ({ locale: l.code, slug: s.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await getService(slug);
  if (!s) return {};
  const site = await getSite(locale);
  const seo = s.seo[locale] ?? {};
  return pageMeta(site, { path: `/services/${slug}`, title: seo.title || site.l(s.name), description: seo.description || site.l(s.summary), image: s.image });
}

export default async function ServicePage({ params }: Props) {
  const { locale, slug } = await params;
  await ensureLocale(locale, `/services/${slug}`);
  const [site, s, all] = await Promise.all([getSite(locale), getService(slug), getServices()]);
  if (!s) notFound();
  const i = all.findIndex((x) => x.slug === slug);
  const ref = `B·${String(i + 1).padStart(2, "0")}`;
  const doc = s.body[locale] ?? s.body[site.defaultLocale];
  const toc = docHeadings(doc).filter((x) => x.level === 2);
  const highlights = s.highlights[locale] ?? s.highlights[site.defaultLocale] ?? [];
  const phone = site.settings.contact.phones[0];
  const others = all.filter((x) => x.slug !== slug);
  const crumbs = [
    { name: site.t("nav.home"), url: `/${locale}` },
    { name: site.locale === "ar" ? "خدماتنا" : "Services", url: `/${locale}/services` },
    { name: site.l(s.name), url: `/${locale}/services/${slug}` },
  ];
  return (
    <>
      <section className="relative overflow-hidden bg-deep text-deep-muted">
        <div className="ledger-grid absolute inset-0" aria-hidden="true" />
        <div className="container-x relative pt-10 pb-20 md:pb-28">
          <Breadcrumbs items={crumbs} label={site.t("a11y.breadcrumb")} onDeep />
          <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-4">
                <span className="wp-ref !text-deep-muted">{ref}</span>
                <span className="inline-flex size-12 items-center justify-center rounded-full border border-deep-rule text-orange">
                  <Icon name={s.icon} size={24} />
                </span>
              </div>
              <h1 className="display d-1 mt-6 !text-deep-ink" data-split>{site.l(s.name)}</h1>
              <p className="lede mt-6 !text-deep-muted" data-reveal>{site.l(s.intro)}</p>
            </div>
            {highlights.length > 0 && (
              <ul className="grid gap-px overflow-hidden rounded-md border border-deep-rule bg-deep-rule lg:col-span-4" aria-label={site.t("services.highlights")}>
                {highlights.map((x) => (
                  <li key={x} className="flex items-center gap-3 bg-deep-2 px-4 py-3 text-sm text-deep-ink">
                    <Icon name="check" size={16} className="shrink-0 text-orange" />
                    {x}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="container-x grid gap-12 py-16 md:py-24 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <div className="sticky top-32 grid gap-6">
              {toc.length > 1 && (
                <nav aria-label={site.t("services.on_this_page")} className="border-s border-rule ps-5">
                  <p className="text-sm font-semibold text-ink">{site.t("services.on_this_page")}</p>
                  <ol className="mt-3 grid gap-2 text-sm">
                    {toc.map((x) => (
                      <li key={x.id}><a href={`#${x.id}`} className="text-muted hover:text-blue">{x.text}</a></li>
                    ))}
                  </ol>
                </nav>
              )}
              <div className="rounded-lg border border-rule bg-surface p-6">
                <p className="font-semibold text-ink">{site.t("services.discuss")}</p>
                <a href="#enquiry" className="btn btn-primary mt-5 w-full">
                  {site.l(site.settings.header.cta_label)}
                  <Icon name="arrow" size={16} className="arrow flip-rtl" />
                </a>
                {phone && (
                  <a href={`tel:${phone}`} className="btn btn-ghost mt-3 w-full">
                    <Icon name="phone" size={16} />
                    <bdi dir="ltr">{prettyPhone(phone)}</bdi>
                  </a>
                )}
              </div>
            </div>
          </aside>
          <article className="lg:col-span-8" data-reveal>
            <RichText doc={doc} />
          </article>
        </div>
      </section>

      <section className="border-t border-rule bg-paper-2">
        <div className="container-x py-16 md:py-20">
          <h2 className="display d-3">{site.t("services.other")}</h2>
          <ul className="mt-8 grid gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-5">
            {others.map((o) => (
              <li key={o.slug} className="bg-surface">
                <Link href={h(`/services/${o.slug}`, locale)} className="group flex h-full flex-col gap-6 p-5 transition-colors hover:bg-blue-wash">
                  <span className="wp-ref">B·{String(all.indexOf(o) + 1).padStart(2, "0")}</span>
                  <span className="mt-auto font-semibold text-ink group-hover:text-blue">{site.l(o.name)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div id="enquiry" className="scroll-mt-24">
        <Contact site={site} props={{ show_map: false, service: slug }} refCode={ref} index={0} />
      </div>
      <JsonLd data={serviceLd(site, s)} />
    </>
  );
}
