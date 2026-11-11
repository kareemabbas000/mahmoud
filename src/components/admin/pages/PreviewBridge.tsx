"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Runs inside the preview iframe. Keeps the scroll position across autosave reloads,
 * scrolls to / flashes the section picked in the builder, and reports clicks on sections
 * back to the builder (links are disabled while editing).
 */
export function PreviewBridge({ builder, draft, locale }: { builder: boolean; draft: boolean; locale: string }) {
  const router = useRouter();
  useEffect(() => {
    if (!builder) return;
    const key = `sco-pv-${location.pathname}`;
    try {
      const y = Number(sessionStorage.getItem(key) || 0);
      if (y) requestAnimationFrame(() => window.scrollTo(0, y));
    } catch {}
    const onScroll = () => {
      try {
        sessionStorage.setItem(key, String(window.scrollY));
      } catch {}
    };
    const anchors = () => [...document.querySelectorAll<HTMLElement>("[data-bid]")];
    const flash = (id: string, smooth = true) => {
      const a = document.querySelector<HTMLElement>(`[data-bid="${CSS.escape(id)}"]`);
      const el = a?.nextElementSibling as HTMLElement | null;
      if (!el) return;
      el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      el.classList.remove("pv-flash");
      void el.offsetWidth;
      el.classList.add("pv-flash");
    };
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== location.origin) return;
      const d = e.data as { type?: string; id?: string };
      if (d?.type === "scrollTo" && d.id) flash(d.id);
      // Soft refresh after an autosave: re-fetches only the server payload, keeps JS, state and scroll.
      if (d?.type === "refresh") router.refresh();
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest("a,button,summary,input,textarea,select,label");
      if (a && !(e.target as Element).closest("[data-pv-allow]")) e.preventDefault();
      const y = e.pageY;
      let pick: string | null = null;
      for (const an of anchors()) if (an.getBoundingClientRect().top + window.scrollY <= y + 1) pick = an.dataset.bid ?? null;
      if (pick) window.parent.postMessage({ type: "select", id: pick }, location.origin);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("message", onMsg);
    document.addEventListener("click", onClick, true);
    window.parent.postMessage({ type: "ready" }, location.origin);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("message", onMsg);
      document.removeEventListener("click", onClick, true);
    };
  }, [builder, router]);

  return (
    <div className="pointer-events-none fixed start-3 top-3 z-[95] rounded-full bg-ink/90 px-3 py-1.5 text-xs font-semibold text-paper shadow-soft">
      {draft ? (locale === "ar" ? "معاينة المسودة" : "Draft preview") : locale === "ar" ? "النسخة المنشورة" : "Live version"}
    </div>
  );
}
