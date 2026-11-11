import { requirePage } from "@/lib/admin/auth";
import { getAdminT, bi } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { PageTitle, Forbidden } from "@/components/admin/PageTitle";
import { SettingsEditor, type Section } from "@/components/admin/settings/SettingsEditor";
import { tracking as seed } from "@/content/seed/site";

export const dynamic = "force-dynamic";

const consent: [string, string] = ["لا يُحمَّل أي كود قبل موافقة الزائر على ملفات تعريف الارتباط، وتظهر نافذة الموافقة تلقائيًا بمجرد إضافة أي معرّف.", "Nothing loads before the visitor consents; the cookie notice appears automatically once any ID is added."];

const sections: Section[] = [
  {
    key: "google", label: ["جوجل", "Google"], intro: consent,
    fields: [
      { path: "ga4_id", type: "text", label: ["Google Analytics 4 — معرّف القياس", "Google Analytics 4 — Measurement ID"], placeholder: "G-XXXXXXXXXX", help: ["من GA4: الإدارة ← مصادر البيانات ← الويب.", "From GA4: Admin → Data streams → Web."] },
      { path: "gtm_id", type: "text", label: ["Google Tag Manager", "Google Tag Manager"], placeholder: "GTM-XXXXXXX", help: ["استخدم GTM أو GA4 مباشرة، لا داعي للاثنين معًا.", "Use GTM or GA4 directly — not both."] },
      { path: "google_ads_id", type: "text", label: ["Google Ads — معرّف التحويل", "Google Ads — Conversion ID"], placeholder: "AW-XXXXXXXXX" },
      { path: "google_ads_lead_label", type: "text", label: ["Google Ads — تسمية تحويل الطلبات", "Google Ads — lead conversion label"], help: ["يُرسل تحويل عند كل طلب استشارة ناجح.", "A conversion fires on every successful enquiry."] },
    ],
  },
  {
    key: "meta", label: ["ميتا (فيسبوك وإنستجرام)", "Meta (Facebook & Instagram)"], intro: consent,
    fields: [
      { path: "meta_pixel_id", type: "text", label: ["معرّف البكسل", "Pixel ID"], placeholder: "123456789012345" },
      { path: "meta_capi_enabled", type: "boolean", label: ["تفعيل Conversions API من الخادم", "Enable the server-side Conversions API"], help: ["يتطلب إضافة META_CAPI_ACCESS_TOKEN في إعدادات Vercel (لا يُكتب هنا).", "Needs META_CAPI_ACCESS_TOKEN in the Vercel settings (never entered here)."] },
    ],
  },
  {
    key: "other", label: ["أدوات أخرى", "Other tools"], intro: consent,
    fields: [
      { path: "clarity_id", type: "text", label: ["Microsoft Clarity", "Microsoft Clarity"], placeholder: "abcdefghij", help: ["خرائط حرارية وتسجيلات للجلسات.", "Heatmaps and session recordings."] },
      { path: "linkedin_partner_id", type: "text", label: ["LinkedIn Insight Tag", "LinkedIn Insight Tag"], placeholder: "1234567" },
      { path: "tiktok_pixel_id", type: "text", label: ["TikTok Pixel", "TikTok Pixel"] },
    ],
  },
  {
    key: "custom", label: ["كود مخصص", "Custom code"], intro: ["للأدوات غير المدرجة أعلاه. يُحمَّل فقط بعد موافقة الزائر على التسويق. لا تلصق كودًا من مصدر غير موثوق.", "For tools not listed above. Loads only after marketing consent. Never paste code from an untrusted source."],
    fields: [
      { path: "custom_head", type: "code", label: ["داخل <head>", "Inside <head>"] },
      { path: "custom_body", type: "code", label: ["بداية <body>", "Start of <body>"] },
    ],
  },
];

export default async function TrackingPage() {
  const { allowed } = await requirePage("admin");
  const { locale } = await getAdminT();
  if (!allowed) return <Forbidden ar={locale === "ar"} />;
  const sb = (await sessionClient())!;
  const { data } = await sb.from("settings").select("value").eq("key", "tracking").maybeSingle();
  const value = { ...(seed as unknown as Record<string, unknown>), ...((data?.value ?? {}) as Record<string, unknown>) };
  return (
    <>
      <PageTitle title={bi(locale, "التحليلات والتتبع", "Analytics & tracking")} intro={bi(locale, "أضف معرّفات أدوات القياس والإعلانات. كلها تحترم موافقة الزائر (Consent Mode v2).", "Add your analytics and ad tool IDs. All of them respect visitor consent (Consent Mode v2).")} />
      <SettingsEditor settingKey="tracking" initial={value} sections={sections} />
    </>
  );
}
