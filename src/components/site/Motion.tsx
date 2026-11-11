"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * - Reveal-on-scroll for [data-reveal] (content is visible without JS; we only arm when motion is allowed).
 * - Word-split headings [data-split]: split on whitespace only, so Arabic words stay whole and joined.
 * - Ledger rules [data-rule] draw from the reading-start edge as they enter.
 * Smooth scrolling and scrubbed scenes live in ScrollScenes.
 */
export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "off";
    if (reduce) return;
    const root = document.documentElement;

    document.querySelectorAll<HTMLElement>("[data-split]:not([data-split-done])").forEach((el) => {
      const walk = (node: Node) => {
        node.childNodes.forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const parts = (child.textContent ?? "").split(/(\s+)/);
            const frag = document.createDocumentFragment();
            parts.forEach((p) => {
              if (!p) return;
              if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
              else {
                const s = document.createElement("span");
                s.className = "split-word";
                s.textContent = p;
                frag.appendChild(s);
              }
            });
            child.replaceWith(frag);
          } else if (child.nodeType === Node.ELEMENT_NODE) walk(child);
        });
      };
      walk(el);
      el.querySelectorAll<HTMLElement>(".split-word").forEach((w, i) => w.style.setProperty("--i", String(i)));
      el.setAttribute("data-split-done", "");
    });

    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in), [data-split]:not(.is-in), [data-rule]");
    const vh = window.innerHeight;
    // Elements already in the first viewport are revealed immediately (no blank first frame).
    targets.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add("is-in");
    });
    root.classList.add("reveal-armed");
    requestAnimationFrame(() => {
      targets.forEach((el) => {
        if (el.classList.contains("is-in")) el.querySelectorAll(".split-word").forEach((w) => w.classList.add("is-in"));
      });
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            e.target.querySelectorAll(".split-word").forEach((w) => w.classList.add("is-in"));
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    targets.forEach((el) => !el.classList.contains("is-in") && io.observe(el));

    // Rules draw with scroll progress.
    const rules = [...document.querySelectorAll<HTMLElement>("[data-rule]")];
    rules.forEach((r) => r.style.setProperty("--p", "0"));
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = window.innerHeight;
        rules.forEach((r) => {
          const top = r.getBoundingClientRect().top;
          const p = Math.min(1, Math.max(0, (h - top) / (h * 0.45)));
          r.style.setProperty("--p", p.toFixed(3));
        });
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  // Cursor spotlight on dark bands + subtle 3D tilt on cards (fine pointers only).
  // Throttled to one update per frame: pointermove fires 60–240×/s and each update reads layout.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(pointer: fine)").matches || document.documentElement.dataset.motion !== "full") return;
    const SPOT = "[data-spot], .stat-card, .cert-card, .member-card, .note-tile, .svc-panel, .logo-tile, .steps-deck > li";
    let raf = 0;
    let last: PointerEvent | null = null;
    let tilted: HTMLElement | null = null;
    const frame = () => {
      raf = 0;
      const e = last;
      if (!e) return;
      const t = e.target as Element | null;
      const spot = t?.closest<HTMLElement>(SPOT);
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
        spot.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
      const tilt = t?.closest<HTMLElement>("[data-tilt]") ?? null;
      if (tilted && tilted !== tilt) {
        tilted.style.transform = "";
        tilted.removeAttribute("data-tilting");
      }
      tilted = tilt;
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateZ(0)`;
        tilt.setAttribute("data-tilting", "");
      }
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      if (tilted) tilted.style.transform = "";
    };
  }, [pathname]);

  return null;
}
