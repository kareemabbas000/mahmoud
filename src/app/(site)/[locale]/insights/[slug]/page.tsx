import type { Metadata } from "next";
import { SmartImage } from "@/components/ui/SmartImage";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { RichText } from "@/components/site/RichText";
import { JsonLd } from "@/components/site/JsonLd";
import { ShareButtons } from "@/components/site/ShareButtons";
import { Cta } from "@/components/blocks/Cta";
import { getAuthors, getCategories, getPage, getPost, getPostCards, getPostIndex, getPostRefBySlug, getTags } from "@/lib/data";
import { ensureLocale, getSite } from "@/lib/site";
import { abs, blogPostingLd, breadcrumbLd, pageMeta } from "@/lib/seo";
import { docHeadings, docText } from "@/lib/rich";
import { formatDate, href as h, num } from "@/lib/i18n";
import { postIn, readMinutes } from "@/lib/posts";

/** New items (created in the panel) render on first visit, then stay cached until edited. */
export const dynamicParams = true;

type Props = { params: Promise<{ locale: string; slug: string }> };

/** Prebuild only the newest posts; older ones render on first visit, then stay cached. */
export async function generateStaticParams() {
  const posts = (await getPostIndex()).slice(0, 40);
  return posts.flatMap((p) => Object.entries(p.slug ?? {}).filter(([, s]) => s).map(([locale, slug]) => ({ locale, slug })));
}

async function find(locale: string, slug: string) {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    return null;
  }
  const ref = await getPostRefBySlug(decoded);
  if (!ref) return null;
  if (ref.slug?.[locale] !== decoded) {
    if (postIn(ref, locale)) permanentRedirect(`/${locale}/insights/${ref.slug[locale]}`);
    return null;
  }
  return getPost(ref.id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await find(locale, slug);
  if (!post) return {};
  const site = await getSite(locale);
  const seo = post.seo?.[locale] ?? {};
  const [cats, tags, authors] = await Promise.all([getCategories(), getTags(), getAuthors()]);
  const cat = cats.find((c) => c.id === post.category_id);
  const author = authors.find((a) => a.id === post.author_id);
  const paths = Object.fromEntries(Object.entries(post.slug).filter(([l, s]) => s && post.title?.[l]).map(([l, s]) => [l, `/insights/${s}`]));
  return pageMeta(site, {
    path: `/insights/${post.slug[locale]}`,
    paths,
    type: "article",
    title: seo.title || site.l(post.title),
    description: seo.description || site.l(post.excerpt),
    image: seo.og_image || post.cover,
    imageAlt: site.l(post.cover_alt) || undefined,
    ogTitle: seo.og_title,
    ogDescription: seo.og_description,
    section: cat ? site.l(cat.name) : undefined,
    tags: tags.filter((t) => post.tag_ids?.includes(t.id)).map((t) => site.l(t.name)),
    authors: author ? [site.l(author.name)] : undefined,
    noindex: seo.noindex,
    canonical: seo.canonical,
    publishedTime: post.publish_at ?? undefined,
    modifiedTime: post.updated_at,
  });
}

/** Layouts an editor picks per post (Post → Settings → Article layout). */
type Layout = "classic" | "feature" | "minimal";

