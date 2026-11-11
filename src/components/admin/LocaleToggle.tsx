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
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${onDeep ? "border-white/20 text-white hover:bg-white/10" : "border-rule-strong bg-white text-ink hover:bg-paper-2"}`}
      lang={locale === "ar" ? "en" : "ar"}
    >
      {locale === "ar" ? "English" : "العربية"}
    </button>
  );
}
