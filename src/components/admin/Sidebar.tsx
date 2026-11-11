"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Mark } from "@/components/site/Logo";

export type NavItem = { href: string; label: string; icon?: string; badge?: number };
export type NavGroup = { label: string; items: NavItem[] };

const split = (href: string) => {
  const [p, q] = href.split("?");
  return { path: p!, tab: new URLSearchParams(q ?? "").get("tab") };
};

/**
 * Desktop: fixed sidebar. Phones/tablets: top bar + slide-in drawer + a bottom bar for the five most used places.
 * Quick search (Ctrl/⌘ K or "/") jumps to any screen or settings tab, in either language.
 */
export function Sidebar({ groups, footer, title, searchLabel, locale, admin }: { groups: NavGroup[]; footer: React.ReactNode; title: string; searchLabel: string; locale: "ar" | "en"; admin: boolean }) {
  const path = usePathname();
  const params = useSearchParams();
  const tab = params.get("tab");
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const items = groups.flatMap((g) => g.items);

  // Most specific match wins; settings tabs (?tab=theme) light up their own entry.
  const current = useMemo(() => {
    const scored = items
      .map((i) => {
        const { path: p, tab: tb } = split(i.href);
        const hit = p === "/admin" ? path === "/admin" : path === p || path.startsWith(p + "/");
        if (!hit) return null;
        if (tb) return tb === tab ? { i, s: p.length + 100 } : null;
        return { i, s: p.length };
      })
      .filter(Boolean) as { i: NavItem; s: number }[];
    return scored.sort((a, b) => b.s - a.s)[0]?.i;
  }, [items, path, tab]);

  useEffect(() => setOpen(false), [path, tab]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName) || (e.target as HTMLElement).isContentEditable;
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  const ar = locale === "ar";
  const tabs = [
    { href: "/admin", icon: "chart", label: ar ? "الرئيسية" : "Home" },
    { href: "/admin/pages", icon: "layers", label: ar ? "الصفحات" : "Pages" },
    { href: "/admin/posts", icon: "book", label: ar ? "المقالات" : "Posts" },
    { href: "/admin/enquiries", icon: "mail", label: ar ? "الوارد" : "Inbox", badge: items.find((i) => i.href === "/admin/enquiries")?.badge },
  ];

  return (
    <>
      {/* mobile top bar */}
      <header className="adm-topbar lg:hidden">
        <button type="button" className="adm-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <span /><span /><span />
        </button>
        <span className="min-w-0 flex-1 truncate font-semibold text-ink">{current?.label ?? title}</span>
        <button type="button" className="grid size-10 place-items-center rounded-xl bg-paper-2 text-muted" aria-label={searchLabel} onClick={() => setPalette(true)}>
          <Icon name="search" size={18} />
        </button>
      </header>
      <button type="button" aria-label="Close menu" tabIndex={-1} className={`adm-scrim lg:hidden ${open ? "is-on" : ""}`} onClick={() => setOpen(false)} />

      <aside className={`adm-side ${open ? "is-open" : ""}`}>
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
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
        <div className="px-3 pb-3">
          <button type="button" onClick={() => setPalette(true)} className="flex w-full items-center gap-2 rounded-xl border border-rule bg-paper-2/60 px-3 py-2 text-sm text-muted hover:border-rule-strong hover:text-ink">
            <Icon name="search" size={16} />
            <span className="flex-1 text-start">{searchLabel}</span>
            <kbd className="hidden rounded-md border border-rule bg-surface px-1.5 text-[0.68rem] text-faint sm:inline" dir="ltr">Ctrl K</kbd>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4 text-sm">
          {groups.filter((g) => g.items.length).map((g) => (
            <div key={g.label} className="mb-4">
              <p className="mb-1 px-3 text-[0.68rem] font-bold uppercase tracking-wider text-faint">{g.label}</p>
              <ul className="grid gap-0.5">
                {g.items.map((it) => {
                  const on = current?.href === it.href;
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

      {/* phones: bottom bar for the most used places */}
      <nav className="adm-tabbar lg:hidden" aria-label={title}>
        {tabs.map((tb) => {
          const on = tb.href === "/admin" ? path === "/admin" : path.startsWith(tb.href);
          return (
            <Link key={tb.href} href={tb.href} aria-current={on ? "page" : undefined} className={on ? "is-on" : ""}>
              <span className="relative">
                <Icon name={tb.icon} size={20} />
                {tb.badge ? <span className="adm-tabbar-dot" /> : null}
              </span>
              <span>{tb.label}</span>
            </Link>
          );
        })}
        <button type="button" onClick={() => setOpen(true)}>
          <Icon name="menu" size={20} />
          <span>{ar ? "المزيد" : "More"}</span>
        </button>
      </nav>

      {palette && <Palette items={items} locale={locale} admin={admin} label={searchLabel} onClose={() => setPalette(false)} />}
    </>
  );
}

type Entry = { href: string; label: string; hint: string; icon: string; keys?: string };

/** Jump anywhere: every screen plus every settings tab and common tasks, searchable in Arabic and English. */
function Palette({ items, locale, admin, label, onClose }: { items: NavItem[]; locale: "ar" | "en"; admin: boolean; label: string; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const ar = locale === "ar";
  const L = (a: string, e: string) => (ar ? a : e);
  const entries: Entry[] = useMemo(() => {
    const go = L("انتقال", "Go to");
    const set = L("الإعدادات", "Settings");
    const task = L("مهمة", "Task");
    const settings: [string, string, string, string, string][] = [
      ["brand", "الهوية والشعار", "Brand & logo", "spark", "logo name favicon شعار اسم"],
      ["contact", "بيانات التواصل", "Contact details", "phone", "phone email whatsapp هاتف بريد واتساب"],
      ["social", "حسابات التواصل الاجتماعي", "Social accounts", "globe", "facebook linkedin instagram فيسبوك"],
      ["seo", "SEO الافتراضي", "Default SEO", "search", "google title description جوجل"],
      ["theme", "المظهر والألوان والحركة", "Look, colours & motion", "spark", "dark light color animation ألوان داكن حركة"],
      ["images", "صور التصميم", "Design images", "image", "founder poster صورة المؤسس"],
      ["header", "الرأس وشريط الإعلان", "Header & announcement", "menu", "announcement button إعلان زر"],
      ["footer", "التذييل", "Footer", "menu", "copyright map حقوق خريطة"],
      ["floating", "أزرار التواصل العائمة", "Floating contact buttons", "phone", "whatsapp call واتساب"],
      ["stats", "الأرقام", "Figures", "chart", "numbers counters أرقام"],
      ["languages", "اللغات ولغة الدخول", "Languages & landing", "globe", "default language arabic english لغة افتراضية"],
    ];
    return [
      ...items.map((it) => ({ href: it.href, label: it.label, hint: go, icon: it.icon ?? "spark" })),
      ...(admin ? settings.map(([k, a, e, icon, keys]) => ({ href: `/admin/settings?tab=${k}`, label: L(a, e), hint: set, icon, keys })) : []),
      { href: "/admin/posts", label: L("كتابة مقال جديد", "Write a new post"), hint: task, icon: "book", keys: "new post blog article مقال" },
      { href: "/admin/pages", label: L("تعديل صفحة أو إنشاء صفحة جديدة", "Edit a page or create a new one"), hint: task, icon: "layers", keys: "page builder section home صفحة قسم الرئيسية" },
      { href: "/admin/media", label: L("رفع صورة أو استبدال صورة على الموقع", "Upload or replace an image on the site"), hint: task, icon: "image", keys: "photo picture replace صورة استبدال" },
      ...(admin ? [{ href: "/admin/users", label: L("دعوة شخص إلى اللوحة", "Invite someone to the panel"), hint: task, icon: "team", keys: "invite user role دعوة مستخدم" }] : []),
      { href: "/admin/account", label: L("تغيير كلمة المرور", "Change my password"), hint: task, icon: "shield", keys: "password security كلمة المرور" },
      { href: "/admin/translations", label: L("تعديل نص زر أو رسالة", "Edit a button or message text"), hint: task, icon: "globe", keys: "text label button نص زر" },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, admin, locale]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return entries.slice(0, 40);
    const words = s.split(/\s+/);
    return entries.filter((e) => words.every((w) => `${e.label} ${e.keys ?? ""} ${e.href}`.toLowerCase().includes(w))).slice(0, 40);
  }, [entries, q]);
  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => setI(0), [q]);
  const pick = (e: Entry) => { onClose(); router.push(e.href); };

  return (
    <div className="fixed inset-0 z-[90] grid items-start justify-items-center bg-[rgb(11_16_51/0.35)] p-4 pt-[12vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={label}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-rule bg-surface shadow-[0_30px_80px_-30px_rgb(11_16_51/0.6)]">
        <div className="flex items-center gap-3 border-b border-rule px-4">
          <Icon name="search" size={18} />
          <input
            ref={input}
            className="h-14 flex-1 bg-transparent text-base text-ink outline-none"
            placeholder={L("إلى أين تريد الذهاب؟ مثال: الألوان، كلمة المرور، صورة…", "Where to? e.g. colours, password, image…")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(x + 1, list.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(x - 1, 0)); }
              if (e.key === "Enter" && list[i]) pick(list[i]!);
              if (e.key === "Escape") onClose();
            }}
          />
          <kbd className="rounded-md border border-rule px-1.5 text-[0.68rem] text-faint">Esc</kbd>
        </div>
        <ul className="max-h-[55vh] overflow-y-auto p-2" role="listbox">
          {list.length === 0 && <li className="p-6 text-center text-sm text-muted">{L("لا نتائج. جرّب كلمة أخرى.", "No results. Try another word.")}</li>}
          {list.map((e, k) => (
            <li key={`${e.href}-${e.label}`} role="option" aria-selected={k === i}>
              <button type="button" onMouseEnter={() => setI(k)} onClick={() => pick(e)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm ${k === i ? "bg-blue-wash text-ink" : "text-text"}`}>
                <span className="grid size-8 flex-none place-items-center rounded-lg bg-paper-2 text-blue"><Icon name={e.icon} size={16} /></span>
                <span className="flex-1 truncate font-medium">{e.label}</span>
                <span className="text-xs text-faint">{e.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
