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
import { IntroCurtain } from "@/components/site/IntroCurtain";
import { JsonLd } from "@/components/site/JsonLd";
import { getBranches, getLanguages, getTracking } from "@/lib/data";
import { getSite } from "@/lib/site";
import { href } from "@/lib/i18n";
import { env } from "@/lib/env";
import { organizationLd, websiteLd } from "@/lib/seo";

/**
 * Every known language is prebuilt; any other first segment (bots probing /wp-login.php, /.env …) gets the
 * static 404 without running a function. Adding a brand-new language therefore needs a redeploy, which the
 * Languages screen triggers automatically through VERCEL_DEPLOY_HOOK_URL.
 */
export const dynamicParams = false;
export async function generateStaticParams() {
  return (await getLanguages()).map((l) => ({ locale: l.code }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6ff" },
    { media: "(prefers-color-scheme: dark)", color: "#070a1c" },
  ],
};

/** Custom brand colours → CSS variables. Only strict #rrggbb values are accepted (no CSS injection). */
function brandColors(c: { enabled: boolean; primary: string; accent: string } | undefined): string | null {
  const hex = /^#[0-9a-fA-F]{6}$/;
  if (!c?.enabled || !hex.test(c.primary) || !hex.test(c.accent)) return null;
  const P = c.primary;
  const A = c.accent;
  return `:root[data-brand="custom"]{--blue:${P};--blue-2:color-mix(in srgb,${P} 82%,white);--blue-wash:color-mix(in srgb,${P} 10%,white);--orange:${A};--orange-text:color-mix(in srgb,${A} 78%,black)}:root[data-brand="custom"][data-theme="dark"]{--blue:color-mix(in srgb,${P} 45%,white);--blue-2:color-mix(in srgb,${P} 30%,white);--blue-wash:color-mix(in srgb,${P} 18%,transparent);--orange:color-mix(in srgb,${A} 88%,white);--orange-text:color-mix(in srgb,${A} 60%,white)}`;
}

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
  const theme = site.settings.theme;
  const brandCss = brandColors(theme.custom_colors);

  return (
    <html
      lang={locale}
      dir={site.dir}
      className={`site ${fontVars}`}
      suppressHydrationWarning
      data-numerals={site.numerals}
      data-preset={theme.preset ?? "ledger"}
      data-motion={theme.motion ?? "full"}
      data-smooth={theme.smooth_scroll === false ? "0" : "1"}
      data-brand={brandCss ? "custom" : undefined}
    >
      <head>
        <ThemeScript defaultMode={theme.default_mode} preset={theme.preset} motion={theme.motion} intro={theme.intro !== false} />
        {brandCss && <style dangerouslySetInnerHTML={{ __html: brandCss }} />}
        <ConsentDefaults />
        <JsonLd data={organizationLd(site, primary)} />
        <JsonLd data={websiteLd(site)} />
      </head>
      <body className="min-h-dvh">
        {theme.background_glow !== false ? (
          <div className="aurora" aria-hidden="true"><span className="a1" /><span className="a2" /><span className="a3" /></div>
        ) : (
          <div className="aurora" aria-hidden="true" />
        )}
        {theme.intro !== false && theme.motion !== "off" && <IntroCurtain />}
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
