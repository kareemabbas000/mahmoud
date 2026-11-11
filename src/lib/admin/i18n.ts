import "server-only";
import { cookies } from "next/headers";

/** Control-panel interface strings (the panel is fully bilingual, RTL in Arabic). */
const D = {
  "app.title": { ar: "لوحة التحكم", en: "Control panel" },
  "app.view_site": { ar: "عرض الموقع", en: "View site" },
  "app.sign_out": { ar: "تسجيل الخروج", en: "Sign out" },
  "app.language": { ar: "English", en: "العربية" },
  "nav.dashboard": { ar: "الرئيسية", en: "Dashboard" },
  "nav.content": { ar: "المحتوى", en: "Content" },
  "nav.pages": { ar: "الصفحات", en: "Pages" },
  "nav.posts": { ar: "رؤى ومقالات", en: "Insights" },
  "nav.services": { ar: "الخدمات", en: "Services" },
  "nav.team": { ar: "فريق العمل", en: "Team" },
  "nav.clients": { ar: "العملاء والشركاء", en: "Clients & partners" },
  "nav.certificates": { ar: "الاعتمادات", en: "Credentials" },
  "nav.branches": { ar: "الفروع والمكاتب", en: "Branches & offices" },
  "nav.faqs": { ar: "الأسئلة الشائعة", en: "FAQ" },
  "nav.gallery": { ar: "معرض الصور", en: "Gallery" },
  "nav.taxonomy": { ar: "التصنيفات والوسوم والكُتّاب", en: "Categories, tags & authors" },
  "nav.media": { ar: "مكتبة الوسائط", en: "Media library" },
  "nav.engage": { ar: "التواصل", en: "Engagement" },
  "nav.enquiries": { ar: "صندوق الطلبات", en: "Enquiries" },
  "nav.newsletter": { ar: "النشرة البريدية", en: "Newsletter" },
  "nav.site": { ar: "الموقع", en: "Site" },
  "nav.menus": { ar: "القوائم والرأس والتذييل", en: "Menus, header & footer" },
  "nav.languages": { ar: "اللغات", en: "Languages" },
  "nav.translations": { ar: "النصوص والترجمات", en: "Texts & translations" },
  "nav.settings": { ar: "إعدادات الموقع", en: "Site settings" },
  "nav.tracking": { ar: "التحليلات والتتبع", en: "Analytics & tracking" },
  "nav.redirects": { ar: "التحويلات", en: "Redirects" },
  "nav.admin": { ar: "الإدارة", en: "Administration" },
  "nav.users": { ar: "المستخدمون والصلاحيات", en: "Users & roles" },
  "nav.audit": { ar: "سجل التغييرات", en: "Audit log" },
  "role.owner": { ar: "المالك", en: "Owner" },
  "role.admin": { ar: "مدير", en: "Admin" },
  "role.editor": { ar: "محرر", en: "Editor" },
  "role.viewer": { ar: "مشاهد", en: "Viewer" },
  "act.save": { ar: "حفظ", en: "Save" },
  "act.saving": { ar: "جارٍ الحفظ…", en: "Saving…" },
  "act.saved": { ar: "تم الحفظ", en: "Saved" },
  "act.publish": { ar: "نشر", en: "Publish" },
  "act.published": { ar: "تم النشر — التغييرات على الموقع خلال ثوانٍ", en: "Published — live on the site within seconds" },
  "act.new": { ar: "إضافة جديد", en: "Add new" },
  "act.edit": { ar: "تعديل", en: "Edit" },
  "act.delete": { ar: "حذف", en: "Delete" },
  "act.confirm_delete": { ar: "تأكيد الحذف نهائيًّا؟", en: "Delete permanently?" },
  "act.cancel": { ar: "إلغاء", en: "Cancel" },
  "act.back": { ar: "رجوع", en: "Back" },
  "act.search": { ar: "بحث", en: "Search" },
  "act.export_csv": { ar: "تصدير CSV", en: "Export CSV" },
  "act.duplicate": { ar: "تكرار", en: "Duplicate" },
  "act.hide": { ar: "إخفاء", en: "Hide" },
  "act.show": { ar: "إظهار", en: "Show" },
  "act.upload": { ar: "رفع ملفات", en: "Upload files" },
  "act.choose": { ar: "اختيار", en: "Choose" },
  "act.copy": { ar: "نسخ", en: "Copy" },
  "act.copied": { ar: "تم النسخ", en: "Copied" },
  "act.preview": { ar: "معاينة", en: "Preview" },
  "act.undo": { ar: "تراجع", en: "Undo" },
  "act.redo": { ar: "إعادة", en: "Redo" },
  "act.restore": { ar: "استعادة", en: "Restore" },
  "act.send": { ar: "إرسال", en: "Send" },
  "act.invite": { ar: "دعوة", en: "Invite" },
  "act.revoke": { ar: "إلغاء الدعوة", en: "Revoke" },
  "err.forbidden": { ar: "ليست لديك صلاحية لهذا الإجراء.", en: "You don't have permission to do this." },
  "err.blocked": { ar: "لم يُحفظ أي تغيير: رفضت قاعدة البيانات العملية (صلاحيات غير كافية أو السجل غير موجود).", en: "Nothing was saved: the database rejected the change (insufficient permissions or the record no longer exists)." },
  "err.generic": { ar: "حدث خطأ. حاول مرة أخرى.", en: "Something went wrong. Please try again." },
  "err.not_configured": { ar: "لم يتم ربط قاعدة البيانات بعد. أضف متغيرات Supabase في إعدادات البيئة.", en: "The database is not connected yet. Add the Supabase environment variables." },
  "field.published": { ar: "منشور", en: "Published" },
  "field.sort": { ar: "الترتيب", en: "Order" },
  "field.slug": { ar: "الرابط (slug)", en: "URL slug" },
  "status.draft": { ar: "مسودة", en: "Draft" },
  "status.scheduled": { ar: "مجدول", en: "Scheduled" },
  "status.published": { ar: "منشور", en: "Published" },
  "status.new": { ar: "جديد", en: "New" },
  "status.in_progress": { ar: "قيد المتابعة", en: "In progress" },
  "status.replied": { ar: "تم الرد", en: "Replied" },
  "status.closed": { ar: "مغلق", en: "Closed" },
  "status.spam": { ar: "مزعج", en: "Spam" },
  "missing": { ar: "ترجمات ناقصة", en: "missing translations" },
  "empty": { ar: "لا توجد عناصر بعد.", en: "Nothing here yet." },
} as const;

export type AdminKey = keyof typeof D;
export type AdminLocale = "ar" | "en";

export async function getAdminLocale(): Promise<AdminLocale> {
  // The control panel defaults to English; Arabic is one click away (the public site stays Arabic-first).
  const c = (await cookies()).get("admin_locale")?.value;
  return c === "ar" ? "ar" : "en";
}

export async function getAdminT() {
  const locale = await getAdminLocale();
  return { locale, dir: locale === "ar" ? ("rtl" as const) : ("ltr" as const), t: (k: AdminKey) => D[k]?.[locale] ?? k };
}

/** Inline bilingual string helper for one-off labels: L("نص", "Text"). */
export const bi = (locale: AdminLocale, ar: string, en: string) => (locale === "ar" ? ar : en);
