"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type AdminLang = { code: string; native_name: string; dir: "ltr" | "rtl"; enabled: boolean; is_default: boolean };
type Toast = { id: number; kind: "ok" | "err"; text: string };
type Ctx = {
  locale: "ar" | "en";
  role: "owner" | "admin" | "editor" | "viewer";
  langs: AdminLang[];
  t: (ar: string, en: string) => string;
  toast: (kind: Toast["kind"], text: string) => void;
};

const C = createContext<Ctx | null>(null);
export const useAdmin = () => useContext(C)!;

export function AdminProvider({ children, locale, role, langs }: { children: ReactNode; locale: "ar" | "en"; role: Ctx["role"]; langs: AdminLang[] }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((x) => [...x, { id, kind, text }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), kind === "err" ? 9000 : 4000);
  }, []);
  const t = useCallback((ar: string, en: string) => (locale === "ar" ? ar : en), [locale]);
  return (
    <C.Provider value={{ locale, role, langs, t, toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-24 start-4 z-[80] lg:bottom-4 grid w-[min(26rem,calc(100vw-2rem))] gap-2" aria-live="polite">
        {toasts.map((x) => (
          <p key={x.id} role={x.kind === "err" ? "alert" : "status"} className={`pointer-events-auto rounded-lg px-4 py-3 text-sm shadow-soft ${x.kind === "err" ? "bg-danger text-white" : "bg-ink text-paper"}`}>
            {x.text}
          </p>
        ))}
      </div>
    </C.Provider>
  );
}

export type ActionResult = { ok: true; data?: unknown } | { ok: false; error: string; detail?: string };

/** Maps server action results to bilingual messages; zero-row writes surface as explicit errors. */
export function useResult() {
  const { t, toast } = useAdmin();
  return useCallback(
    (r: ActionResult, okText?: string) => {
      if (r.ok) {
        if (okText !== "") toast("ok", okText ?? t("تم الحفظ", "Saved"));
        return true;
      }
      const msg =
        r.error === "forbidden"
          ? t("ليست لديك صلاحية لهذا الإجراء.", "You don't have permission to do this.")
          : r.error === "blocked"
            ? t("لم يُحفظ أي تغيير: رفضت قاعدة البيانات العملية (صلاحيات غير كافية أو السجل غير موجود).", "Nothing was saved: the database rejected the change (insufficient permissions or the record no longer exists).")
            : r.error === "validation"
              ? t("تحقق من الحقول: ", "Check the fields: ") + (r.detail ?? "")
              : t("حدث خطأ: ", "Something went wrong: ") + (r.detail ?? "");
      toast("err", msg);
      return false;
    },
    [t, toast],
  );
}

export const canEdit = (role: Ctx["role"], min: Ctx["role"] = "editor") => ({ viewer: 1, editor: 2, admin: 3, owner: 4 })[role] >= ({ viewer: 1, editor: 2, admin: 3, owner: 4 })[min];
