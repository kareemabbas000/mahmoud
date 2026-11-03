import type { L, Language, Numerals } from "./types";

export const FALLBACK_LOCALE = "ar";

/** Pick a localized value, falling back to the default language, then to any value. */
export function pick<T = string>(v: L<T> | null | undefined, locale: string, fallback = FALLBACK_LOCALE): T | undefined {
  if (!v) return undefined;
  const own = v[locale];
  if (own !== undefined && own !== null && (typeof own !== "string" || own !== "")) return own;
  const fb = v[fallback];
  if (fb !== undefined && fb !== null && (typeof fb !== "string" || fb !== "")) return fb;
  return Object.values(v).find((x) => x !== undefined && x !== null && x !== "");
}

export const tr = (v: L | null | undefined, locale: string, fallback?: string) => pick(v, locale, fallback) ?? "";

export type Dict = Record<string, Record<string, string>>;
export const makeT = (dict: Dict, locale: string, fallback = FALLBACK_LOCALE) => (key: string) =>
  dict[key]?.[locale] || dict[key]?.[fallback] || dict[key]?.en || key;

export function dirOf(locale: string, langs: Language[]): "rtl" | "ltr" {
  return langs.find((l) => l.code === locale)?.dir ?? (["ar", "fa", "he", "ur"].includes(locale) ? "rtl" : "ltr");
}

/** Prefix internal paths with the locale; leave external/special links alone. */
export function href(path: string, locale: string): string {
  if (!path) return `/${locale}`;
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  if (!path.startsWith("/")) return path;
  return `/${locale}${path === "/" ? "" : path}`;
}

/** Template tokens available in any text field: {years}, {founded}, {year}. */
export function fill(text: string, founded: number): string {
  const now = new Date().getFullYear();
  return text
    .replaceAll("{years}", String(now - founded))
    .replaceAll("{founded}", String(founded))
    .replaceAll("{year}", String(now));
}

/** Format a number honoring the Arabic numerals setting (phones/emails never go through this). */
export function num(n: number, locale: string, numerals: Numerals = "latn", grouping = true): string {
  const tag = locale === "ar" ? (numerals === "arab" ? "ar-EG" : "ar-EG-u-nu-latn") : locale;
  try {
    return new Intl.NumberFormat(tag, { useGrouping: grouping }).format(n);
  } catch {
    return String(n);
  }
}

/** Convert Western digits inside free text to Arabic-Indic when the setting asks for it. */
export function digits(text: string, locale: string, numerals: Numerals): string {
  if (locale !== "ar" || numerals !== "arab") return text;
  return text.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)] ?? d);
}

export function formatDate(iso: string, locale: string, numerals: Numerals = "latn"): string {
  const tag = locale === "ar" ? (numerals === "arab" ? "ar-EG" : "ar-EG-u-nu-latn") : locale;
  try {
    return new Intl.DateTimeFormat(tag, { year: "numeric", month: "long", day: "numeric" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

/** "+201011315442" → "+20 101 131 5442" (always LTR, Western digits). */
export function prettyPhone(e164: string): string {
  const d = e164.replace(/[^\d+]/g, "");
  const m = /^\+20(\d{2,3})(\d{3,4})(\d{4})$/.exec(d);
  if (m) return `+20 ${m[1]} ${m[2]} ${m[3]}`;
  return d;
}

export const waLink = (e164: string, text?: string) =>
  `https://wa.me/${e164.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
