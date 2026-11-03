"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setAdminLocale } from "@/app/actions/auth";

export function LocaleToggle({ locale, onDeep = false }: { locale: "ar" | "en"; onDeep?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await setAdminLocale(locale === "ar" ? "en" : "ar"); router.refresh(); })}
      className={`rounded-full border px-3 py-1.5 text-sm ${onDeep ? "border-deep-rule text-deep-ink" : "border-rule text-ink hover:bg-paper-2"}`}
      lang={locale === "ar" ? "en" : "ar"}
    >
      {locale === "ar" ? "English" : "العربية"}
    </button>
  );
}
