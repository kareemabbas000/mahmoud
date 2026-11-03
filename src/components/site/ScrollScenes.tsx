"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Scroll-driven scenes (GSAP ScrollTrigger + Lenis), lazy-loaded after first paint.
 * Hooks are data attributes so blocks stay server-rendered:
 *   [data-hero]            hero section: paper stack fans out, grid drifts, copy lifts (scrubbed)
 *   [data-parallax="0.2"]  element drifts against scroll by the given factor
 *   [data-clip]            image wipe reveal from the reading-start edge
 *   [data-count]           figure counts up when it enters
 *   [data-stagger]         children rise in sequence
 *   [data-expand]          panel grows from inset to full width while entering
 *   .marquee-track         speed follows scroll velocity
 * Everything is skipped under prefers-reduced-motion.
 */
export function ScrollScenes() {
  const pathname = usePathname();

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cleanup = () => {};
    let cancelled = false;

    const run = async () => {
      const [{ gsap }, { ScrollTrigger }, LenisMod] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("lenis")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const rtl = document.documentElement.dir === "rtl";
      const touch = matchMedia("(pointer: coarse)").matches;

      // Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync.
      let lenis: InstanceType<typeof LenisMod.default> | null = null;
      if (!touch) {
        lenis = new LenisMod.default({ duration: 1.1, smoothWheel: true });
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (t: number) => lenis?.raf(t * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        cleanup = () => {
          gsap.ticker.remove(tick);
          lenis?.destroy();
        };
      }

      const ctx = gsap.context(() => {
        // Reading progress — an orange ledger line across the top.
        const bar = document.getElementById("scroll-progress");
        if (bar) {
          gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: "none", transformOrigin: rtl ? "right center" : "left center", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
        }

        // Hero: the working papers fan out and drift as the page scrolls away.
        document.querySelectorAll<HTMLElement>("[data-hero]").forEach((hero) => {
          const st = { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 };
          const s1 = hero.querySelector(".hero-sheet-1");
          const s2 = hero.querySelector(".hero-sheet-2");
          const s3 = hero.querySelector(".hero-sheet-3");
          const dir = rtl ? -1 : 1;
          if (s1) gsap.to(s1, { y: -40, rotate: -4 * dir, ease: "none", scrollTrigger: st });
          if (s2) gsap.to(s2, { y: -90, x: -30 * dir, rotate: -9 * dir, ease: "none", scrollTrigger: st });
          if (s3) gsap.to(s3, { y: -140, x: 40 * dir, rotate: 12 * dir, ease: "none", scrollTrigger: st });
          const grid = hero.querySelector("[data-hero-grid]");
          if (grid) gsap.to(grid, { yPercent: 18, ease: "none", scrollTrigger: st });
          const copy = hero.querySelector("[data-hero-copy]");
          if (copy) gsap.to(copy, { y: 80, opacity: 0.25, ease: "none", scrollTrigger: st });
          const glow = hero.querySelector("[data-hero-glow]");
          if (glow) gsap.to(glow, { scale: 1.35, opacity: 0.4, ease: "none", scrollTrigger: st });
        });

        // Parallax drift.
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const f = Number(el.dataset.parallax || 0.15);
          gsap.fromTo(el, { yPercent: -f * 100 }, { yPercent: f * 100, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true } });
        });

        // Image wipe from the reading-start edge.
        gsap.utils.toArray<HTMLElement>("[data-clip]").forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: rtl ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)" },
            { clipPath: "inset(0 0% 0 0%)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 82%", once: true } },
          );
        });

        // Staggered children (ledger rows, notes, credentials).
        gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((list) => {
          const items = list.querySelectorAll(":scope > *");
          gsap.fromTo(items, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: list, start: "top 85%", once: true } });
        });

        // Counting figures (balance-sheet stats).
        const lang = document.documentElement.lang;
        const arab = document.documentElement.dataset.numerals === "arab";
        const fmt = new Intl.NumberFormat(lang === "ar" ? (arab ? "ar-EG" : "ar-EG-u-nu-latn") : lang);
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const target = Number(el.dataset.count || 0);
          const suffix = el.dataset.suffix ?? "";
          const o = { v: 0 };
          gsap.to(o, {
            v: target,
            duration: 1.8,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
            onUpdate: () => {
              el.textContent = fmt.format(Math.round(o.v)) + suffix;
            },
          });
        });

        // CTA panel expands from an inset card to full bleed.
        gsap.utils.toArray<HTMLElement>("[data-expand]").forEach((el) => {
          gsap.fromTo(el, { clipPath: "inset(6% 8% 6% 8% round 24px)" }, { clipPath: "inset(0% 0% 0% 0% round 12px)", ease: "none", scrollTrigger: { trigger: el, start: "top 95%", end: "top 45%", scrub: 0.5 } });
        });

        // Sticky deck journey (desktop only) — scrubbed from scroll progress; no pinning, no DOM moves.
        const mm = gsap.matchMedia();
        mm.add("(min-width: 1024px)", () => {
          gsap.utils.toArray<HTMLElement>("[data-steps]").forEach((sec) => {
            const cards = gsap.utils.toArray<HTMLElement>(sec.querySelectorAll("[data-step-card]"));
            const labels = gsap.utils.toArray<HTMLElement>(sec.querySelectorAll("[data-step-label]"));
            const counter = sec.querySelector<HTMLElement>("[data-step-counter]");
            const bar = sec.querySelector<HTMLElement>("[data-step-bar]");
            const n = cards.length;
            const fmt = (i: number) => new Intl.NumberFormat(lang === "ar" ? (arab ? "ar-EG" : "ar-EG-u-nu-latn") : lang, { minimumIntegerDigits: 2 }).format(i);
            const render = (p: number) => {
              const f = Math.min(n - 1, Math.max(0, p * (n - 0.35))); // fractional active index
              cards.forEach((c, i) => {
                const d = i - f; // <0 gone, 0 active, >0 waiting in the deck
                if (d < -1) gsap.set(c, { yPercent: -120, rotate: -6, opacity: 0, scale: 1 });
                else if (d < 0) gsap.set(c, { yPercent: d * 140, rotate: d * 7, opacity: Math.max(0, 1 + d * 2.4), scale: 1 + d * 0.04 });
                else gsap.set(c, { yPercent: Math.min(d, 3) * 7, scale: 1 - Math.min(d, 3) * 0.055, opacity: d > 3 ? 0 : 1 - Math.min(d, 3) * 0.22, rotate: 0 });
              });
              const active = Math.round(f);
              labels.forEach((l, i) => l.classList.toggle("is-step", i === active));
              if (counter) counter.textContent = fmt(active + 1);
              if (bar) gsap.set(bar, { scaleX: p });
            };
            render(0);
            ScrollTrigger.create({ trigger: sec, start: "top top", end: "bottom bottom", scrub: true, onUpdate: (self) => render(self.progress), onRefresh: (self) => render(self.progress) });
          });
        });

        // Gauges, timeline rules and the tick: stroke draws in when the tile enters.
        gsap.utils.toArray<SVGElement>("[data-ring]").forEach((el, i) => {
          gsap.fromTo(el, { strokeDashoffset: 100 }, { strokeDashoffset: el.closest("[data-constellation]") ? 0 : 0, duration: 2, ease: "power2.inOut", delay: (i % 4) * 0.12, scrollTrigger: { trigger: el.closest("article") ?? el, start: "top 88%", once: true } });
        });
        gsap.utils.toArray<SVGCircleElement>("[data-travel]").forEach((el) => {
          gsap.fromTo(el, { attr: { cx: 0 } }, { attr: { cx: Number(el.dataset.travel || 300) }, duration: 2, ease: "power2.inOut", scrollTrigger: { trigger: el.closest("article") ?? el, start: "top 88%", once: true } });
        });
        gsap.utils.toArray<HTMLElement>("[data-constellation]").forEach((box) => {
          const lines = box.querySelectorAll("[data-draw]");
          const nodes = box.querySelectorAll("[data-node]");
          const tl = gsap.timeline({ scrollTrigger: { trigger: box, start: "top 88%", once: true } });
          tl.fromTo(nodes, { scale: 0, transformOrigin: "center", opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.07, ease: "back.out(3)" })
            .fromTo(lines, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.06 }, 0.3);
          gsap.to(nodes, { y: "random(-1.5, 1.5)", x: "random(-1.5, 1.5)", duration: 3, ease: "sine.inOut", repeat: -1, yoyo: true, stagger: 0.2 });
        });

        // Kinetic ticker rows slide against each other with scroll.
        gsap.utils.toArray<HTMLElement>("[data-ticker]").forEach((sec) => {
          sec.querySelectorAll<HTMLElement>("[data-ticker-row]").forEach((row) => {
            const d = Number(row.dataset.tickerRow); // tracks are laid out LTR in every language
            gsap.fromTo(row, { xPercent: d > 0 ? 0 : -25 }, { xPercent: d > 0 ? -25 : 0, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 0.4 } });
          });
        });

        // Marquee follows scroll velocity.
        const tracks = gsap.utils.toArray<HTMLElement>(".marquee-track");
        if (tracks.length) {
          ScrollTrigger.create({
            onUpdate: (self) => {
              const v = Math.min(Math.abs(self.getVelocity()) / 400, 6);
              tracks.forEach((t) => t.getAnimations().forEach((a) => (a.playbackRate = 1 + v)));
            },
          });
          ScrollTrigger.addEventListener("scrollEnd", () => tracks.forEach((t) => t.getAnimations().forEach((a) => (a.playbackRate = 1))));
        }
      });

      ScrollTrigger.refresh();
      const prev = cleanup;
      cleanup = () => {
        ctx.revert();
        prev();
      };
    };

    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (idle) idle(() => void run(), { timeout: 1500 });
    else setTimeout(() => void run(), 600);
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [pathname]);

  return <div id="scroll-progress" aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px] origin-left scale-x-0 bg-orange rtl:origin-right" />;
}
