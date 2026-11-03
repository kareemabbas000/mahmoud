"use client";

import { useState } from "react";

export function InsightsFilter({ all, cats }: { all: string; cats: { id: string; name: string }[] }) {
  const [cur, setCur] = useState("");
  const pick = (id: string) => {
    setCur(id);
    document.querySelectorAll<HTMLElement>(".post-card").forEach((el) => {
      el.hidden = Boolean(id) && el.dataset.cat !== id;
    });
  };
  return (
    <div className="mb-12 flex flex-wrap gap-2" role="group">
      {[{ id: "", name: all }, ...cats].map((c) => (
        <button key={c.id} type="button" aria-pressed={cur === c.id} onClick={() => pick(c.id)} className={`rounded-full border px-4 py-2 text-sm transition-colors ${cur === c.id ? "border-ink bg-ink text-paper" : "border-rule text-muted hover:text-ink"}`}>
          {c.name}
        </button>
      ))}
    </div>
  );
}
