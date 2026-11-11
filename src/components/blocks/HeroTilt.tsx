"use client";

import { useEffect, useRef } from "react";

/** Feeds pointer position over the hero into --rx / --ry on the stage (fine pointers, motion allowed). */
export function HeroTilt() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const stage = ref.current?.parentElement;
    const hero = stage?.closest<HTMLElement>("[data-hero]");
    if (!stage || !hero) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(pointer: fine)").matches || document.documentElement.dataset.motion !== "full") return;
    let raf = 0;
    let tx = 0, ty = 0, x = 0, y = 0;
    const tick = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      stage.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
      stage.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    hero.addEventListener("pointermove", onMove, { passive: true });
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <span ref={ref} hidden />;
}
