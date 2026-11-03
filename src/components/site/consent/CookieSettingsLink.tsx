"use client";

export function CookieSettingsLink({ label }: { label: string }) {
  return (
    <button type="button" className="hover:text-deep-ink" onClick={() => window.dispatchEvent(new Event("sco:open-consent"))}>
      {label}
    </button>
  );
}
