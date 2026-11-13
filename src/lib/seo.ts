import type { Metadata } from "next";
import { env } from "@/lib/env";
import { docText } from "@/lib/rich";
import type { Site } from "@/lib/site";
import type { Branch, Faq, Post, Service } from "@/lib/types";

export const abs = (path: string) => (path.startsWith("http") ? path : `${env.siteUrl}${path.startsWith("/") ? "" : "/"}${path}`);

/**
 * Per-page metadata with canonical + hreflang for every enabled language and x-default.
 * `paths` maps locale → path (without locale prefix) when slugs differ per language.
 */
export function pageMeta(
  site: Site,
  opts: {
    path: string; title?: string; description?: string; image?: string | null; imageAlt?: string; type?: "website" | "article"; paths?: Record<string, string>; noindex?: boolean;
    publishedTime?: string; modifiedTime?: string; canonical?: string;
    /** Social overrides (posts): fall back to title/description. */
    ogTitle?: string; ogDescription?: string;
    /** Article extras for Open Graph. */
    section?: string; tags?: string[]; authors?: string[];
  },
): Metadata {
  const pathFor = (code: string) => opts.paths?.[code] ?? opts.path;
  const languages: Record<string, string> = {};
  for (const l of site.langs) if (opts.paths ? opts.paths[l.code] !== undefined : true) languages[l.code] = abs(`/${l.code}${pathFor(l.code)}`);
  languages["x-default"] = abs(`/${site.defaultLocale}${pathFor(site.defaultLocale)}`);
  const url = abs(`/${site.locale}${pathFor(site.locale)}`);
  const description = opts.description || site.l(site.settings.seo.default_description);
  // Default branded cards are ~60 kB JPEGs: WhatsApp skips previews over ~300 kB.
  const image = opts.image || site.settings.seo.og_image || `/og/${site.locale === "ar" ? "ar" : "en"}.jpg`;
  const ogTitle = opts.ogTitle || opts.title || site.l(site.settings.seo.default_title);
  const ogDesc = opts.ogDescription || description;
  const imageAlt = opts.imageAlt || ogTitle;
  return {
    ...(opts.title ? { title: opts.title } : {}),
    description,
    alternates: { canonical: opts.canonical && /^https?:\/\//.test(opts.canonical) ? opts.canonical : url, languages },
    openGraph: {
      type: opts.type ?? "website",
      url,
      siteName: `${site.settings.brand.short_name} – ${site.l(site.settings.brand.name)}`,
      title: ogTitle,
      description: ogDesc,
      locale: site.locale === "ar" ? "ar_EG" : site.locale === "en" ? "en_US" : site.locale,
      alternateLocale: site.langs.filter((l) => l.code !== site.locale).map((l) => (l.code === "ar" ? "ar_EG" : l.code === "en" ? "en_US" : l.code)),
      // Size is declared only for the default 1200×630 cards; for covers the platforms read the real size.
      images: [{ url: abs(image), ...(opts.image || site.settings.seo.og_image ? {} : { width: 1200, height: 630, type: "image/jpeg" }), alt: imageAlt }],
      ...(opts.section ? { section: opts.section } : {}),
      ...(opts.tags?.length ? { tags: opts.tags } : {}),
      ...(opts.authors?.length ? { authors: opts.authors } : {}),
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
      ...(opts.modifiedTime ? { modifiedTime: opts.modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: ogTitle, description: ogDesc, images: [{ url: abs(image), alt: imageAlt }] },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export function organizationLd(site: Site, branch: Branch | null) {
  const { brand, contact, social } = site.settings;
  const sameAs = social.filter((s) => s.enabled && s.url && s.platform !== "youtube").map((s) => s.url);
  return {
    "@context": "https://schema.org",
    "@type": ["ProfessionalService", "AccountingService"],
    "@id": `${env.siteUrl}/#organization`,
    name: site.l(brand.name),
    alternateName: [brand.short_name, ...Object.values(brand.name).filter((n) => n !== site.l(brand.name))],
    legalName: site.l(brand.legal_name),
    url: abs(`/${site.locale}`),
    logo: abs(site.settings.images?.logo_schema || brand.logo_light || "/legacy/brand/logo-en-300.png"),
    image: abs(site.settings.images?.organization || "/legacy/office/office.jpg"),
    foundingDate: String(brand.founded_year),
    email: contact.email,
    telephone: contact.phones[0],
    ...(sameAs.length ? { sameAs } : {}),
    knowsLanguage: site.langs.map((l) => l.code),
    ...(branch
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: site.l(branch.address).split(/[،,]/)[0],
            addressLocality: site.locale === "ar" ? "النزهة، القاهرة" : "El Nozha, Cairo",
            addressRegion: site.locale === "ar" ? "القاهرة" : "Cairo",
            addressCountry: "EG",
          },
          ...(branch.lat && branch.lng ? { geo: { "@type": "GeoCoordinates", latitude: branch.lat, longitude: branch.lng }, hasMap: `https://www.google.com/maps?q=${branch.lat},${branch.lng}` } : {}),
        }
      : {}),
    areaServed: { "@type": "Country", name: "Egypt" },
    makesOffer: site.services.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: site.l(s.name), url: abs(`/${site.locale}/services/${s.slug}`) } })),
  };
}

