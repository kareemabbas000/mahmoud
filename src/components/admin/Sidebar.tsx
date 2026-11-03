"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type NavGroup = { label: string; items: { href: string; label: string; badge?: number }[] };

export function Sidebar({ groups, footer }: { groups: NavGroup[]; footer: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/"));
  return (
    <>
      <button type="button" className="fixed start-3 top-3 z-50 rounded-md border border-rule bg-surface px-3 py-2 text-sm lg:hidden" aria-expanded={open} onClick={() => setOpen(!open)}>
        ☰
      </button>
      <aside className={`fixed inset-y-0 start-0 z-40 flex w-72 flex-col border-e border-rule bg-surface transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"}`}>
        <Link href="/admin" className="flex items-center gap-3 border-b border-rule px-5 py-4">
          <svg width="30" height="30" viewBox="0 0 48 48" aria-hidden="true"><rect x="4" y="9" width="32" height="32" rx="3" fill="none" stroke="var(--blue)" strokeWidth="5" /><path d="M11 25.5 18.5 33 44 6" fill="none" stroke="var(--orange)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="font-mono tracking-[0.14em] text-ink"><bdi>SCO</bdi></span>
        </Link>
        <nav className="flex-1 overflow-y-auto px-3 py-4 text-sm">
          {groups.map((g) => (
            <div key={g.label} className="mb-5">
              <p className="mb-1 px-3 text-xs font-semibold text-faint">{g.label}</p>
              <ul>
                {g.items.map((it) => (
                  <li key={it.href}>
                    <Link href={it.href} onClick={() => setOpen(false)} aria-current={active(it.href) ? "page" : undefined} className={`flex items-center justify-between rounded-md px-3 py-2 ${active(it.href) ? "bg-blue-wash font-semibold text-blue" : "text-text hover:bg-paper-2"}`}>
                      {it.label}
                      {it.badge ? <span className="rounded-full bg-orange px-2 text-xs text-on-orange">{it.badge}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-rule p-4">{footer}</div>
      </aside>
    </>
  );
}
