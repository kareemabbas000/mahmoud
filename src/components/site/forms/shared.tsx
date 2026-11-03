"use client";

import { useEffect, useState } from "react";

/** Render timestamp + client event id (shared by Pixel and CAPI for deduplication). */
export function useFormMeta() {
  const [ts, setTs] = useState("");
  const [eventId, setEventId] = useState("");
  const [page, setPage] = useState("");
  const [mkt, setMkt] = useState("0");
  useEffect(() => {
    setTs(String(Date.now()));
    setEventId(crypto.randomUUID());
    setPage(location.href);
    setMkt(window.__scoConsent?.marketing ? "1" : "0");
  }, []);
  return { ts, eventId, page, mkt };
}

export function HiddenMeta({ meta, locale }: { meta: ReturnType<typeof useFormMeta>; locale: string }) {
  return (
    <>
      <input type="hidden" name="ts" value={meta.ts} />
      <input type="hidden" name="event_id" value={meta.eventId} />
      <input type="hidden" name="page" value={meta.page} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="marketing_consent" value={meta.mkt} />
      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="hp-field">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
    </>
  );
}

export function track(event: "lead" | "sign_up" | "application", params: Record<string, unknown> = {}) {
  try {
    window.scoTrack?.(event, params);
  } catch {}
}

export function Field({
  id, label, error, hint, children,
}: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

declare global {
  interface Window {
    __scoConsent?: { analytics: boolean; marketing: boolean };
    scoTrack?: (event: string, params?: Record<string, unknown>) => void;
  }
}
