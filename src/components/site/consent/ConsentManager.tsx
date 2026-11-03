"use client";

import { useCallback, useEffect, useState } from "react";

export type PublicTracking = {
  ga4_id: string;
  gtm_id: string;
  google_ads_id: string;
  google_ads_lead_label: string;
  meta_pixel_id: string;
  clarity_id: string;
  linkedin_partner_id: string;
  tiktok_pixel_id: string;
  custom_head: string;
  custom_body: string;
};
type Consent = { analytics: boolean; marketing: boolean };
type Labels = { title: string; text: string; accept: string; reject: string; customize: string; save: string; necessary: string; analytics: string; marketing: string; policy: string };

const COOKIE = "sco_consent";
const VERSION = 1;

function readConsent(): Consent | null {
  const m = document.cookie.match(/(?:^|;\s*)sco_consent=([^;]+)/);
  if (!m?.[1]) return null;
  try {
    const v = JSON.parse(decodeURIComponent(m[1])) as { a: number; m: number; v: number };
    if (v.v !== VERSION) return null;
    return { analytics: v.a === 1, marketing: v.m === 1 };
  } catch {
    return null;
  }
}
function writeConsent(c: Consent) {
  const v = encodeURIComponent(JSON.stringify({ a: c.analytics ? 1 : 0, m: c.marketing ? 1 : 0, v: VERSION, t: Date.now() }));
  document.cookie = `${COOKIE}=${v};path=/;max-age=${60 * 60 * 24 * 180};samesite=lax${location.protocol === "https:" ? ";secure" : ""}`;
}

function addScript(src: string, id: string, attrs: Record<string, string> = {}) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  s.id = id;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
}
function addInline(code: string, id: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.text = code;
  document.head.appendChild(s);
}
/** Custom snippets from the panel: execute <script> tags, append other markup. */
function addSnippet(html: string, id: string, target: HTMLElement) {
  if (!html.trim() || document.getElementById(id)) return;
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const marker = document.createElement("meta");
  marker.id = id;
  document.head.appendChild(marker);
  tpl.content.childNodes.forEach((node) => {
    if (node instanceof HTMLScriptElement) {
      const s = document.createElement("script");
      [...node.attributes].forEach((a) => s.setAttribute(a.name, a.value));
      s.text = node.text;
      target.appendChild(s);
    } else target.appendChild(node.cloneNode(true));
  });
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[] };
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
    ttq?: { track: (e: string, p?: unknown) => void; page: () => void };
    _linkedin_partner_id?: string;
    lintrk?: (a: string, b: unknown) => void;
  }
}

function apply(c: Consent, t: PublicTracking) {
  window.__scoConsent = c;
  const g = (v: boolean) => (v ? "granted" : "denied");
  window.gtag?.("consent", "update", {
    analytics_storage: g(c.analytics),
    ad_storage: g(c.marketing),
    ad_user_data: g(c.marketing),
    ad_personalization: g(c.marketing),
  });
  if (t.clarity_id && (c.analytics || c.marketing)) {
    addInline(
      `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(t.clarity_id)});`,
      "sco-clarity",
    );
  }
  window.clarity?.("consentv2", { ad_Storage: g(c.marketing), analytics_Storage: g(c.analytics) });

  // Google: GTM (respects Consent Mode itself) or gtag.js for GA4 / Ads.
  if (t.gtm_id && (c.analytics || c.marketing)) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    addScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(t.gtm_id)}`, "sco-gtm");
  }
  const gtagId = t.ga4_id || t.google_ads_id;
  if (gtagId && ((t.ga4_id && c.analytics) || (t.google_ads_id && c.marketing))) {
    addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gtagId)}`, "sco-gtag");
    if (!document.getElementById("sco-gtag-init")) {
      addInline("gtag('js', new Date());", "sco-gtag-init");
      if (t.ga4_id && c.analytics) window.gtag("config", t.ga4_id, { anonymize_ip: true });
      if (t.google_ads_id && c.marketing) window.gtag("config", t.google_ads_id);
    }
  }
  if (c.marketing && t.meta_pixel_id && !window.fbq) {
    addInline(
      `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(t.meta_pixel_id)});fbq('track','PageView');`,
      "sco-meta",
    );
  }
  if (c.marketing && t.linkedin_partner_id) {
    window._linkedin_partner_id = t.linkedin_partner_id;
    addScript("https://snap.licdn.com/li.lms-analytics/insight.min.js", "sco-linkedin");
  }
  if (c.marketing && t.tiktok_pixel_id) {
    addInline(
      `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load(${JSON.stringify(t.tiktok_pixel_id)});ttq.page();}(window,document,'ttq');`,
      "sco-tiktok",
    );
  }
  if (c.marketing) {
    addSnippet(t.custom_head, "sco-custom-head", document.head);
    addSnippet(t.custom_body, "sco-custom-body", document.body);
  }
}

