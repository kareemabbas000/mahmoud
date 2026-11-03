"use client";

import { useActionState, useEffect, useRef } from "react";
import { subscribeNewsletter, type FormState } from "@/app/actions/public";
import { track } from "./shared";
import { Icon } from "@/components/ui/Icon";

export function NewsletterForm({
  locale, labels, onDeep = false,
}: { locale: string; onDeep?: boolean; labels: { placeholder: string; submit: string; success: string; error: string; invalid: string; rate: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeNewsletter, { ok: false });
  const done = useRef(false);
  useEffect(() => {
    if (state.ok && !done.current) {
      done.current = true;
      track("sign_up", { method: "newsletter" });
    }
  }, [state]);
  if (state.ok) return <p role="status" className={onDeep ? "text-deep-ink" : "text-ink"}>{labels.success}</p>;
  const msg = state.error === "validation" ? labels.invalid : state.error === "rate" ? labels.rate : state.error ? labels.error : "";
  return (
    <form action={action} noValidate className="relative">
      <input type="hidden" name="locale" value={locale} />
      <div aria-hidden="true" className="hp-field">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <div className={`flex items-center rounded-full border p-1 ps-5 transition-colors focus-within:border-orange ${onDeep ? "border-deep-rule bg-deep-2" : "border-rule-strong bg-surface"}`}>
        <label htmlFor={`nl-${locale}`} className="sr-only">{labels.placeholder}</label>
        <input
          id={`nl-${locale}`}
          name="email"
          type="email"
          required
          dir="ltr"
          autoComplete="email"
          placeholder={labels.placeholder}
          aria-invalid={state.error === "validation" || undefined}
          aria-describedby={msg ? `nl-${locale}-msg` : undefined}
          className={`min-w-0 flex-1 bg-transparent py-2 text-start outline-none placeholder:text-faint rtl:text-right ${onDeep ? "text-deep-ink" : "text-ink"}`}
        />
        <button type="submit" disabled={pending} className="btn btn-accent !min-h-10 !px-4" aria-label={labels.submit}>
          <span className="hidden sm:inline">{labels.submit}</span>
          <Icon name="arrow" size={16} className="arrow flip-rtl" />
        </button>
      </div>
      {msg && <p id={`nl-${locale}-msg`} role="alert" className="mt-2 text-sm text-orange">{msg}</p>}
    </form>
  );
}
