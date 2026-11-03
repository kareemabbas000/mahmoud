"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function FaqSearch({ placeholder, empty }: { placeholder: string; empty: string }) {
  const [q, setQ] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const run = (v: string) => {
    setQ(v);
    const needle = v.trim().toLowerCase();
    let n = 0;
    document.querySelectorAll<HTMLElement>(".faq-item").forEach((li) => {
      const hit = !needle || (li.dataset.text ?? "").includes(needle);
      li.hidden = !hit;
      if (hit) n++;
    });
    setCount(needle ? n : null);
  };
  return (
    <div className="mb-8">
      <label className="relative block max-w-md">
        <span className="sr-only">{placeholder}</span>
        <Icon name="search" size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-faint" />
        <input type="search" value={q} onChange={(e) => run(e.target.value)} placeholder={placeholder} className="input !rounded-full ps-11" />
      </label>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-muted">
        {count === 0 ? empty : ""}
      </p>
    </div>
  );
}