/** WebSite node: names the site per language and ties it to the organization (sitelinks, brand knowledge panel). */
export function websiteLd(site: Site) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${env.siteUrl}/#website`,
    url: abs(`/${site.locale}`),
    name: `${site.settings.brand.short_name} – ${site.l(site.settings.brand.name)}`,
    alternateName: site.settings.brand.short_name,
    inLanguage: site.locale,
    publisher: { "@id": `${env.siteUrl}/#organization` },
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.url) })),
  };
}

export function faqLd(site: Site, faqs: Pick<Faq, "question" | "answer">[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: site.locale,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: site.l(f.question),
      acceptedAnswer: { "@type": "Answer", text: docText(f.answer[site.locale] ?? f.answer[site.defaultLocale]) },
    })),
  };
}

export function serviceLd(site: Site, s: Service) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: site.l(s.name),
    description: site.l(s.summary),
    serviceType: site.l(s.name),
    url: abs(`/${site.locale}/services/${s.slug}`),
    provider: { "@id": `${env.siteUrl}/#organization` },
    areaServed: { "@type": "Country", name: "Egypt" },
    inLanguage: site.locale,
  };
}

/** Article structured data: everything Google's Article rich results and AI answer engines read. */
export function blogPostingLd(
  site: Site,
  p: Post,
  url: string,
  extra: { author?: { name: Record<string, string>; team_slug: string | null; photo: string | null }; category?: string; tags?: string[]; words?: number } = {},
) {
  const a = extra.author;
  const seo = p.seo?.[site.locale] ?? {};
  const keywords = [seo.focus_keyword, ...(seo.keywords ?? "").split(/[,،]/)].map((k) => (k ?? "").trim()).filter(Boolean);
  const image = seo.og_image || p.cover;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${abs(url)}#article`,
    headline: site.l(p.title).slice(0, 110),
    description: seo.description || site.l(p.excerpt),
    inLanguage: site.locale,
    mainEntityOfPage: { "@type": "WebPage", "@id": abs(url) },
    url: abs(url),
    datePublished: p.publish_at,
    dateModified: p.updated_at ?? p.publish_at,
    ...(image ? { image: [{ "@type": "ImageObject", url: abs(image), width: 1200, height: 630 }] } : { image: [abs(`/og/${site.locale === "ar" ? "ar" : "en"}.jpg`)] }),
    author: a
      ? { "@type": "Person", name: site.l(a.name), ...(a.team_slug ? { url: abs(`/${site.locale}/team/${a.team_slug}`) } : {}), ...(a.photo ? { image: abs(a.photo) } : {}), worksFor: { "@id": `${env.siteUrl}/#organization` } }
      : { "@id": `${env.siteUrl}/#organization` },
    publisher: { "@id": `${env.siteUrl}/#organization` },
    isPartOf: { "@id": `${env.siteUrl}/#website` },
    ...(extra.category ? { articleSection: extra.category } : {}),
    ...(keywords.length || extra.tags?.length ? { keywords: [...new Set([...keywords, ...(extra.tags ?? [])])].join(", ") } : {}),
    ...(extra.words ? { wordCount: extra.words } : {}),
    isAccessibleForFree: true,
  };
}
