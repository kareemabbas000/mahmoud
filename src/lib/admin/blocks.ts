/**
 * Page-builder catalogue: every block the site can render, with the fields its editor shows.
 * Field keys match the props each block component reads (components/blocks/*).
 */
export type BField =
  | { key: string; type: "ltext" | "ltextarea" | "lrich" | "lstrings"; label: [string, string]; help?: [string, string] }
  | { key: string; type: "text" | "url" | "image" | "icon"; label: [string, string]; help?: [string, string]; placeholder?: string }
  | { key: string; type: "number"; label: [string, string]; min?: number; max?: number }
  | { key: string; type: "boolean"; label: [string, string] }
  | { key: string; type: "select"; label: [string, string]; options: { value: string; label: [string, string] }[] }
  | { key: string; type: "link"; label: [string, string]; allowWhatsapp?: boolean }
  | { key: string; type: "list"; label: [string, string]; item: BField[]; itemLabel: [string, string]; titleKey?: string };

export type BlockDef = { type: string; group: "intro" | "content" | "proof" | "action" | "layout"; icon: string; label: [string, string]; hint: [string, string]; fields: BField[]; defaults?: Record<string, unknown>; single?: boolean };

const head: BField[] = [
  { key: "eyebrow", type: "ltext", label: ["العنوان الصغير (فوق العنوان)", "Eyebrow (small label)"] },
  { key: "title", type: "ltext", label: ["العنوان", "Title"], help: ["ضع كلمات بين *نجمتين* لتظهر بلون مميز.", "Wrap words in *asterisks* to highlight them."] },
  { key: "intro", type: "ltextarea", label: ["مقدمة قصيرة", "Short intro"] },
];
const link = (key = "link", label: [string, string] = ["رابط «المزيد»", "“More” link"]): BField => ({ key, type: "link", label });

