"use client";

import { useActionState } from "react";
import type { AuthState } from "@/app/actions/auth";

type Field = { name: string; label: string; type?: string; autoComplete?: string; defaultValue?: string; hint?: string; dir?: "ltr" | "rtl" };

export function AuthForm({
  action, fields, submit, messages, hidden,
}: {
  action: (p: AuthState, fd: FormData) => Promise<AuthState>;
  fields: Field[];
  submit: string;
  messages: Record<string, string>;
  hidden?: Record<string, string>;
}) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className="grid gap-4">
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {fields.map((f) => (
        <div key={f.name} className="field">
          <label htmlFor={`f-${f.name}`}>{f.label}</label>
          <input id={`f-${f.name}`} name={f.name} type={f.type ?? "text"} autoComplete={f.autoComplete} defaultValue={f.defaultValue} required dir={f.dir} className={`input ${f.dir === "ltr" ? "input-ltr" : ""}`} />
          {f.hint && <p className="field-hint">{f.hint}</p>}
        </div>
      ))}
      {state.error && <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm text-danger">{messages[state.error] ?? messages.generic}</p>}
      {state.ok && state.message && <p role="status" className="rounded-md bg-success/10 p-3 text-sm text-success">{messages[state.message] ?? state.message}</p>}
      <button className="btn btn-primary mt-2 w-full" disabled={pending}>{pending ? "…" : submit}</button>
    </form>
  );
}
