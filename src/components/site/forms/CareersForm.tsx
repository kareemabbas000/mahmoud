"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitCareer, type FormState } from "@/app/actions/public";
import { Field, HiddenMeta, track, useFormMeta } from "./shared";
import { Icon } from "@/components/ui/Icon";

type Labels = Record<
  "name" | "phone" | "email" | "job" | "cv" | "message" | "consent" | "submit" | "sending" | "successTitle" | "successText" | "errGeneric" | "errRate" | "errRequired" | "errEmail" | "errPhone" | "errFile" | "errConsent",
  string
>;

export function CareersForm({ locale, labels }: { locale: string; labels: Labels }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitCareer, { ok: false });
  const meta = useFormMeta();
  const done = useRef(false);
  useEffect(() => {
    if (state.ok && !done.current) {
      done.current = true;
      track("application", { event_id: state.eventId });
    }
  }, [state]);
  const err = (k: string) => {
    const c = state.fields?.[k];
    if (!c) return undefined;
    return { email: labels.errEmail, phone: labels.errPhone, file: labels.errFile, consent: labels.errConsent }[c] ?? labels.errRequired;
  };
  const inv = (k: string) => (state.fields?.[k] ? { "aria-invalid": true as const, "aria-describedby": `cr-${k}-error` } : {});
  if (state.ok)
    return (
      <div role="status" className="rounded-lg border border-rule bg-surface p-8">
        <h3 className="display d-3">{labels.successTitle}</h3>
        <p className="mt-2 text-muted">{labels.successText}</p>
      </div>
    );
  return (
    <form action={action} noValidate className="relative grid gap-5">
      <HiddenMeta meta={meta} locale={locale} />
      {state.error && state.error !== "validation" && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
          {state.error === "rate" ? labels.errRate : labels.errGeneric}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="cr-name" label={labels.name} error={err("name")}>
          <input id="cr-name" name="name" required autoComplete="name" className="input" {...inv("name")} />
        </Field>
        <Field id="cr-job" label={labels.job} error={err("job_title")}>
          <input id="cr-job" name="job_title" required className="input" {...inv("job_title")} />
        </Field>
        <Field id="cr-phone" label={labels.phone} error={err("phone")}>
          <input id="cr-phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" dir="ltr" className="input input-ltr" {...inv("phone")} />
        </Field>
        <Field id="cr-email" label={labels.email} error={err("email")}>
          <input id="cr-email" name="email" type="email" required autoComplete="email" dir="ltr" className="input input-ltr" {...inv("email")} />
        </Field>
      </div>
      <Field id="cr-cv" label={labels.cv} error={err("cv")}>
        <input
          id="cr-cv"
          name="cv"
          type="file"
          required
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="input file:me-4 file:rounded-full file:border-0 file:bg-blue-wash file:px-4 file:py-2 file:font-semibold file:text-blue"
          {...inv("cv")}
        />
      </Field>
      <Field id="cr-msg" label={labels.message}>
        <textarea id="cr-msg" name="message" rows={4} className="input" />
      </Field>
      <div className="field">
        <label className="flex items-start gap-3 text-sm font-normal text-muted">
          <input type="checkbox" name="consent" required className="mt-1 size-4 accent-[var(--blue)]" {...inv("consent")} />
          <span>{labels.consent}</span>
        </label>
        {err("consent") && <p id="cr-consent-error" className="field-error" role="alert">{err("consent")}</p>}
      </div>
      <button type="submit" disabled={pending || !meta.ts} className="btn btn-primary justify-self-start">
        {pending ? labels.sending : labels.submit}
        <Icon name="arrow" size={16} className="arrow flip-rtl" />
      </button>
    </form>
  );
}
