"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/** Click-to-load Google Map: no third-party request (or cookies) until asked. */
export function MapEmbed({ lat, lng, label, loadLabel }: { lat: number; lng: number; label: string; loadLabel: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-rule bg-paper-2">
      {on ? (
        <iframe
          title={label}
          className="absolute inset-0 size-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
        />
      ) : (
        <button type="button" onClick={() => setOn(true)} className="group absolute inset-0 flex flex-col items-center justify-center gap-3 text-ink">
          <svg aria-hidden="true" className="absolute inset-0 size-full text-rule" preserveAspectRatio="none" viewBox="0 0 100 75">
            <path d="M0 20h100M0 45h100M30 0v75M72 0v75M0 60 100 8" stroke="currentColor" strokeWidth="0.6" fill="none" />
          </svg>
          <span className="relative inline-flex size-12 items-center justify-center rounded-full bg-blue text-on-blue shadow-soft transition-transform group-hover:-translate-y-1">
            <Icon name="pin" size={22} />
          </span>
          <span className="relative text-sm font-semibold">{loadLabel}</span>
        </button>
      )}
    </div>
  );
}
