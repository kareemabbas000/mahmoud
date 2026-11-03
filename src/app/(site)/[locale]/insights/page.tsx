import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { NewsletterForm } from "@/components/site/forms/NewsletterForm";
import { InsightsFilter } from "./InsightsFilter";
import { getCategories, getPage, getPosts } from "@/lib/data";
import { ensureLocale, getSite } from "@/lib/site";
import { pageMeta } from "@/lib/seo";
import { formatDate, href as h, num } from "@/lib/i18n";
import { postIn, readMinutes } from "@/lib/posts";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const [site, page] = await Promise.all([getSite(locale), getPage("insights")]);
  const seo = page?.seo[locale] ?? {};
  return pageMeta(site, { path: "/insights", title: seo.title || site.t("insights.empty_title"), description: seo.description });
}

export default async function Insights({ params }: Props) {
  const { locale } = await params;
  await ensureLocale(locale, "/insights");
  const [site, page, posts, cats] = await Promise.all([getSite(locale), getPage("insights"), getPosts(), getCategories()]);
  const list = posts.filter((p) => postIn(p, locale));
  const usedCats = cats.filter((c) => list.some((p) => p.category_id === c.id));
  return (
    <>
      {page && <BlockRenderer site={site} blocks={page.blocks} letter="I" extra={{ pageHeader: { crumbs: [{ name: site.t("nav.home"), url: `/${locale}` }, { name: site.l(page.title), url: `/${locale}/insights` }] } }} />}
      <section className="bg-paper">
        <div className="container-x py-16 md:py-24">
          {list.length === 0 ? (
            <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-rule-strong p-10 text-center">
              <p className="wp-ref">I·00</p>
              <h2 className="display d-2 mt-3">{site.t("insights.empty_title")}</h2>
              <p className="lede mx-auto mt-3">{site.t("insights.empty_text")}</p>
              <div className="mx-auto mt-8 max-w-md">
                <NewsletterForm locale={locale} labels={{ placeholder: site.t("newsletter.placeholder"), submit: site.t("newsletter.submit"), success: site.t("newsletter.check_email"), error: site.t("form.error_generic"), invalid: site.t("form.error_email"), rate: site.t("form.error_rate") }} />
              </div>
            </div>
          ) : (
            <>
              {usedCats.length > 0 && <InsightsFilter all={site.t("insights.all")} cats={usedCats.map((c) => ({ id: c.id, name: site.l(c.name) }))} />}
              <ul className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
                {list.map((p, i) => (
                  <li key={p.id} data-cat={p.category_id ?? ""} className={`post-card group ${i === 0 ? "md:col-span-2 lg:col-span-2" : ""}`} data-reveal>
                    <Link href={h(`/insights/${p.slug[locale]}`, locale)} className="block">
                      <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-paper-2">
                        {p.cover ? (
                          <Image src={p.cover} alt={site.l(p.cover_alt)} fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                        ) : (
                          <div className="ledger-grid absolute inset-0 bg-deep" />
                        )}
                      </div>
                      <p className="mt-5 flex flex-wrap gap-x-3 text-sm text-faint">
                        {p.publish_at && <time dateTime={p.publish_at}>{formatDate(p.publish_at, locale, site.numerals)}</time>}
                        <span>· {num(readMinutes(p, locale), locale, site.numerals)} {site.t("insights.min_read")}</span>
                      </p>
                      <h2 className={`mt-2 font-semibold text-ink transition-colors group-hover:text-blue ${i === 0 ? "display d-2" : "text-xl"}`}>{site.l(p.title)}</h2>
                      <p className="mt-3 line-clamp-3 text-muted">{site.l(p.excerpt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </>
  );
}
