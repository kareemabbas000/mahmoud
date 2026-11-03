"use client";

import { useState } from "react";

/** Click-to-load YouTube (privacy-enhanced domain): no third-party requests until the visitor asks. */
export function LiteVideo({ url, label, poster, title }: { url: string; label: string; poster: string; title: string }) {
  const id = /(?:youtube\.com\/watch\?v=|youtu\.be\/|embed\/)([\w-]{11})/.exec(url)?.[1];
  const [on, setOn] = useState(false);
  if (!id) return null;
  if (on)
    return (
      <iframe
        className="absolute inset-0 size-full"
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  return (
    <button
      type="button"
      onClick={() => setOn(true)}
      className="group absolute inset-0 flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${poster})` }}
      aria-label={label}
    >
      <span className="absolute inset-0 bg-deep/35 transition-colors group-hover:bg-deep/20" />
      <span className="relative inline-flex items-center gap-3 rounded-full bg-paper/95 py-2 ps-2 pe-5 text-sm font-semibold text-ink shadow-soft transition-transform group-hover:scale-[1.03]">
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-orange text-on-orange">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
        </span>
        {label}
      </span>
    </button>
  );
}
