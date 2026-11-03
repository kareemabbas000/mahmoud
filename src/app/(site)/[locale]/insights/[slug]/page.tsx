import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { RichText } from "@/components/site/RichText";
import { JsonLd } from "@/components/site/JsonLd";
import { Icon } from "@/components/ui/Icon";
import { Cta } from "@/components/blocks/Cta";
import { getAuthors, getCategories, getPage, getPosts, getTags } from "@/lib/data";
import { ensureLocale, getSite } from "@/lib/site";
import { abs, blogPostingLd, pageMeta } from "@/lib/seo";
import { docHeadings } from "@/lib/rich";
import { formatDate, href as h, num } from "@/lib/i18n";
import { postIn, readMinutes } from "@/lib/posts";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.flatMap((p) => Object.entries(p.slug ?? {}).filter(([, s]) => s).map(([locale, slug]) => ({ locale, slug })));
}

async function find(locale: string, slug: string) {
  const posts = await getPosts();
  const decoded = decodeURIComponent(slug);
  const p = posts.find((x) => x.slug?.[locale] === decoded);
  if (p) return { post: p, posts };
  const other = posts.find((x) => Object.values(x.slug ?? {}).includes(decoded));
  if (other && postIn(other, locale)) permanentRedirect(`/${locale}/insights/${other.slug[locale]}`);
  return { post: null, posts };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const { post } = await find(locale, slug);
  if (!post) return {};
  const site = await getSite(locale);
  const seo = post.seo?.[locale] ?? {};
  const paths = Object.fromEntries(Object.entries(post.slug).filter(([l, s]) => s && post.title?.[l]).map(([l, s]) => [l, `/insights/${s}`]));
  return pageMeta(site, {
    path: `/insights/${post.slug[locale]}`,
    paths,
    type: "article",
    title: seo.title || site.l(post.title),
    description: seo.description || site.l(post.excerpt),
    image: post.cover,
    publishedTime: post.publish_at ?? undefined,
    modifiedTime: post.updated_at,
  });
}

export default async function PostPage({ params }: Props) {
  const { locale, slug } = await params;
  await ensureLocale(locale, "/insights");
  const { post, posts } = await find(locale, slug);
  if (!post) notFound();
  const [site, authors, cats, tags, home] = await Promise.all([getSite(locale), getAuthors(), getCategories(), getTags(), getPage("")]);
  const author = authors.find((a) => a.id === post.author_id);
  const cat = cats.find((c) => c.id === post.category_id);
  const postTags = tags.filter((t) => post.tag_ids?.includes(t.id));
  const doc = post.body[locale];
  const toc = docHeadings(doc).filter((x) => x.level === 2);
  const url = `/${locale}/insights/${post.slug[locale]}`;
  const faqs = post.faqs?.[locale] ?? [];
  const related = posts.filter((p) => p.id !== post.id && postIn(p, locale) && (p.category_id === post.category_id || p.tag_ids?.some((t) => post.tag_ids?.includes(t)))).slice(0, 3);
  const cta = home?.blocks.find((b) => b.type === "cta");
  const shareUrl = encodeURIComponent(abs(url));
  return (
    <>
      <article>
        <header className="border-b border-rule bg-paper">
          <div className="container-x max-w-4xl pt-10 pb-14">
            <Breadcrumbs
              label={site.t("a11y.breadcrumb")}
              items={[
                { name: site.t("nav.home"), url: `/${locale}` },
                { name: site.locale === "ar" ? "رؤى ومقالات" : "Insights", url: `/${locale}/insights` },
                { name: site.l(post.title), url },
              ]}
            />
            {cat && <p className="eyebrow mt-12">{site.l(cat.name)}</p>}
            <h1 className="display d-1 mt-4" data-split>{site.l(post.title)}</h1>
            <p className="lede mt-6">{site.l(post.excerpt)}</p>
            <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {author && <span>{site.t("insights.by")} <span className="font-semibold text-ink">{site.l(author.name)}</span></span>}
              {post.publish_at && <time dateTime={post.publish_at}>{formatDate(post.publish_at, locale, site.numerals)}</time>}
              <span>{num(readMinutes(post, locale), locale, site.numerals)} {site.t("insights.min_read")}</span>
            </p>
          </div>
        </header>
        {post.cover && (
          <div className="container-x max-w-5xl pt-10">
            <div className="relative aspect-[16/8] overflow-hidden rounded-md">
              <Image src={post.cover} alt={site.l(post.cover_alt)} fill priority sizes="(min-width:1024px) 64rem, 100vw" className="object-cover" />
            </div>
          </div>
        )}
        <div className="container-x grid gap-12 py-14 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="sticky top-32 grid gap-8 text-sm">
              {toc.length > 1 && (
                <nav aria-label={site.t("services.on_this_page")} className="border-s border-rule ps-4">
                  <p className="font-semibold text-ink">{site.t("services.on_this_page")}</p>
                  <ol className="mt-3 grid gap-2">{toc.map((x) => <li key={x.id}><a href={`#${x.id}`} className="text-muted hover:text-blue">{x.text}</a></li>)}</ol>
                </nav>
              )}
              <div>
                <p className="font-semibold text-ink">{site.t("insights.share")}</p>
                <div className="mt-3 flex gap-2">
                  <a className="inline-flex size-9 items-center justify-center rounded-full border border-rule hover:border-ink" href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Icon name="linkedin" size={16} /></a>
                  <a className="inline-flex size-9 items-center justify-center rounded-full border border-rule hover:border-ink" href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Icon name="facebook" size={16} /></a>
                  <a className="inline-flex size-9 items-center justify-center rounded-full border border-rule hover:border-ink" href={`https://wa.me/?text=${shareUrl}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><Icon name="whatsapp" size={16} /></a>
                </div>
              </div>
            </div>
          </aside>
          <div className="lg:col-span-8">
            <RichText doc={doc} />
            {faqs.length > 0 && (
              <section className="mt-16 border-t border-rule pt-10">
                <h2 className="display d-3">{site.locale === "ar" ? "أسئلة شائعة" : "Frequently asked questions"}</h2>
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
              <ul className="mt-12 flex flex-wrap gap-2">
                {postTags.map((t) => <li key={t.id} className="rounded-full border border-rule px-3 py-1 text-sm text-muted">#{site.l(t.name)}</li>)}
              </ul>
            )}
          </div>
        </div>
      </article>
      {related.length > 0 && (
        <section className="border-t border-rule bg-paper-2">
          <div className="container-x py-16">
            <h2 className="display d-3">{site.t("insights.related")}</h2>
            <ul className="mt-8 grid gap-8 md:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <Link href={h(`/insights/${p.slug[locale]}`, locale)} className="group block border-t border-rule pt-4">
                    <span className="font-semibold text-ink group-hover:text-blue">{site.l(p.title)}</span>
                    <span className="mt-2 line-clamp-2 block text-sm text-muted">{site.l(p.excerpt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      {cta && <Cta site={site} props={cta.props} refCode="I·99" index={99} />}
      <JsonLd data={blogPostingLd(site, post, url, author ? site.l(author.name) : undefined)} />
      {faqs.length > 0 && (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      )}
    </>
  );
}
