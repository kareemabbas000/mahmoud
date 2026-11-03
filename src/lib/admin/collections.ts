import type { Role } from "@/lib/types";

/**
 * Field schema that drives the generic editors (list + form) for every simple collection.
 * Localized fields store {lang: value} so any language added in the panel is editable automatically.
 */
export type Field =
  | { key: string; type: "text" | "textarea" | "url" | "slug" | "email"; label: [string, string]; required?: boolean; help?: [string, string] }
  | { key: string; type: "ltext" | "ltextarea" | "lrich" | "llist"; label: [string, string]; required?: boolean; help?: [string, string] }
  | { key: string; type: "number"; label: [string, string]; min?: number; max?: number }
  | { key: string; type: "boolean"; label: [string, string] }
  | { key: string; type: "select"; label: [string, string]; options: { value: string; label: [string, string] }[] }
  | { key: string; type: "image"; label: [string, string]; required?: boolean }
  | { key: string; type: "date"; label: [string, string] }
  | { key: string; type: "strings"; label: [string, string]; help?: [string, string] }
  | { key: string; type: "icon"; label: [string, string] }
  | { key: string; type: "seo"; label: [string, string] };

export type Collection = {
  key: string;
  table: string;
  tag: string; // cache tag to revalidate
  label: [string, string];
  title: string; // field used as row title (localized or plain)
  sort?: boolean;
  min: Role; // minimum role to edit
  publicPath?: (row: Record<string, unknown>) => string | null;
  defaults: Record<string, unknown>;
  fields: Field[];
  listColumns?: string[];
  filters?: { key: string; options: { value: string; label: [string, string] }[] };
};

const published: Field = { key: "published", type: "boolean", label: ["منشور", "Published"] };
const sort: Field = { key: "sort", type: "number", label: ["الترتيب", "Order"], min: 0 };

export const ICONS = ["audit", "ledger", "building", "chart", "finance", "tax", "team", "layers", "target", "spark", "shield", "globe"];

