import { requirePage } from "@/lib/admin/auth";
import { getAdminT, bi } from "@/lib/admin/i18n";
import { sessionClient } from "@/lib/supabase/clients";
import { PageTitle, Forbidden } from "@/components/admin/PageTitle";
import { SettingsEditor, type Section } from "@/components/admin/settings/SettingsEditor";
import { settings as seed } from "@/content/seed/site";

export const dynamic = "force-dynamic";

const deepMerge = (a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = { ...a };
  for (const [k, v] of Object.entries(b ?? {})) out[k] = v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" && !Array.isArray(a[k]) ? deepMerge(a[k] as Record<string, unknown>, v as Record<string, unknown>) : v;
  return out;
};

const sections: Section[] = [
  {
    key: "brand", label: ["الهوية", "Brand"], intro: ["الاسم والشعار وسنة التأسيس كما تظهر في كل الموقع.", "Name, logo and founding year as shown across the site."],
    fields: [
      { path: "brand.short_name", type: "text", label: ["الاسم المختصر", "Short name"] },
      { path: "brand.name", type: "ltext", label: ["اسم المكتب", "Firm name"] },
      { path: "brand.legal_name", type: "ltext", label: ["الاسم القانوني", "Legal name"] },
      { path: "brand.tagline", type: "ltext", label: ["الشعار اللفظي", "Tagline"] },
      { path: "brand.founded_year", type: "number", label: ["سنة التأسيس", "Founding year"], help: ["تُحسب منها «سنوات الخبرة» تلقائيًا.", "“Years in practice” is calculated from it."] },
      { path: "brand.logo_light", type: "image", label: ["الشعار (الوضع الفاتح)", "Logo (light mode)"], help: ["اتركه فارغًا لاستخدام الشعار المرسوم المدمج.", "Leave empty to use the built-in drawn logo."] },
      { path: "brand.logo_dark", type: "image", label: ["الشعار (الوضع الداكن)", "Logo (dark mode)"] },
      { path: "brand.favicon", type: "image", label: ["أيقونة المتصفح", "Favicon"] },
    ],
  },
  {
    key: "contact", label: ["بيانات التواصل", "Contact details"], intro: ["تظهر في الرأس والتذييل وصفحة التواصل وأزرار الاتصال.", "Shown in the header, footer, contact page and call buttons."],
    fields: [
      { path: "contact.email", type: "email", label: ["البريد الإلكتروني العام", "Public email"] },
      { path: "contact.phones", type: "strings", label: ["أرقام الموبايل", "Mobile numbers"], placeholder: "+201011315442", help: ["بالصيغة الدولية: ‎+20…", "In international format: +20…"] },
      { path: "contact.landlines", type: "strings", label: ["أرقام الهاتف الأرضي", "Landlines"], placeholder: "+20220824165" },
      { path: "contact.whatsapp", type: "tel", label: ["رقم واتساب", "WhatsApp number"], placeholder: "+201010494857" },
      { path: "contact.notify_email", type: "email", label: ["بريد استقبال الطلبات", "Enquiry notification email"], help: ["تصل إليه نسخة من كل طلب يُرسل من الموقع.", "A copy of every enquiry from the site goes here."] },
    ],
  },
  { key: "social", label: ["حسابات التواصل الاجتماعي", "Social accounts"], fields: [{ path: "social", type: "social", label: ["الحسابات", "Accounts"] }] },
  {
    key: "seo", label: ["SEO الافتراضي", "Default SEO"], intro: ["تُستخدم عندما لا تحدد الصفحة أو المقال قيمها الخاصة.", "Used when a page or post doesn't set its own."],
    fields: [
      { path: "seo.default_title", type: "ltext", label: ["العنوان الافتراضي", "Default title"] },
      { path: "seo.title_template", type: "ltext", label: ["قالب العنوان", "Title template"], help: ["%s = عنوان الصفحة، مثل: %s | SCO", "%s = page title, e.g. %s | SCO"] },
      { path: "seo.default_description", type: "ltextarea", label: ["الوصف الافتراضي", "Default description"] },
      { path: "seo.og_image", type: "image", label: ["صورة المشاركة الافتراضية", "Default share image"], help: ["1200×630 بكسل.", "1200×630 px."] },
      { path: "seo.verification.google", type: "text", label: ["تحقق Google Search Console", "Google Search Console verification"], placeholder: "content=… value only" },
      { path: "seo.verification.bing", type: "text", label: ["تحقق Bing Webmaster", "Bing Webmaster verification"] },
      { path: "seo.verification.yandex", type: "text", label: ["تحقق Yandex", "Yandex verification"] },
    ],
  },
  {
    key: "theme", label: ["المظهر", "Appearance"],
    fields: [
      { path: "theme.default_mode", type: "select", label: ["الوضع الافتراضي", "Default mode"], options: [{ value: "light", label: ["فاتح", "Light"] }, { value: "dark", label: ["داكن", "Dark"] }, { value: "system", label: ["حسب جهاز الزائر", "Follow the visitor's device"] }] },
      { path: "theme.preset", type: "select", label: ["لوحة الألوان", "Colour preset"], options: [{ value: "ledger", label: ["الأزرق والبرتقالي", "Blue & orange"] }, { value: "gold", label: ["الذهبي", "Gold"] }] },
      { path: "theme.numerals_ar", type: "select", label: ["الأرقام في النسخة العربية", "Numerals in Arabic"], options: [{ value: "latn", label: ["123", "123"] }, { value: "arab", label: ["١٢٣", "١٢٣"] }] },
      { path: "theme.hero_3d", type: "boolean", label: ["المشهد ثلاثي الأبعاد في الواجهة", "3D scene in the hero"] },
      { path: "theme.motion", type: "select", label: ["الحركة والتأثيرات", "Motion & effects"], options: [{ value: "full", label: ["كاملة", "Full"] }, { value: "subtle", label: ["هادئة", "Subtle"] }, { value: "off", label: ["بدون حركة", "Off"] }], help: ["«هادئة» تُبقي ظهور الأقسام بنعومة وتُلغي مشاهد التمرير والإمالة. «بدون حركة» موقع ثابت تمامًا.", "“Subtle” keeps gentle reveals but drops scroll scenes and tilt. “Off” makes the site fully static."] },
      { path: "theme.intro", type: "boolean", label: ["الشاشة الافتتاحية عند أول زيارة", "Intro animation on the first visit"] },
      { path: "theme.background_glow", type: "boolean", label: ["الإضاءة الملوّنة في الخلفية", "Coloured glow in the background"] },
      { path: "theme.smooth_scroll", type: "boolean", label: ["تمرير ناعم (الكمبيوتر)", "Smooth scrolling (desktop)"] },
      { path: "theme.custom_colors.enabled", type: "boolean", label: ["استخدام ألوان مخصصة للعلامة", "Use custom brand colours"], help: ["تحل محل لوحة الألوان المختارة أعلاه. تُضبط درجات الوضع الداكن تلقائيًا.", "Replaces the colour preset above. Dark-mode shades are derived automatically."] },
      { path: "theme.custom_colors.primary", type: "color", label: ["اللون الأساسي (الأزرار والروابط)", "Primary colour (buttons, links)"] },
      { path: "theme.custom_colors.accent", type: "color", label: ["لون التمييز (العناوين المميزة والعلامات)", "Accent colour (highlights, marks)"] },
    ],
  },
  {
    key: "images", label: ["صور التصميم", "Design images"], intro: ["صور يستخدمها تصميم الموقع نفسه (ليست داخل قسم أو مجموعة). صور الأقسام والفريق والمعرض تُغيَّر من أماكنها، أو من «الوسائط» ← «استبدال» لتتغير في كل مكان.", "Images used by the design itself (not inside a section or collection). Section, team and gallery images are changed where they are, or from Media → Replace to change them everywhere."],
    fields: [
      { path: "images.founder_cutout", type: "image", label: ["صورة المؤسس المفرّغة (قسم الفريق وصفحته)", "Founder cut-out portrait (team section and profile)"], help: ["PNG بخلفية شفافة، طولية.", "Transparent-background PNG, portrait."] },
      { path: "images.video_poster", type: "image", label: ["غلاف الفيديو الافتراضي", "Default video poster"] },
      { path: "images.organization", type: "image", label: ["صورة المكتب لمحركات البحث", "Office image for search engines"] },
      { path: "images.logo_schema", type: "image", label: ["الشعار لمحركات البحث", "Logo for search engines"], help: ["PNG مربّع أو أفقي على خلفية بيضاء.", "Square or wide PNG on white."] },
    ],
  },
  {
    key: "languages", label: ["اللغات ولغة الدخول", "Languages & landing"], intro: ["اللغة الافتراضية هي التي يفتح بها الموقع لكل زائر جديد.", "The default language is the one the site opens in for every new visitor."],
    fields: [
      { path: "_languages", type: "link", label: ["اللغة الافتراضية وتفعيل اللغات", "Default language and enabled languages"], href: "/admin/languages", cta: ["فتح إعدادات اللغات", "Open language settings"] },
      { path: "_translations", type: "link", label: ["نصوص الواجهة (الأزرار والقوائم والرسائل)", "Interface texts (buttons, menus, messages)"], href: "/admin/translations", cta: ["فتح النصوص والترجمات", "Open texts & translations"] },
    ],
  },
  {
    key: "header", label: ["الرأس وشريط الإعلان", "Header & announcement"],
    fields: [
      { path: "header.show_announcement", type: "boolean", label: ["إظهار شريط الإعلان أعلى الموقع", "Show the announcement bar"] },
      { path: "header.announcement", type: "ltext", label: ["نص الإعلان", "Announcement text"] },
      { path: "header.announcement_url", type: "text", label: ["رابط الإعلان", "Announcement link"], placeholder: "/insights/…" },
      { path: "header.show_cta", type: "boolean", label: ["إظهار زر الحجز", "Show the booking button"] },
      { path: "header.cta_label", type: "ltext", label: ["نص زر الحجز", "Booking button text"] },
      { path: "header.cta_url", type: "text", label: ["رابط زر الحجز", "Booking button link"], placeholder: "/contact" },
      { path: "header.show_phone", type: "boolean", label: ["إظهار الهاتف في الرأس", "Show the phone in the header"] },
      { path: "header.show_language_switcher", type: "boolean", label: ["إظهار تبديل اللغة", "Show the language switch"] },
      { path: "header.show_theme_toggle", type: "boolean", label: ["إظهار زر الوضع الفاتح/الداكن", "Show the light/dark toggle"] },
    ],
  },
  {
    key: "footer", label: ["التذييل", "Footer"],
    fields: [
      { path: "footer.about", type: "ltextarea", label: ["نبذة التذييل", "Footer blurb"] },
      { path: "footer.copyright", type: "ltext", label: ["حقوق النشر", "Copyright line"] },
      { path: "footer.show_services", type: "boolean", label: ["قائمة الخدمات", "Services list"] },
      { path: "footer.show_contact", type: "boolean", label: ["بيانات التواصل", "Contact details"] },
      { path: "footer.show_map", type: "boolean", label: ["الخريطة", "Map"] },
      { path: "footer.show_newsletter", type: "boolean", label: ["الاشتراك في النشرة", "Newsletter sign-up"] },
      { path: "footer.show_social", type: "boolean", label: ["أيقونات التواصل الاجتماعي", "Social icons"] },
    ],
  },
  {
    key: "floating", label: ["أزرار التواصل العائمة", "Floating contact buttons"],
    fields: [
      { path: "floating.whatsapp", type: "boolean", label: ["زر واتساب", "WhatsApp button"] },
      { path: "floating.call", type: "boolean", label: ["زر الاتصال (الموبايل)", "Call button (mobile)"] },
    ],
  },
  { key: "stats", label: ["الأرقام", "Figures"], intro: ["الأرقام التي تظهر في قسم «لماذا SCO».", "The figures shown in the “Why SCO” section."], fields: [{ path: "stats.visible", type: "boolean", label: ["إظهار الأرقام", "Show the figures"] }, { path: "stats.items", type: "stats", label: ["الأرقام", "Figures"] }] },
];

export default async function SettingsPage() {
  const { staff, allowed } = await requirePage("admin");
  void staff;
  const { locale } = await getAdminT();
  if (!allowed) return <Forbidden ar={locale === "ar"} />;
  const sb = (await sessionClient())!;
  const { data } = await sb.from("settings").select("value").eq("key", "site").maybeSingle();
  const value = deepMerge(seed as unknown as Record<string, unknown>, (data?.value ?? {}) as Record<string, unknown>);
  return (
    <>
      <PageTitle title={bi(locale, "إعدادات الموقع", "Site settings")} intro={bi(locale, "كل ما يظهر في الموقع من هوية وبيانات تواصل ومظهر. التغييرات تظهر فور الحفظ.", "Everything about the site's identity, contact details and appearance. Changes go live as soon as you save.")} />
      <SettingsEditor settingKey="site" initial={value} sections={sections} />
    </>
  );
}
