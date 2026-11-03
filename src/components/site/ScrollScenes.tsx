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
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
            onUpdate: () => {
              el.textContent = fmt.format(Math.round(o.v)) + suffix;
            },
          });
        });

        // CTA panel expands from an inset card to full bleed.
        gsap.utils.toArray<HTMLElement>("[data-expand]").forEach((el) => {
          gsap.fromTo(el, { clipPath: "inset(6% 8% 6% 8% round 24px)" }, { clipPath: "inset(0% 0% 0% 0% round 12px)", ease: "none", scrollTrigger: { trigger: el, start: "top 95%", end: "top 45%", scrub: 0.5 } });
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
