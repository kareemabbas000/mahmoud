import "server-only";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { getDefaultLocale, getDictionary, getEnabledLanguages, getLanguages, getMenus, getServices, getSettings } from "@/lib/data";
import { digits, dirOf, fill, makeT, tr } from "@/lib/i18n";
import type { L } from "@/lib/types";

const LOCALE_RE = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;

/**
 * Validate the [locale] segment for a route. Disabled or unknown-but-valid-looking locales
 * redirect to the same path in the default language; garbage → 404.
 */
export async function ensureLocale(locale: string, rest = ""): Promise<void> {
  if (!LOCALE_RE.test(locale)) notFound();
  const enabled = await getEnabledLanguages();
  if (enabled.some((l) => l.code === locale)) return;
  const all = await getLanguages();
  const def = await getDefaultLocale();
  if (all.some((l) => l.code === locale)) permanentRedirect(`/${def}${rest}`);
  notFound();
}

export const getSite = cache(async (locale: string) => {
  const [settings, dict, langs, all, def, menus, services] = await Promise.all([
    getSettings(),
    getDictionary(),
    getEnabledLanguages(),
    getLanguages(),
    getDefaultLocale(),
    getMenus(),
    getServices(),
  ]);
  const tRaw = makeT(dict, locale, def);
  const t = (k: string) => digits(tRaw(k), locale, settings.theme.numerals_ar);
  const founded = settings.brand.founded_year;
  return {
    locale,
    defaultLocale: def,
    dir: dirOf(locale, all),
    langs,
    settings,
    menus,
    services,
    numerals: settings.theme.numerals_ar,
    t,
    /** Localize + fill tokens ({years}, {founded}, {year}). */
    l: (v: L | null | undefined) => digits(fill(tr(v, locale, def), founded), locale, settings.theme.numerals_ar),
  };
});

export type Site = Awaited<ReturnType<typeof getSite>>;
