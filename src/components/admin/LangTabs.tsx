"use client";

import { useState, type ReactNode } from "react";
import { useAdmin } from "./AdminContext";

/** Tabs per language with a dot on languages missing content. Renders the active language's editor. */
export function LangTabs({ value, render, isEmpty }: { value: Record<string, unknown> | null | undefined; render: (code: string, dir: "ltr" | "rtl") => ReactNode; isEmpty?: (v: unknown) => boolean }) {
  const { langs } = useAdmin();
  const def = langs.find((l) => l.is_default)?.code ?? langs[0]?.code ?? "ar";
  const [cur, setCur] = useState(def);
  const empty = isEmpty ?? ((v: unknown) => v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0) || (typeof v === "object" && v !== null && "content" in (v as object) && !((v as { content: unknown[] }).content?.length)));
  const lang = langs.find((l) => l.code === cur) ?? langs[0]!;
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1" role="tablist">
        {langs.map((l) => {
          const missing = empty(value?.[l.code]);
          return (
            <button
              key={l.code}
              type="button"
              role="tab"
              aria-selected={cur === l.code}
              onClick={() => setCur(l.code)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cur === l.code ? "bg-ink text-paper" : "bg-paper-2 text-muted hover:text-ink"} ${!l.enabled ? "opacity-60" : ""}`}
            >
              {l.native_name}
              {missing && <span className="size-1.5 rounded-full bg-orange" title="missing" />}
            </button>
          );
        })}
      </div>
      <div lang={lang.code} dir={lang.dir}>{render(lang.code, lang.dir)}</div>
    </div>
  );
}
