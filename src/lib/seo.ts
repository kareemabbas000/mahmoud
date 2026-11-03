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
  opts: { path: string; title?: string; description?: string; image?: string | null; type?: "website" | "article"; paths?: Record<string, string>; noindex?: boolean; publishedTime?: string; modifiedTime?: string },
): Metadata {
  const pathFor = (code: string) => opts.paths?.[code] ?? opts.path;
  const languages: Record<string, string> = {};
  for (const l of site.langs) if (opts.paths ? opts.paths[l.code] !== undefined : true) languages[l.code] = abs(`/${l.code}${pathFor(l.code)}`);
  languages["x-default"] = abs(`/${site.defaultLocale}${pathFor(site.defaultLocale)}`);
  const url = abs(`/${site.locale}${pathFor(site.locale)}`);
  const description = opts.description || site.l(site.settings.seo.default_description);
  const image = opts.image || site.settings.seo.og_image || `/og/${site.locale === "ar" ? "ar" : "en"}.png`;
  return {
    ...(opts.title ? { title: opts.title } : {}),
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      type: opts.type ?? "website",
      url,
      siteName: `${site.settings.brand.short_name} – ${site.l(site.settings.brand.name)}`,
      title: opts.title ?? site.l(site.settings.seo.default_title),
      description,
      locale: site.locale === "ar" ? "ar_EG" : site.locale === "en" ? "en_US" : site.locale,
      alternateLocale: site.langs.filter((l) => l.code !== site.locale).map((l) => (l.code === "ar" ? "ar_EG" : l.code === "en" ? "en_US" : l.code)),
      images: [{ url: abs(image), width: 1200, height: 630 }],
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
      ...(opts.modifiedTime ? { modifiedTime: opts.modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: opts.title, description, images: [abs(image)] },
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
    logo: abs("/legacy/brand/logo-en-300.png"),
    image: abs("/legacy/office/office.jpg"),
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

export function blogPostingLd(site: Site, p: Post, url: string, authorName?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: site.l(p.title),
    description: site.l(p.excerpt),
    inLanguage: site.locale,
    mainEntityOfPage: abs(url),
    url: abs(url),
    datePublished: p.publish_at,
    dateModified: p.updated_at ?? p.publish_at,
    ...(p.cover ? { image: abs(p.cover) } : {}),
    author: authorName ? { "@type": "Person", name: authorName } : { "@id": `${env.siteUrl}/#organization` },
    publisher: { "@id": `${env.siteUrl}/#organization` },
  };
}
