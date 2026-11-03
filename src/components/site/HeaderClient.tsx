"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

export type NavItem = { id: string; label: string; href: string; children?: (NavItem & { ref?: string; summary?: string })[] };
export type LangOpt = { code: string; native: string };

type Props = {
  locale: string;
  logo: ReactNode;
  items: NavItem[];
  langs: LangOpt[];
  cta?: { label: string; href: string } | null;
  phone?: { display: string; tel: string } | null;
  email?: string | null;
  showTheme: boolean;
  showLang: boolean;
  labels: { open: string; close: string; theme: string; language: string; nav: string; light: string; dark: string; system: string; viewAll: string };
};

type Mode = "system" | "light" | "dark";

function applyTheme(mode: Mode) {
  const d = document.documentElement;
  const resolved = mode === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode;
  d.dataset.theme = resolved;
  d.dataset.themePref = mode;
  try {
    localStorage.setItem("sco-theme-v2", mode);
  } catch {}
}

function ThemeToggle({ labels }: { labels: Props["labels"] }) {
  const [mode, setMode] = useState<Mode>("system");
  useEffect(() => {
    setMode((document.documentElement.dataset.themePref as Mode) || "light");
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => {
      if ((document.documentElement.dataset.themePref ?? "system") === "system") applyTheme("system");
    };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const next: Record<Mode, Mode> = { system: "dark", light: "dark", dark: "light" };
  const icon = mode === "light" ? "sun" : mode === "dark" ? "moon" : "monitor";
  const name = labels[mode];
  return (
    <button
      type="button"
      onClick={() => {
        const m = next[mode];
        setMode(m);
        applyTheme(m);
      }}
      className="inline-flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-paper-2 hover:text-ink"
      aria-label={`${labels.theme}: ${name}`}
      title={`${labels.theme}: ${name}`}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}

function swapLocale(path: string, from: string, to: string) {
  const parts = path.split("/");
  if (parts[1] === from) parts[1] = to;
  else parts.splice(1, 0, to);
  return parts.join("/") || `/${to}`;
}

export function HeaderClient(p: Props) {
  const pathname = usePathname() || `/${p.locale}`;
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    setOpen(false);
    setMega(null);
  }, [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setMega(null);
      }
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const isActive = (href: string) => pathname === href || (href !== `/${p.locale}` && pathname.startsWith(href + "/"));
  const enter = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMega(id);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setMega(null), 140);
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled || open ? "border-rule bg-paper/90 shadow-[0_1px_0_var(--rule)] backdrop-blur-xl" : "border-transparent bg-paper"
      }`}
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      {/* Utility row */}
      <div className="hidden border-b border-rule md:block">
        <div className="container-x flex h-9 items-center justify-between text-[0.8125rem] text-muted">
          <div className="flex items-center gap-6">
            {p.phone && (
              <a href={`tel:${p.phone.tel}`} className="inline-flex items-center gap-2 hover:text-ink">
                <Icon name="phone" size={14} />
                <bdi dir="ltr">{p.phone.display}</bdi>
              </a>
            )}
            {p.email && (
              <a href={`mailto:${p.email}`} className="inline-flex items-center gap-2 hover:text-ink">
                <Icon name="mail" size={14} />
                <bdi dir="ltr">{p.email}</bdi>
              </a>
            )}
          </div>
          <div className="flex items-center gap-1">
            {p.showLang && p.langs.length > 1 && (
              <nav aria-label={p.labels.language} className="flex items-center">
                {p.langs.map((l) => (
                  <Link
                    key={l.code}
                    href={swapLocale(pathname, p.locale, l.code)}
                    hrefLang={l.code}
                    lang={l.code}
                    aria-current={l.code === p.locale ? "true" : undefined}
                    className={`rounded-full px-3 py-1 transition-colors ${l.code === p.locale ? "bg-paper-2 font-semibold text-ink" : "hover:text-ink"}`}
                    onClick={() => {
                      document.cookie = `NEXT_LOCALE=${l.code};path=/;max-age=31536000;samesite=lax`;
                    }}
                  >
                    {l.native}
                  </Link>
                ))}
              </nav>
            )}
            {p.showTheme && <ThemeToggle labels={p.labels} />}
          </div>
        </div>
      </div>

      {/* Main row */}
      <div className="container-x flex h-[4.5rem] items-center justify-between gap-6">
        <Link href={`/${p.locale}`} className="shrink-0" aria-label="SCO">
          {p.logo}
        </Link>

        <nav aria-label={p.labels.nav} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {p.items.map((it) => (
              <li key={it.id} className="relative" onMouseEnter={() => it.children && enter(it.id)} onMouseLeave={() => it.children && leave()}>
                <Link
                  href={it.href}
                  aria-current={isActive(it.href) ? "page" : undefined}
                  className={`relative inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[0.9375rem] font-medium transition-colors ${
                    isActive(it.href) ? "text-ink" : "text-muted hover:text-ink"
                  }`}
                  onFocus={() => it.children && enter(it.id)}
                >
                  {it.label}
                  {isActive(it.href) && <span aria-hidden="true" className="absolute inset-x-3.5 -bottom-0.5 h-px bg-orange" />}
                </Link>
                {it.children && (
                  <button
                    type="button"
                    className="sr-only focus:not-sr-only"
                    aria-expanded={mega === it.id}
                    aria-controls={`${menuId}-${it.id}`}
                    onClick={() => setMega(mega === it.id ? null : it.id)}
                  >
                    {it.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {p.cta && (
            <Link href={p.cta.href} className="btn btn-primary hidden !min-h-11 sm:inline-flex">
              {p.cta.label}
              <Icon name="arrow" size={16} className="arrow flip-rtl" />
            </Link>
          )}
          <span className="md:hidden">{p.showTheme && <ThemeToggle labels={p.labels} />}</span>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-rule text-ink lg:hidden"
            aria-expanded={open}
            aria-controls={`${menuId}-mobile`}
            aria-label={open ? p.labels.close : p.labels.open}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? "close" : "menu"} size={20} />
          </button>
        </div>
      </div>

      {/* Mega panel (services index) */}
      {p.items
        .filter((it) => it.children && mega === it.id)
        .map((it) => (
          <div
            key={it.id}
            id={`${menuId}-${it.id}`}
            onMouseEnter={() => enter(it.id)}
            onMouseLeave={leave}
            className="absolute inset-x-0 top-full hidden border-b border-rule bg-surface shadow-soft lg:block"
          >
            <div className="container-x grid grid-cols-12 gap-8 py-10">
              <div className="col-span-3">
                <p className="display d-3">{it.label}</p>
                <Link href={it.href} className="link-arrow mt-4 text-sm">
                  {p.labels.viewAll}
                  <Icon name="arrow" size={16} className="arrow flip-rtl" />
                </Link>
              </div>
              <ul className="col-span-9 grid grid-cols-2 gap-x-10">
                {it.children!.map((c) => (
                  <li key={c.id} className="border-t border-rule">
                    <Link href={c.href} className="group flex items-baseline gap-4 py-4">
                      {c.ref && <span className="wp-ref w-10 shrink-0">{c.ref}</span>}
                      <span className="flex-1">
                        <span className="block font-semibold text-ink transition-colors group-hover:text-blue">{c.label}</span>
                        {c.summary && <span className="mt-1 line-clamp-2 block text-sm text-muted">{c.summary}</span>}
                      </span>
                      <Icon name="arrow" size={16} className="flip-rtl text-faint transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

      {/* Mobile menu */}
      <div
        id={`${menuId}-mobile`}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-[4.5rem] overflow-y-auto bg-paper lg:hidden"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <nav aria-label={p.labels.nav} className="container-x py-6">
          <ul>
            {p.items.map((it, i) => (
              <li key={it.id} className="border-b border-rule">
                <Link href={it.href} className="flex items-baseline gap-4 py-4" aria-current={isActive(it.href) ? "page" : undefined}>
                  <span className="wp-ref w-8">{String(i + 1).padStart(2, "0")}</span>
                  <span className="display d-4 flex-1">{it.label}</span>
                </Link>
                {it.children && (
                  <ul className="mb-4 ms-12 grid gap-1">
                    {it.children.map((c) => (
                      <li key={c.id}>
                        <Link href={c.href} className="block py-1.5 text-muted hover:text-ink">
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-4">
            {p.cta && (
              <Link href={p.cta.href} className="btn btn-primary w-full">
                {p.cta.label}
              </Link>
            )}
            {p.phone && (
              <a href={`tel:${p.phone.tel}`} className="btn btn-ghost w-full">
                <Icon name="phone" size={16} />
                <bdi dir="ltr">{p.phone.display}</bdi>
              </a>
            )}
            {p.showLang && p.langs.length > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                {p.langs.map((l) => (
                  <Link
                    key={l.code}
                    href={swapLocale(pathname, p.locale, l.code)}
                    hrefLang={l.code}
                    lang={l.code}
                    className={`rounded-full border px-4 py-2 text-sm ${l.code === p.locale ? "border-ink text-ink" : "border-rule text-muted"}`}
                    onClick={() => {
                      document.cookie = `NEXT_LOCALE=${l.code};path=/;max-age=31536000;samesite=lax`;
                    }}
                  >
                    {l.native}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