export const BLOCKS: BlockDef[] = [
  {
    type: "hero", group: "intro", icon: "spark", label: ["الواجهة الرئيسية (Hero)", "Hero"], hint: ["العنوان الكبير مع المشهد ثلاثي الأبعاد والأزرار", "Big headline with the 3D scene and buttons"], single: true,
    fields: [
      { key: "title", type: "ltext", label: ["العنوان الرئيسي", "Headline"], help: ["ضع كلمات بين *نجمتين* لتظهر بالبرتقالي.", "Wrap words in *asterisks* to colour them orange."] },
      { key: "subtitle", type: "ltextarea", label: ["الوصف", "Sub-headline"], help: ["{founded} تُستبدل بسنة التأسيس.", "{founded} becomes the founding year."] },
      link("primary", ["الزر الأساسي", "Primary button"]),
      { key: "secondary", type: "link", label: ["الزر الثانوي", "Secondary button"], allowWhatsapp: true },
      { key: "show_contacts", type: "boolean", label: ["إظهار الهاتف والبريد", "Show phone and email"] },
    ],
  },
  { type: "pageHeader", group: "intro", icon: "layers", label: ["رأس الصفحة", "Page header"], hint: ["مسار التنقل والعنوان والمقدمة", "Breadcrumbs, title and intro"], fields: head },
  {
    type: "textMedia", group: "content", icon: "image", label: ["نص مع صورة أو فيديو", "Text with image or video"], hint: ["فقرة بجانب صورة/فيديو مع صور مصغّرة", "Copy beside an image/video, optional photo collage"],
    fields: [
      { key: "eyebrow", type: "ltext", label: ["العنوان الصغير", "Eyebrow"] },
      { key: "title", type: "ltext", label: ["العنوان", "Title"], help: ["{years} = عدد سنوات الخبرة.", "{years} = years in practice."] },
      { key: "text", type: "ltextarea", label: ["النص", "Text"] },
      { key: "image", type: "image", label: ["الصورة (أو صورة غلاف الفيديو)", "Image (or video poster)"] },
      { key: "image_alt", type: "ltext", label: ["النص البديل للصورة", "Image alt text"] },
      { key: "video_url", type: "url", label: ["رابط فيديو يوتيوب (اختياري)", "YouTube URL (optional)"] },
      { key: "media_side", type: "select", label: ["مكان الصورة", "Media side"], options: [{ value: "end", label: ["بعد النص", "After the text"] }, { value: "start", label: ["قبل النص", "Before the text"] }] },
      { key: "collage", type: "list", label: ["صور مصغّرة حول الصورة (حتى 2)", "Collage photos (up to 2)"], itemLabel: ["صورة", "Photo"], item: [{ key: "src", type: "image", label: ["الصورة", "Image"] }, { key: "alt", type: "ltext", label: ["الوصف", "Alt text"] }] },
      link(),
    ],
  },
  { type: "services", group: "content", icon: "layers", label: ["الخدمات", "Services"], hint: ["مشهد الخدمات التفاعلي أو قائمة تفصيلية", "Interactive services scene or a detailed list"], fields: [...head, { key: "layout", type: "select", label: ["الشكل", "Layout"], options: [{ value: "grid", label: ["مشهد تفاعلي", "Interactive scene"] }, { value: "list", label: ["قائمة تفصيلية", "Detailed list"] }] }] },
  {
    type: "process", group: "content", icon: "target", label: ["المراحل / المنهجية", "Process / methodology"], hint: ["بطاقات متتابعة مع حركة التمرير", "Stacked stage cards with scroll motion"],
    fields: [...head, { key: "steps", type: "list", label: ["المراحل", "Stages"], itemLabel: ["مرحلة", "Stage"], titleKey: "title", item: [{ key: "title", type: "ltext", label: ["العنوان", "Title"] }, { key: "text", type: "ltextarea", label: ["الوصف", "Description"] }] }, link()],
  },
  {
    type: "cards", group: "content", icon: "layers", label: ["بطاقات مميزات", "Feature cards"], hint: ["2–4 أعمدة بأيقونات", "2–4 columns with icons"],
    fields: [...head, { key: "columns", type: "select", label: ["الأعمدة", "Columns"], options: [{ value: "2", label: ["2", "2"] }, { value: "3", label: ["3", "3"] }, { value: "4", label: ["4", "4"] }] }, { key: "items", type: "list", label: ["البطاقات", "Cards"], itemLabel: ["بطاقة", "Card"], titleKey: "title", item: [{ key: "icon", type: "icon", label: ["الأيقونة", "Icon"] }, { key: "title", type: "ltext", label: ["العنوان", "Title"] }, { key: "text", type: "ltextarea", label: ["النص", "Text"] }] }],
  },
  { type: "richText", group: "content", icon: "ledger", label: ["نص منسّق", "Rich text"], hint: ["محتوى حر بالمحرر الكامل", "Free content with the full editor"], fields: [...head, { key: "body", type: "lrich", label: ["المحتوى", "Content"] }] },
  { type: "values", group: "content", icon: "shield", label: ["قيم / نقاط", "Values / bullet points"], hint: ["قائمة نقاط قصيرة", "A list of short points"], fields: [...head, { key: "items", type: "lstrings", label: ["النقاط", "Points"] }] },
  { type: "quote", group: "content", icon: "spark", label: ["اقتباس", "Quote"], hint: ["اقتباس بارز مع صاحبه", "A pull quote with its source"], fields: [{ key: "text", type: "ltextarea", label: ["الاقتباس", "Quote"] }, { key: "cite", type: "ltext", label: ["القائل", "Attribution"] }] },
  { type: "image", group: "content", icon: "image", label: ["صورة", "Image"], hint: ["صورة منفردة مع تعليق", "A single image with caption"], fields: [{ key: "src", type: "image", label: ["الصورة", "Image"] }, { key: "alt", type: "ltext", label: ["النص البديل", "Alt text"] }, { key: "caption", type: "ltext", label: ["التعليق", "Caption"] }, { key: "wide", type: "boolean", label: ["عرض كامل", "Full width"] }] },
  { type: "video", group: "content", icon: "play", label: ["فيديو", "Video"], hint: ["فيديو يوتيوب بمشغل خفيف", "YouTube video with a light player"], fields: [...head, { key: "url", type: "url", label: ["رابط يوتيوب", "YouTube URL"] }, { key: "poster", type: "image", label: ["صورة الغلاف", "Poster image"] }] },
  { type: "stats", group: "proof", icon: "chart", label: ["الأرقام (لماذا SCO)", "Figures (Why SCO)"], hint: ["الأرقام ثلاثية الأبعاد من الإعدادات", "3D figures from Settings → Figures"], fields: [{ key: "eyebrow", type: "ltext", label: ["العنوان الصغير", "Eyebrow"] }, { key: "title", type: "ltext", label: ["العنوان", "Title"] }, { key: "text", type: "ltextarea", label: ["النص", "Text"] }] },
  { type: "team", group: "proof", icon: "team", label: ["فريق العمل", "Team"], hint: ["المؤسس وأعضاء الفريق", "Founder and team members"], fields: [...head, link()] },
  { type: "clients", group: "proof", icon: "building", label: ["العملاء", "Clients"], hint: ["حلقة الشعارات ثلاثية الأبعاد أو القائمة الكاملة", "3D logo ring or the full list"], fields: [...head, { key: "mode", type: "select", label: ["الشكل", "Display"], options: [{ value: "marquee", label: ["حلقة الشعارات + أرقام", "Logo ring + counts"] }, { value: "full", label: ["القائمة الكاملة", "Full list"] }] }, link()] },
  { type: "credentials", group: "proof", icon: "shield", label: ["الاعتمادات", "Credentials"], hint: ["القيد والعضويات المهنية", "Registrations and memberships"], fields: [...head, link()] },
  { type: "gallery", group: "proof", icon: "image", label: ["معرض الصور", "Gallery"], hint: ["فسيفساء من صور الأنشطة", "Mosaic of activity photos"], fields: [...head, { key: "limit", type: "number", label: ["عدد الصور (فارغ = الكل)", "Number of photos (empty = all)"], min: 1, max: 60 }, link()] },
  { type: "faq", group: "proof", icon: "search", label: ["أسئلة شائعة", "FAQ"], hint: ["أسئلة مع بحث وبيانات FAQ منظمة", "Questions with search and FAQ schema"], fields: [...head, { key: "group", type: "text", label: ["مجموعة الأسئلة (فارغ = الكل)", "Question group (empty = all)"], placeholder: "payroll-tax" }, { key: "limit", type: "number", label: ["عدد الأسئلة", "Number of questions"], min: 1, max: 100 }, { key: "show_notice", type: "boolean", label: ["إظهار ملاحظة إخلاء المسؤولية", "Show the disclaimer note"] }, link()] },
  { type: "alsoOffered", group: "proof", icon: "layers", label: ["خدمات إضافية", "Also offered"], hint: ["قائمة الخدمات الإضافية من الإعدادات", "Additional services from settings"], fields: head },
  { type: "cta", group: "action", icon: "arrow", label: ["دعوة لإجراء", "Call to action"], hint: ["شريط أزرق بزرّين", "Blue band with two buttons"], fields: [{ key: "title", type: "ltext", label: ["العنوان", "Title"] }, { key: "text", type: "ltextarea", label: ["النص", "Text"] }, link("primary", ["الزر الأساسي", "Primary button"]), { key: "secondary", type: "link", label: ["الزر الثانوي", "Secondary button"], allowWhatsapp: true }] },
  { type: "contact", group: "action", icon: "phone", label: ["نموذج التواصل", "Contact module"], hint: ["قنوات التواصل والخريطة والنموذج", "Channels, map and the enquiry form"], fields: [{ key: "show_map", type: "boolean", label: ["إظهار الخريطة", "Show the map"] }, { key: "service", type: "text", label: ["خدمة محددة مسبقًا (slug)", "Pre-selected service (slug)"] }] },
  { type: "newsletter", group: "action", icon: "mail", label: ["اشتراك النشرة", "Newsletter sign-up"], hint: ["نموذج الاشتراك في النشرة البريدية", "Newsletter sign-up form"], fields: head },
  { type: "careersForm", group: "action", icon: "team", label: ["نموذج التوظيف", "Careers form"], hint: ["استقبال السير الذاتية", "Collects CVs"], fields: head },
  { type: "spacer", group: "layout", icon: "minus", label: ["مسافة", "Spacer"], hint: ["فراغ بين الأقسام", "Space between sections"], fields: [{ key: "size", type: "select", label: ["الحجم", "Size"], options: [{ value: "s", label: ["صغير", "Small"] }, { value: "m", label: ["متوسط", "Medium"] }, { value: "l", label: ["كبير", "Large"] }] }] },
];

export const blockDef = (type: string) => BLOCKS.find((b) => b.type === type) ?? null;

export const GROUPS: { key: BlockDef["group"]; label: [string, string] }[] = [
  { key: "intro", label: ["بداية الصفحة", "Page openers"] },
  { key: "content", label: ["محتوى", "Content"] },
  { key: "proof", label: ["ثقة وإثبات", "Proof & trust"] },
  { key: "action", label: ["تواصل وتحويل", "Conversion"] },
  { key: "layout", label: ["تخطيط", "Layout"] },
];
