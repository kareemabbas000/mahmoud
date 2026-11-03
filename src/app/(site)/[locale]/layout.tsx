import type { Metadata, Viewport } from "next";
import "../../globals.css";
import { fontVars } from "@/app/fonts";
import { ThemeScript } from "@/components/site/ThemeScript";
import { ConsentDefaults } from "@/components/site/consent/ConsentDefaults";
import { ConsentManager } from "@/components/site/consent/ConsentManager";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { FloatingContact } from "@/components/site/FloatingContact";
import { Motion } from "@/components/site/Motion";
import { ScrollScenes } from "@/components/site/ScrollScenes";
import { JsonLd } from "@/components/site/JsonLd";
import { getBranches, getEnabledLanguages, getTracking } from "@/lib/data";
import { getSite } from "@/lib/site";
import { href } from "@/lib/i18n";
import { env } from "@/lib/env";
import { organizationLd } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getEnabledLanguages()).map((l) => ({ locale: l.code }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#070a1c" },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const site = await getSite(locale);
  const { seo, brand } = site.settings;
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: site.l(seo.default_title), template: site.l(seo.title_template) },
    description: site.l(seo.default_description),
    applicationName: brand.short_name,
    formatDetection: { telephone: false, email: false, address: false },
    icons: { icon: [{ url: brand.favicon || "/icon.svg", type: brand.favicon ? undefined : "image/svg+xml" }], apple: "/apple-icon.png" },
    verification: {
      google: seo.verification.google || undefined,
      yandex: seo.verification.yandex || undefined,
      other: seo.verification.bing ? { "msvalidate.01": seo.verification.bing } : undefined,
    },
    alternates: { types: { "application/rss+xml": `/${locale}/insights/rss.xml` } },
  };
}

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const site = await getSite(locale);
  const [tracking, branches] = await Promise.all([getTracking(), getBranches()]);
  const primary = branches.find((b) => b.is_primary) ?? branches[0] ?? null;
  const { t } = site;

  return (
    <html lang={locale} dir={site.dir} className={`site ${fontVars}`} suppressHydrationWarning data-numerals={site.numerals} data-preset={site.settings.theme.preset ?? "ledger"}>
      <head>
        <ThemeScript defaultMode={site.settings.theme.default_mode} preset={site.settings.theme.preset} />
        <ConsentDefaults />
        <JsonLd data={organizationLd(site, primary)} />
      </head>
      <body className="min-h-dvh">
        <div className="aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>
        <a href="#main" className="sr-only z-[60] rounded-md bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:start-4 focus:top-4">
          {t("a11y.skip")}
        </a>
        <AnnouncementBar site={site} />
        <Header site={site} />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <Footer site={site} branch={primary} />
        <FloatingContact site={site} />
        <ConsentManager
          tracking={{
            ga4_id: tracking.ga4_id,
            gtm_id: tracking.gtm_id,
            google_ads_id: tracking.google_ads_id,
            google_ads_lead_label: tracking.google_ads_lead_label,
            meta_pixel_id: tracking.meta_pixel_id,
            clarity_id: tracking.clarity_id,
            linkedin_partner_id: tracking.linkedin_partner_id,
            tiktok_pixel_id: tracking.tiktok_pixel_id,
            custom_head: tracking.custom_head,
            custom_body: tracking.custom_body,
          }}
          privacyHref={href("/privacy", locale)}
          labels={{
            title: t("cookie.title"),
            text: t("cookie.text"),
            accept: t("cookie.accept"),
            reject: t("cookie.reject"),
            customize: t("cookie.customize"),
            save: t("cookie.save"),
            necessary: t("cookie.necessary"),
            analytics: t("cookie.analytics"),
            marketing: t("cookie.marketing"),
            policy: t("cookie.policy"),
          }}
        />
        <Motion />
        <ScrollScenes />
      </body>
    </html>
  );
}
