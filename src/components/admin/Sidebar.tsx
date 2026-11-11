"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Mark } from "@/components/site/Logo";

export type NavGroup = { label: string; items: { href: string; label: string; icon?: string; badge?: number }[] };

/** Desktop: fixed sidebar. Phones/tablets: sticky top bar with a slide-in drawer. */
export function Sidebar({ groups, footer, title }: { groups: NavGroup[]; footer: React.ReactNode; title: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/"));
  const current = groups.flatMap((g) => g.items).filter((i) => active(i.href)).sort((a, b) => b.href.length - a.href.length)[0];
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  return (
    <>
      {/* mobile top bar */}
      <header className="adm-topbar lg:hidden">
        <button type="button" className="adm-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <span /><span /><span />
        </button>
        <span className="min-w-0 flex-1 truncate font-semibold text-ink">{current?.label ?? title}</span>
        <Link href="/admin" className="flex items-center gap-2" aria-label="Dashboard"><Mark size={28} /></Link>
      </header>
      <button type="button" aria-label="Close menu" tabIndex={-1} className={`adm-scrim lg:hidden ${open ? "is-on" : ""}`} onClick={() => setOpen(false)} />

      <aside className={`adm-side ${open ? "is-open" : ""}`}>
        <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-5">
          <Link href="/admin" className="flex items-center gap-3">
            <Mark size={32} />
            <span>
              <b className="block text-[1.05rem] tracking-[0.1em] text-ink" dir="ltr" style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}>SCO</b>
              <small className="block text-[0.7rem] text-muted">{title}</small>
            </span>
          </Link>
          <button type="button" className="grid size-9 place-items-center rounded-full text-muted hover:bg-paper-2 lg:hidden" aria-label="Close" onClick={() => setOpen(false)}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4 text-sm">
          {groups.map((g) => (
            <div key={g.label} className="mb-4">
              <p className="mb-1 px-3 text-[0.68rem] font-bold uppercase tracking-wider text-faint">{g.label}</p>
              <ul className="grid gap-0.5">
                {g.items.map((it) => {
                  const on = active(it.href) && current?.href === it.href;
                  return (
                    <li key={it.href}>
                      <Link href={it.href} aria-current={on ? "page" : undefined} className={`adm-link ${on ? "is-on" : ""}`}>
                        <Icon name={it.icon ?? "spark"} size={17} />
                        <span className="flex-1 truncate">{it.label}</span>
                        {it.badge ? <span className="adm-badge">{it.badge}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-rule p-4">{footer}</div>
      </aside>
    </>
  );
}