export const collections: Record<string, Collection> = {
  services: {
    key: "services",
    table: "services",
    tag: "services",
    label: ["الخدمات", "Services"],
    title: "name",
    sort: true,
    min: "editor",
    publicPath: (r) => `/services/${r.slug}`,
    defaults: { published: false, sort: 100, icon: "spark", name: {}, summary: {}, intro: {}, body: {}, highlights: {}, seo: {} },
    fields: [
      { key: "name", type: "ltext", label: ["اسم الخدمة", "Service name"], required: true },
      { key: "slug", type: "slug", label: ["الرابط", "URL slug"], required: true, help: ["أحرف إنجليزية صغيرة وشرطات، مثل tax", "lowercase latin and dashes, e.g. tax"] },
      { key: "icon", type: "icon", label: ["الأيقونة", "Icon"] },
      { key: "summary", type: "ltextarea", label: ["ملخص قصير", "Short summary"] },
      { key: "intro", type: "ltextarea", label: ["مقدمة الصفحة", "Page introduction"] },
      { key: "body", type: "lrich", label: ["المحتوى التفصيلي", "Full description"] },
      { key: "highlights", type: "llist", label: ["أبرز النقاط", "Highlights"] },
      { key: "image", type: "image", label: ["صورة (اختياري)", "Image (optional)"] },
      { key: "seo", type: "seo", label: ["تحسين محركات البحث", "SEO"] },
      sort,
      published,
    ],
    listColumns: ["icon", "slug", "published"],
  },
  team: {
    key: "team",
    table: "team_members",
    tag: "team",
    label: ["فريق العمل", "Team"],
    title: "name",
    sort: true,
    min: "editor",
    publicPath: (r) => (r.has_profile ? `/team/${r.slug}` : "/team"),
    defaults: { published: true, sort: 100, has_profile: false, name: {}, role: {}, credentials: {}, bio: {} },
    fields: [
      { key: "name", type: "ltext", label: ["الاسم", "Name"], required: true },
      { key: "slug", type: "slug", label: ["الرابط", "URL slug"], required: true },
      { key: "role", type: "ltext", label: ["المسمى الوظيفي", "Role"] },
      { key: "photo", type: "image", label: ["الصورة", "Photo"] },
      { key: "credentials", type: "llist", label: ["المؤهلات والعضويات", "Credentials & memberships"] },
      { key: "has_profile", type: "boolean", label: ["صفحة ملف مهني مستقلة", "Has a full profile page"] },
      { key: "bio", type: "lrich", label: ["السيرة المهنية", "Biography"] },
      sort,
      published,
    ],
    listColumns: ["photo", "published"],
  },
  clients: {
    key: "clients",
    table: "clients",
    tag: "clients",
    label: ["العملاء والشركاء", "Clients & partners"],
    title: "name",
    sort: true,
    min: "editor",
    publicPath: () => "/clients",
    defaults: { published: true, featured: false, sort: 100, kind: "corporate", name: {} },
    fields: [
      { key: "name", type: "ltext", label: ["الاسم", "Name"], required: true },
      {
        key: "kind",
        type: "select",
        label: ["النوع", "Type"],
        options: [
          { value: "corporate", label: ["شركة", "Corporate client"] },
          { value: "donor", label: ["جهة مانحة / شريك تنمية", "Donor / development partner"] },
          { value: "ngo", label: ["جمعية / مؤسسة أهلية", "NGO / foundation"] },
        ],
      },
      { key: "logo", type: "image", label: ["الشعار", "Logo"] },
      { key: "url", type: "url", label: ["الموقع الإلكتروني", "Website"] },
      { key: "featured", type: "boolean", label: ["يظهر في شريط الشعارات بالرئيسية", "Show in the home logo marquee"] },
      sort,
      published,
    ],
    listColumns: ["logo", "kind", "featured", "published"],
    filters: { key: "kind", options: [{ value: "corporate", label: ["الشركات", "Corporate"] }, { value: "donor", label: ["المانحون", "Donors"] }, { value: "ngo", label: ["الجمعيات", "NGOs"] }] },
  },
  certificates: {
    key: "certificates",
    table: "certificates",
    tag: "certificates",
    label: ["الاعتمادات والشهادات", "Credentials & certificates"],
    title: "title",
    sort: true,
    min: "editor",
    publicPath: () => "/about",
    defaults: { published: true, sort: 100, title: {}, issuer: {} },
    fields: [
      { key: "title", type: "ltext", label: ["الاعتماد", "Credential"], required: true },
      { key: "issuer", type: "ltext", label: ["الجهة المانحة", "Issuing body"] },
      { key: "reference", type: "text", label: ["رقم القيد / المرجع", "Registration no."] },
      { key: "year", type: "number", label: ["السنة", "Year"], min: 1950, max: 2100 },
      { key: "image", type: "image", label: ["صورة الشهادة", "Certificate scan"] },
      sort,
      published,
    ],
    listColumns: ["reference", "year", "published"],
  },
  branches: {
    key: "branches",
    table: "branches",
    tag: "branches",
    label: ["الفروع والمكاتب", "Branches & offices"],
    title: "name",
    sort: true,
    min: "editor",
    publicPath: () => "/contact",
    defaults: { published: true, sort: 100, is_primary: false, name: {}, address: {}, landmark: {}, hours: {}, phones: [] },
    fields: [
      { key: "name", type: "ltext", label: ["اسم الفرع", "Branch name"], required: true },
      { key: "address", type: "ltextarea", label: ["العنوان", "Address"] },
      { key: "landmark", type: "ltext", label: ["علامة مميزة", "Landmark"] },
      { key: "phones", type: "strings", label: ["أرقام الهاتف (بصيغة دولية)", "Phone numbers (international format)"], help: ["مثال: +201011315442", "e.g. +201011315442"] },
      { key: "email", type: "email", label: ["البريد الإلكتروني", "Email"] },
      { key: "hours", type: "ltext", label: ["مواعيد العمل", "Working hours"] },
      { key: "lat", type: "number", label: ["خط العرض", "Latitude"] },
      { key: "lng", type: "number", label: ["خط الطول", "Longitude"] },
      { key: "is_primary", type: "boolean", label: ["المقر الرئيسي", "Head office"] },
      sort,
      published,
    ],
  },
  faqs: {
    key: "faqs",
    table: "faqs",
    tag: "faqs",
    label: ["الأسئلة الشائعة", "FAQ"],
    title: "question",
    sort: true,
    min: "editor",
    publicPath: () => "/faq",
    defaults: { published: true, sort: 100, group_key: "general", question: {}, answer: {} },
    fields: [
      { key: "question", type: "ltextarea", label: ["السؤال", "Question"], required: true },
      { key: "answer", type: "lrich", label: ["الإجابة", "Answer"] },
      { key: "group_key", type: "text", label: ["المجموعة", "Group"], help: ["مثال: payroll-tax", "e.g. payroll-tax"] },
      { key: "legal_basis", type: "ltext", label: ["الأساس القانوني", "Legal basis"] },
      { key: "reviewed_at", type: "date", label: ["تاريخ آخر مراجعة قانونية", "Last legal review"] },
      sort,
      published,
    ],
    listColumns: ["group_key", "published"],
  },
  gallery: {
    key: "gallery",
    table: "gallery_items",
    tag: "gallery",
    label: ["معرض الصور", "Gallery"],
    title: "caption",
    sort: true,
    min: "editor",
    publicPath: () => "/gallery",
    defaults: { published: true, sort: 100, caption: {}, width: 1200, height: 800 },
    fields: [
      { key: "image", type: "image", label: ["الصورة", "Photo"], required: true },
      { key: "caption", type: "ltextarea", label: ["التعليق", "Caption"] },
      { key: "width", type: "number", label: ["العرض (بكسل)", "Width (px)"] },
      { key: "height", type: "number", label: ["الارتفاع (بكسل)", "Height (px)"] },
      sort,
      published,
    ],
    listColumns: ["image", "published"],
  },
  categories: {
    key: "categories",
    table: "post_categories",
    tag: "taxonomy",
    label: ["تصنيفات المقالات", "Article categories"],
    title: "name",
    min: "editor",
    defaults: { name: {} },
    fields: [
      { key: "name", type: "ltext", label: ["الاسم", "Name"], required: true },
      { key: "slug", type: "slug", label: ["الرابط", "Slug"], required: true },
    ],
  },
  tags: {
    key: "tags",
    table: "post_tags",
    tag: "taxonomy",
    label: ["الوسوم", "Tags"],
    title: "name",
    min: "editor",
    defaults: { name: {} },
    fields: [
      { key: "name", type: "ltext", label: ["الاسم", "Name"], required: true },
      { key: "slug", type: "slug", label: ["الرابط", "Slug"], required: true },
    ],
  },
  authors: {
    key: "authors",
    table: "authors",
    tag: "taxonomy",
    label: ["الكُتّاب", "Authors"],
    title: "name",
    min: "editor",
    defaults: { name: {}, bio: {} },
    fields: [
      { key: "name", type: "ltext", label: ["الاسم", "Name"], required: true },
      { key: "slug", type: "slug", label: ["الرابط", "Slug"], required: true },
      { key: "bio", type: "ltextarea", label: ["نبذة", "Short bio"] },
      { key: "photo", type: "image", label: ["الصورة", "Photo"] },
      { key: "team_slug", type: "text", label: ["رابط عضو الفريق (اختياري)", "Team member slug (optional)"] },
    ],
  },
  redirects: {
    key: "redirects",
    table: "redirects",
    tag: "redirects",
    label: ["التحويلات", "Redirects"],
    title: "source",
    min: "admin",
    defaults: { status: 301, enabled: true },
    fields: [
      { key: "source", type: "text", label: ["المسار القديم", "Old path"], required: true, help: ["يبدأ بـ / مثل /ar/old-page", "Starts with /, e.g. /ar/old-page"] },
      { key: "destination", type: "text", label: ["الوجهة", "Destination"], required: true },
      { key: "status", type: "select", label: ["نوع التحويل", "Type"], options: [{ value: "301", label: ["دائم 301", "Permanent 301"] }, { value: "302", label: ["مؤقت 302", "Temporary 302"] }] },
      { key: "note", type: "text", label: ["ملاحظة", "Note"] },
      { key: "enabled", type: "boolean", label: ["مفعّل", "Enabled"] },
    ],
    listColumns: ["destination", "status", "enabled"],
  },
};

export const getCollection = (key: string) => collections[key] ?? null;
