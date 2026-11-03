import type { Branch, Language, Menu, SiteSettings, TrackingSettings } from "@/lib/types";

export const languages: Language[] = [
  { code: "ar", name: "Arabic", native_name: "العربية", dir: "rtl", enabled: true, is_default: true, sort: 1 },
  { code: "en", name: "English", native_name: "English", dir: "ltr", enabled: true, is_default: false, sort: 2 },
];

export const settings: SiteSettings = {
  brand: {
    short_name: "SCO",
    name: { ar: "المكتب الاستشاري المتخصص", en: "Specialized Consulting Office" },
    legal_name: { ar: "محمود الشيخ وشركاه – محاسبون قانونيون ومستشارون وخبراء ضرائب", en: "Mahmoud El Sheikh & Co. – Chartered Accountants, Consultants & Tax Advisers" },
    tagline: { ar: "محاسبون قانونيون · مستشارون · خبراء ضرائب", en: "Chartered Accountants · Consultants · Tax Advisers" },
    founded_year: 2005,
    logo_light: null,
    logo_dark: null,
    favicon: null,
  },
  contact: {
    email: "info@sco-eg.com",
    phones: ["+201011315442", "+201001046442"],
    landlines: ["+20220824165", "+20220824409"],
    whatsapp: "+201010494857",
    notify_email: "info@sco-eg.com",
  },
  social: [
    { platform: "facebook", url: "https://www.facebook.com/MahmmoudElshekh", enabled: true },
    { platform: "youtube", url: "https://www.youtube.com/watch?v=3xzxlWo8TGc", enabled: true },
    { platform: "linkedin", url: "", enabled: false },
    { platform: "x", url: "", enabled: false },
  ],
  seo: {
    title_template: { ar: "%s | SCO المكتب الاستشاري المتخصص", en: "%s | SCO Specialized Consulting Office" },
    default_title: { ar: "SCO | محاسبون قانونيون ومستشارون وخبراء ضرائب في القاهرة", en: "SCO | Chartered Accountants, Consultants & Tax Advisers in Cairo" },
    default_description: {
      ar: "المكتب الاستشاري المتخصص (SCO) منذ 2005: المراجعة الخارجية، والخدمات المحاسبية، والخدمات الضريبية، وتأسيس الشركات، ودراسات الجدوى، وتمويل المشروعات في القاهرة.",
      en: "Specialized Consulting Office (SCO), since 2005: external audit, accounting, tax, company formation, feasibility studies and project finance in Cairo, Egypt.",
    },
    og_image: null,
    verification: {},
  },
  theme: { default_mode: "system", numerals_ar: "latn" },
  header: {
    show_announcement: false,
    announcement: { ar: "", en: "" },
    announcement_url: "",
    show_phone: true,
    show_theme_toggle: true,
    show_language_switcher: true,
    show_cta: true,
    cta_label: { ar: "احجز استشارة", en: "Book a consultation" },
    cta_url: "/contact",
  },
  footer: {
    show_services: true,
    show_contact: true,
    show_social: true,
    show_newsletter: true,
    show_map: true,
    about: {
      ar: "محاسبون قانونيون ومستشارون وخبراء ضرائب منذ عام 2005. نساعد الشركات والمستثمرين والمؤسسات الأهلية على اتخاذ قرارات مالية سليمة.",
      en: "Chartered accountants, consultants and tax advisers since 2005, helping companies, investors and non-profits make sound financial decisions.",
    },
    copyright: { ar: "© {year} المكتب الاستشاري المتخصص. جميع الحقوق محفوظة.", en: "© {year} Specialized Consulting Office. All rights reserved." },
  },
  floating: { whatsapp: true, call: true },
  stats: {
    // Legacy values (AR home page). Hidden until SCO confirms them — see docs/OPEN_QUESTIONS.md A1.
    visible: false,
    items: [
      { key: "years", value: null, auto_years: true, label: { ar: "عامًا من الخبرة", en: "years of practice" } },
      { key: "clients", value: 590, label: { ar: "عميل", en: "clients" } },
      { key: "services", value: 2742, label: { ar: "خدمة مقدَّمة", en: "engagements delivered" } },
      { key: "consultations", value: 5149, label: { ar: "استشارة", en: "consultations" } },
    ],
  },
};

