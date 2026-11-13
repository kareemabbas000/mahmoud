import Link from "next/link";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { abs } from "@/lib/seo";
import { env } from "@/lib/env";
import { SmartImage } from "@/components/ui/SmartImage";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { NewsletterForm } from "@/components/site/forms/NewsletterForm";
import { getCategories, getPage, getPostIndex, type Taxonomy } from "@/lib/data";
import type { Site } from "@/lib/site";
import { formatDate, href as h, num } from "@/lib/i18n";
import { cardIn, PAGE_SIZE, readMinutes } from "@/lib/posts";

/** Published posts available in a locale, newest first. */
export async function localePosts(locale: string) {
  return (await getPostIndex()).filter((p) => cardIn(p, locale));
}

/**
 * One page of the insights list. Page 1 lives at /insights, page n at /insights/page/n.
 * With `category`, the same list scoped to one category at /insights/category/<slug>(/page/n).
 * Category chips are real links (crawlable, shareable), not client-side filters.
 */
export async function InsightsList({ site, pageNo, category }: { site: Site; pageNo: number; category?: Taxonomy }) {
  const { locale } = site;
  const [page, everything, cats] = await Promise.all([getPage("insights"), localePosts(locale), getCategories()]);
  const all = category ? everything.filter((p) => p.category_id === category.id) : everything;
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const list = all.slice((pageNo - 1) * PAGE_SIZE, pageNo * PAGE_SIZE);
  const usedCats = cats.filter((c) => everything.some((p) => p.category_id === c.id));
  const base = category ? `/insights/category/${category.slug}` : "/insights";
  const pageHref = (n: number) => h(n <= 1 ? base : `${base}/page/${n}`, locale);
  const crumbs = [{ name: site.t("nav.home"), url: `/${locale}` }, { name: page ? site.l(page.title) : site.t("insights.back"), url: `/${locale}/insights` }, ...(category ? [{ name: site.l(category.name), url: `/${locale}${base}` }] : [])];
  return (
    <>
      {category ? (
        <section className="border-b border-rule bg-paper">
          <div className="container-x max-w-4xl pb-12 pt-10">
            <Breadcrumbs label={site.t("a11y.breadcrumb")} items={crumbs} />
            <p className="eyebrow mt-12">{site.t("insights.in_category")}</p>
            <h1 className="display d-1 mt-3">{site.l(category.name)}</h1>
            <p className="mt-4 text-muted">{num(all.length, locale, site.numerals)} · {site.t("insights.back")}</p>
          </div>
        </section>
      ) : (
        page && <BlockRenderer site={site} blocks={page.blocks} letter="I" extra={{ pageHeader: { crumbs } }} />
      )}
      {list.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": category ? "CollectionPage" : "Blog",
            "@id": abs(`/${locale}${base}${pageNo > 1 ? `/page/${pageNo}` : ""}`),
            name: category ? site.l(category.name) : page ? site.l(page.title) : "Insights",
            inLanguage: locale,
            publisher: { "@id": `${env.siteUrl}/#organization` },
            [category ? "hasPart" : "blogPost"]: list.map((p) => ({ "@type": "BlogPosting", headline: site.l(p.title), url: abs(`/${locale}/insights/${p.slug[locale]}`), datePublished: p.publish_at, ...(p.cover ? { image: abs(p.cover) } : {}) })),
          }}
        />
      )}
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
              {usedCats.length > 0 && (
                <nav className="mb-12 flex flex-wrap gap-2" aria-label={site.t("insights.category")}>
                  {[{ id: "", slug: "", name: site.t("insights.all") }, ...usedCats.map((c) => ({ id: c.id, slug: c.slug, name: site.l(c.name) }))].map((c) => {
                    const on = (category?.id ?? "") === c.id;
                    return (
                      <Link key={c.id || "all"} href={h(c.slug ? `/insights/category/${c.slug}` : "/insights", locale)} aria-current={on ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm transition-colors ${on ? "border-ink bg-ink text-paper" : "border-rule text-muted hover:text-ink"}`}>
                        {c.name}
                      </Link>
                    );
                  })}
                </nav>
              )}
              <ul className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
                {list.map((p, i) => (
                  <li key={p.id} data-cat={p.category_id ?? ""} className={`post-card group ${i === 0 && pageNo === 1 ? "md:col-span-2 lg:col-span-2" : ""}`} data-reveal>
                    <Link href={h(`/insights/${p.slug[locale]}`, locale)} className="block">
                      <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-paper-2">
                        {p.cover ? (
                          <SmartImage src={p.cover} alt={site.l(p.cover_alt)} fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                        ) : (
                          <div className="ledger-grid absolute inset-0 bg-deep" />
                        )}
                      </div>
                      <p className="mt-5 flex flex-wrap gap-x-3 text-sm text-faint">
                        {p.publish_at && <time dateTime={p.publish_at}>{formatDate(p.publish_at, locale, site.numerals)}</time>}
                        <span>· {num(readMinutes(p, locale), locale, site.numerals)} {site.t("insights.min_read")}</span>
                      </p>
                      <h2 className={`mt-2 font-semibold text-ink transition-colors group-hover:text-blue ${i === 0 && pageNo === 1 ? "display d-2" : "text-xl"}`}>{site.l(p.title)}</h2>
                      <p className="mt-3 line-clamp-3 text-muted">{site.l(p.excerpt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
              {pages > 1 && (
                <nav className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-8" aria-label={site.t("insights.page")}>
                  {pageNo > 1 ? <Link href={pageHref(pageNo - 1)} rel="prev" className="btn btn-ghost">{site.t("insights.newer")}</Link> : <span />}
                  <span className="text-sm text-faint">{site.t("insights.page")} {num(pageNo, locale, site.numerals)} / {num(pages, locale, site.numerals)}</span>
                  {pageNo < pages ? <Link href={pageHref(pageNo + 1)} rel="next" className="btn btn-ghost">{site.t("insights.older")}</Link> : <span />}
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
