"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitEnquiry, type FormState } from "@/app/actions/public";
import { Field, HiddenMeta, track, useFormMeta } from "./shared";
import { Icon } from "@/components/ui/Icon";

type Labels = Record<
  | "name" | "phone" | "email" | "company" | "service" | "general" | "message" | "consent" | "submit" | "sending" | "successTitle" | "successText"
  | "errGeneric" | "errRate" | "errRequired" | "errEmail" | "errPhone" | "errConsent" | "phoneHint",
  string
>;

export function ContactForm({
  locale, services, labels, privacyHref, defaultService = "", kind = "consultation",
}: { locale: string; services: { slug: string; name: string }[]; labels: Labels; privacyHref: string; defaultService?: string; kind?: "contact" | "consultation" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitEnquiry, { ok: false });
  const meta = useFormMeta();
  const done = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.ok && !done.current) {
      done.current = true;
      track("lead", { event_id: state.eventId, form: kind });
      box.current?.focus();
    }
  }, [state, kind]);

  const err = (k: string) => {
    const c = state.fields?.[k];
    if (!c) return undefined;
    return c === "email" ? labels.errEmail : c === "phone" ? labels.errPhone : c === "consent" ? labels.errConsent : labels.errRequired;
  };

  if (state.ok) {
    return (
      <div ref={box} tabIndex={-1} role="status" className="rounded-lg border border-rule bg-surface p-8 outline-none">
        <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
          <path d="M10 25 19 34 38 13" fill="none" stroke="var(--orange)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="tick-path animate" style={{ ["--len" as string]: 48 } as React.CSSProperties} />
        </svg>
        <h3 className="display d-3 mt-4">{labels.successTitle}</h3>
        <p className="mt-2 text-muted">{labels.successText}</p>
      </div>
    );
  }

  const inv = (k: string) => (state.fields?.[k] ? { "aria-invalid": true as const, "aria-describedby": `cf-${k}-error` } : {});
  return (
    <form action={action} noValidate className="relative grid gap-5">
      <HiddenMeta meta={meta} locale={locale} />
      <input type="hidden" name="kind" value={kind} />
      {state.error && state.error !== "validation" && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
          {state.error === "rate" ? labels.errRate : labels.errGeneric}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="cf-name" label={labels.name} error={err("name")}>
          <input id="cf-name" name="name" defaultValue={state.values?.name} required autoComplete="name" className="input" {...inv("name")} />
        </Field>
        <Field id="cf-phone" label={labels.phone} error={err("phone")} hint={labels.phoneHint}>
          <input id="cf-phone" name="phone" defaultValue={state.values?.phone} type="tel" inputMode="tel" required autoComplete="tel" dir="ltr" className="input input-ltr" {...inv("phone")} aria-describedby={state.fields?.phone ? "cf-phone-error" : "cf-phone-hint"} />
        </Field>
        <Field id="cf-email" label={labels.email} error={err("email")}>
          <input id="cf-email" name="email" defaultValue={state.values?.email} type="email" autoComplete="email" dir="ltr" className="input input-ltr" {...inv("email")} />
        </Field>
        <Field id="cf-company" label={labels.company}>
          <input id="cf-company" name="company" defaultValue={state.values?.company} autoComplete="organization" className="input" />
        </Field>
      </div>
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-medium text-ink">{labels.service}</legend>
        <div className="flex flex-wrap gap-2">
          {[{ slug: "", name: labels.general }, ...services].map((sv) => (
            <label key={sv.slug || "general"} className="svc-chip">
              <input type="radio" name="service" value={sv.slug} defaultChecked={sv.slug === (state.values?.service ?? defaultService)} className="sr-only" />
              <span>{sv.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field id="cf-message" label={labels.message} error={err("message")}>
        <textarea id="cf-message" name="message" defaultValue={state.values?.message} required rows={5} className="input" {...inv("message")} />
      </Field>
      <div className="field">
        <label className="flex items-start gap-3 text-sm font-normal text-muted">
          <input type="checkbox" name="consent" required className="mt-1 size-4 accent-[var(--blue)]" {...inv("consent")} />
          <span>
            {labels.consent}{" "}
            <a href={privacyHref} className="text-blue underline underline-offset-2">↗</a>
          </span>
        </label>
        {err("consent") && <p id="cf-consent-error" className="field-error" role="alert">{err("consent")}</p>}
      </div>
      <button type="submit" disabled={pending || !meta.ts} className="btn btn-primary justify-self-start">
        {pending ? labels.sending : labels.submit}
        <Icon name="arrow" size={16} className="arrow flip-rtl" />
      </button>
    </form>
  );
}