export const tracking: TrackingSettings = {
  ga4_id: "",
  gtm_id: "",
  google_ads_id: "",
  google_ads_lead_label: "",
  meta_pixel_id: "",
  meta_capi_enabled: false,
  clarity_id: "",
  linkedin_partner_id: "",
  tiktok_pixel_id: "",
  custom_head: "",
  custom_body: "",
};

export const branches: Branch[] = [
  {
    sort: 1,
    published: true,
    is_primary: true,
    name: { ar: "المقر الرئيسي – النزهة", en: "Head office – El Nozha" },
    address: { ar: "92 شارع عبد العزيز فهمي، النزهة، القاهرة، مصر", en: "92 Abdel Aziz Fahmy St., El Nozha, Cairo, Egypt" },
    landmark: { ar: "بجوار قسم شرطة النزهة، وقريب من محطة مترو هليوبوليس", en: "Next to El Nozha police station, near Heliopolis metro station" },
    phones: ["+201011315442", "+201001046442", "+20220824165", "+20220824409"],
    email: "info@sco-eg.com",
    hours: { ar: "", en: "" },
    lat: 30.107487,
    lng: 31.337956,
  },
];

export const menus: Menu[] = [
  {
    location: "header",
    items: [
      { id: "about", label: { ar: "من نحن", en: "About" }, href: "/about" },
      {
        id: "services",
        label: { ar: "خدماتنا", en: "Services" },
        href: "/services",
        children: [
          { id: "s1", label: { ar: "المراجعة الخارجية", en: "External Audit" }, href: "/services/external-audit" },
          { id: "s2", label: { ar: "الخدمات المحاسبية", en: "Accounting & Bookkeeping" }, href: "/services/accounting" },
          { id: "s3", label: { ar: "الخدمات الضريبية", en: "Tax Services" }, href: "/services/tax" },
          { id: "s4", label: { ar: "تأسيس الشركات", en: "Company Formation" }, href: "/services/company-formation" },
          { id: "s5", label: { ar: "دراسات الجدوى", en: "Feasibility Studies" }, href: "/services/feasibility-studies" },
          { id: "s6", label: { ar: "تمويل المشروعات", en: "Project Finance" }, href: "/services/project-finance" },
        ],
      },
      { id: "team", label: { ar: "فريق العمل", en: "Team" }, href: "/team" },
      { id: "clients", label: { ar: "عملاؤنا", en: "Clients" }, href: "/clients" },
      { id: "insights", label: { ar: "رؤى ومقالات", en: "Insights" }, href: "/insights" },
      { id: "faq", label: { ar: "الأسئلة الشائعة", en: "FAQ" }, href: "/faq" },
      { id: "contact", label: { ar: "اتصل بنا", en: "Contact" }, href: "/contact" },
    ],
  },
  {
    location: "footer",
    items: [
      {
        id: "firm",
        label: { ar: "المكتب", en: "The firm" },
        href: "/about",
        children: [
          { id: "f1", label: { ar: "من نحن", en: "About SCO" }, href: "/about" },
          { id: "f2", label: { ar: "فريق العمل", en: "Our team" }, href: "/team" },
          { id: "f3", label: { ar: "عملاؤنا", en: "Clients" }, href: "/clients" },
          { id: "f4", label: { ar: "معرض الصور", en: "Gallery" }, href: "/gallery" },
          { id: "f5", label: { ar: "الوظائف", en: "Careers" }, href: "/careers" },
        ],
      },
      {
        id: "resources",
        label: { ar: "موارد", en: "Resources" },
        href: "/insights",
        children: [
          { id: "r1", label: { ar: "رؤى ومقالات", en: "Insights" }, href: "/insights" },
          { id: "r2", label: { ar: "الأسئلة الشائعة", en: "Tax FAQ" }, href: "/faq" },
          { id: "r3", label: { ar: "سياسة الخصوصية", en: "Privacy policy" }, href: "/privacy" },
          { id: "r4", label: { ar: "الشروط والأحكام", en: "Terms of use" }, href: "/terms" },
        ],
      },
    ],
  },
];