export function ConsentManager({ tracking, labels, privacyHref }: { tracking: PublicTracking; labels: Labels; privacyHref: string }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState<Consent>({ analytics: false, marketing: false });

  useEffect(() => {
    // Conversion router used by every form (GA4 recommended events, Ads conversion, Pixel, TikTok, Clarity).
    window.scoTrack = (event, params = {}) => {
      const c = window.__scoConsent ?? { analytics: false, marketing: false };
      const ga = event === "lead" ? "generate_lead" : event === "sign_up" ? "sign_up" : "generate_lead";
      if (c.analytics || c.marketing) window.gtag?.("event", ga, params);
      window.dataLayer?.push({ event: `sco_${event}`, ...params });
      if (c.marketing) {
        if (tracking.google_ads_id && tracking.google_ads_lead_label && event !== "sign_up")
          window.gtag?.("event", "conversion", { send_to: `${tracking.google_ads_id}/${tracking.google_ads_lead_label}` });
        const eventID = String(params.event_id ?? "");
        window.fbq?.("track", event === "sign_up" ? "CompleteRegistration" : event === "application" ? "SubmitApplication" : "Lead", {}, eventID ? { eventID } : undefined);
        window.ttq?.track(event === "sign_up" ? "CompleteRegistration" : "SubmitForm");
      }
      if (c.analytics) window.clarity?.("event", `sco_${event}`);
    };
    const c = readConsent();
    // Ask only when something would actually be loaded; with no trackers configured there is nothing to consent to.
    const needed = Object.values(tracking).some((v) => typeof v === "string" && v.trim() !== "");
    if (c) apply(c, tracking);
    else if (needed) setOpen(true);
    const reopen = () => {
      setDraft(readConsent() ?? { analytics: false, marketing: false });
      setCustom(true);
      setOpen(true);
    };
    window.addEventListener("sco:open-consent", reopen);
    return () => window.removeEventListener("sco:open-consent", reopen);
  }, [tracking]);

  const decide = useCallback(
    (c: Consent) => {
      writeConsent(c);
      apply(c, tracking);
      setOpen(false);
      setCustom(false);
    },
    [tracking],
  );

  if (!open) return null;
  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      className="consent-pop fixed inset-x-3 z-50 mx-auto max-w-md sm:inset-x-auto sm:start-5"
      style={{ bottom: "max(5rem, calc(env(safe-area-inset-bottom, 0px) + 4.5rem))" }}
    >
      <div className="rounded-2xl border border-rule bg-surface p-3.5 shadow-soft backdrop-blur-xl">
        <p className="text-xs leading-relaxed text-muted">
          <span id="consent-title" className="font-semibold text-ink">{labels.title}. </span>
          {labels.text}{" "}
          <a href={privacyHref} className="text-blue underline underline-offset-2">{labels.policy}</a>
        </p>
        {custom && (
          <fieldset className="mt-3 grid gap-2 text-xs">
            <label className="flex items-center gap-2.5 text-muted">
              <input type="checkbox" checked disabled className="size-4" /> {labels.necessary}
            </label>
            <label className="flex items-center gap-2.5 text-ink">
              <input type="checkbox" className="size-4 accent-[var(--blue)]" checked={draft.analytics} onChange={(e) => setDraft({ ...draft, analytics: e.target.checked })} /> {labels.analytics}
            </label>
            <label className="flex items-center gap-2.5 text-ink">
              <input type="checkbox" className="size-4 accent-[var(--blue)]" checked={draft.marketing} onChange={(e) => setDraft({ ...draft, marketing: e.target.checked })} /> {labels.marketing}
            </label>
          </fieldset>
        )}
        <div className="mt-3 flex items-center gap-2">
          {custom ? (
            <button type="button" className="consent-btn is-main" onClick={() => decide(draft)}>{labels.save}</button>
          ) : (
            <button type="button" className="consent-btn is-main" onClick={() => decide({ analytics: true, marketing: true })}>{labels.accept}</button>
          )}
          <button type="button" className="consent-btn" onClick={() => decide({ analytics: false, marketing: false })}>{labels.reject}</button>
          {!custom && (
            <button type="button" className="ms-auto text-xs text-muted underline underline-offset-2 hover:text-ink" onClick={() => setCustom(true)}>{labels.customize}</button>
          )}
        </div>
      </div>
    </section>
  );
}