export default async function PostPage({ params }: Props) {
  const { locale, slug } = await params;
  await ensureLocale(locale, "/insights");
  const post = await find(locale, slug);
  if (!post) notFound();
  const [site, authors, cats, tags, home, relatedCards] = await Promise.all([getSite(locale), getAuthors(), getCategories(), getTags(), getPage(""), getPostCards((post.related_ids ?? []).slice(0, 3))]);
  const layout: Layout = post.layout === "feature" || post.layout === "minimal" ? post.layout : "classic";
  const author = authors.find((a) => a.id === post.author_id);
  const cat = cats.find((c) => c.id === post.category_id);
  const postTags = tags.filter((t) => post.tag_ids?.includes(t.id));
  const doc = post.body[locale];
  const toc = docHeadings(doc).filter((x) => x.level === 2);
  const url = `/${locale}/insights/${post.slug[locale]}`;
  const faqs = post.faqs?.[locale] ?? [];
  const related = relatedCards.filter((p) => postIn(p, locale));
  const cta = home?.blocks.find((b) => b.type === "cta");
  const title = site.l(post.title);
  const minutes = readMinutes(post, locale);
  // "Updated" shows when the post changed more than a day after it went live.
  const updated = post.updated_at && post.publish_at && new Date(post.updated_at).getTime() - new Date(post.publish_at).getTime() > 86_400_000 ? post.updated_at : null;
  const crumbs = [
    { name: site.t("nav.home"), url: `/${locale}` },
    { name: site.t("insights.back"), url: `/${locale}/insights` },
    ...(cat ? [{ name: site.l(cat.name), url: `/${locale}/insights/category/${cat.slug}` }] : []),
    { name: title, url },
  ];

  const meta = (onDark = false) => (
    <p className={`mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm ${onDark ? "text-white/75" : "text-muted"}`}>
      {author && <span>{site.t("insights.by")} <span className={`font-semibold ${onDark ? "text-white" : "text-ink"}`}>{site.l(author.name)}</span></span>}
      {post.publish_at && <time dateTime={post.publish_at}>{formatDate(post.publish_at, locale, site.numerals)}</time>}
      {updated && <span>{site.t("insights.updated")}: <time dateTime={updated}>{formatDate(updated, locale, site.numerals)}</time></span>}
      <span>{num(minutes, locale, site.numerals)} {site.t("insights.min_read")}</span>
    </p>
  );
  const catChip = (onDark = false) =>
    cat ? (
      <Link href={h(`/insights/category/${cat.slug}`, locale)} className={`eyebrow inline-block ${onDark ? "!text-white/85 hover:!text-white" : "hover:!text-blue"}`}>
        {site.l(cat.name)}
      </Link>
    ) : null;
  const tocNav = (
    <nav aria-label={site.t("services.on_this_page")} className="border-s border-rule ps-4">
      <p className="font-semibold text-ink">{site.t("services.on_this_page")}</p>
      <ol className="mt-3 grid gap-2">{toc.map((x) => <li key={x.id}><a href={`#${x.id}`} className="text-muted hover:text-blue">{x.text}</a></li>)}</ol>
    </nav>
  );
  // Phones (and the minimal layout): contents fold into one line above the article.
  const tocFold = toc.length > 1 && (
    <details className={`post-toc ${layout === "minimal" ? "" : "lg:hidden"}`}>
      <summary>{site.t("services.on_this_page")} <span className="text-faint">({num(toc.length, locale, site.numerals)})</span></summary>
      <ol>{toc.map((x) => <li key={x.id}><a href={`#${x.id}`}>{x.text}</a></li>)}</ol>
    </details>
  );
  const share = <ShareButtons url={abs(url)} title={title} labels={{ share: site.t("insights.share"), copy: site.t("insights.copy_link"), copied: site.t("insights.copied") }} />;
  const cover = post.cover ? <SmartImage src={post.cover} alt={site.l(post.cover_alt)} fill priority sizes="(min-width:1024px) 64rem, 100vw" className="object-cover" /> : null;

  const article = (
    <>
      {tocFold}
      <RichText doc={doc} className="post-body" />
      {faqs.length > 0 && (
        <section className="mt-16 border-t border-rule pt-10">
          <h2 className="display d-3">{site.t("insights.faq")}</h2>
          <div className="mt-6 divide-y divide-rule border-y border-rule">
            {faqs.map((f, i) => (
              <details key={i} className="group py-5">
                <summary className="cursor-pointer list-none font-medium text-ink">{f.q}</summary>
                <p className="mt-3 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
      {postTags.length > 0 && (
        <ul className="mt-12 flex flex-wrap gap-2" aria-label="Tags">
          {postTags.map((t) => <li key={t.id} className="rounded-full border border-rule px-3 py-1 text-sm text-muted">#{site.l(t.name)}</li>)}
        </ul>
      )}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-6">
        <span className="text-sm font-semibold text-ink">{site.t("insights.share")}</span>
        {share}
      </div>
      {author && (
        <aside className="author-box" aria-label={site.t("insights.about_author")}>
          {author.photo ? (
            <span className="relative size-16 flex-none overflow-hidden rounded-full bg-paper-2"><SmartImage src={author.photo} alt={site.l(author.name)} fill sizes="64px" className="object-cover object-top" /></span>
          ) : (
            <span className="grid size-16 flex-none place-items-center rounded-full bg-blue-wash text-xl font-semibold text-blue">{site.l(author.name).slice(0, 1)}</span>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-faint">{site.t("insights.about_author")}</p>
            <p className="mt-1 font-semibold text-ink">{site.l(author.name)}</p>
            {site.l(author.bio) && <p className="mt-2 text-sm text-muted">{site.l(author.bio)}</p>}
            {author.team_slug && <Link href={h(`/team/${author.team_slug}`, locale)} className="link-arrow mt-3 inline-block text-sm">{site.t("insights.read_profile")}</Link>}
          </div>
        </aside>
      )}
    </>
  );

  return (
    <>
      {/* Reading progress: CSS scroll-driven, no JavaScript (hidden where unsupported). */}
      <div className="read-progress" aria-hidden="true" />
      <article className={`post post-${layout}`}>
        {layout === "feature" ? (
          <header className="post-hero">
            {cover ?? <div className="ledger-grid absolute inset-0 bg-deep" />}
            <div className="post-hero-shade" />
            <div className="container-x relative max-w-5xl pb-14 pt-10 md:pb-20">
              <Breadcrumbs label={site.t("a11y.breadcrumb")} items={crumbs} onDeep />
              <div className="mt-24 md:mt-40">{catChip(true)}</div>
              <h1 className="display d-1 mt-4 text-white" data-split>{title}</h1>
              {site.l(post.excerpt) && <p className="lede mt-6 max-w-3xl !text-white/85">{site.l(post.excerpt)}</p>}
              {meta(true)}
            </div>
          </header>
        ) : (
          <header className="border-b border-rule bg-paper">
            <div className={`container-x pb-14 pt-10 ${layout === "minimal" ? "max-w-3xl" : "max-w-4xl"}`}>
              <Breadcrumbs label={site.t("a11y.breadcrumb")} items={crumbs} />
              <div className="mt-12">{catChip()}</div>
              <h1 className="display d-1 mt-4" data-split>{title}</h1>
              {site.l(post.excerpt) && <p className="lede mt-6">{site.l(post.excerpt)}</p>}
              {meta()}
            </div>
          </header>
        )}
        {layout !== "feature" && cover && (
          <div className={`container-x pt-10 ${layout === "minimal" ? "max-w-3xl" : "max-w-5xl"}`}>
            <div className="relative aspect-[16/8] overflow-hidden rounded-xl">{cover}</div>
          </div>
        )}
        {layout === "minimal" ? (
          <div className="container-x max-w-3xl py-14">{article}</div>
        ) : (
          <div className="container-x grid gap-12 py-14 lg:grid-cols-12">
            <aside className="hidden lg:col-span-3 lg:block">
              <div className="sticky top-32 grid gap-8 text-sm">
                {toc.length > 1 && tocNav}
                <div>
                  <p className="font-semibold text-ink">{site.t("insights.share")}</p>
                  <div className="mt-3">{share}</div>
                </div>
              </div>
            </aside>
            <div className="min-w-0 lg:col-span-8">{article}</div>
          </div>
        )}
      </article>
      {related.length > 0 && (
        <section className="border-t border-rule bg-paper-2">
          <div className="container-x py-16">
            <h2 className="display d-3">{site.t("insights.related")}</h2>
            <ul className="mt-8 grid gap-8 md:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <Link href={h(`/insights/${p.slug[locale]}`, locale)} className="group block">
                    {p.cover && (
                      <span className="relative mb-4 block aspect-[16/9] overflow-hidden rounded-lg bg-paper">
                        <SmartImage src={p.cover} alt={site.l(p.cover_alt)} fill sizes="(min-width:768px) 30vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                      </span>
                    )}
                    <span className="font-semibold text-ink group-hover:text-blue">{site.l(p.title)}</span>
                    <span className="mt-2 line-clamp-2 block text-sm text-muted">{site.l(p.excerpt)}</span>
                    <span className="mt-2 block text-xs text-faint">{num(readMinutes(p, locale), locale, site.numerals)} {site.t("insights.min_read")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      {cta && <Cta site={site} props={cta.props} refCode="I·99" index={99} />}
      <JsonLd data={blogPostingLd(site, post, url, { author, category: cat ? site.l(cat.name) : undefined, tags: postTags.map((t) => site.l(t.name)), words: docText(doc).split(/\s+/).filter(Boolean).length })} />
      <JsonLd data={breadcrumbLd(crumbs)} />
      {faqs.length > 0 && (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      )}
    </>
  );
}
