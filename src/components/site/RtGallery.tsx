"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";

type Img = { src: string; thumb: string; srcSet?: string; alt: string };

/** In-article image gallery: grid of thumbnails that open a keyboard- and swipe-friendly lightbox. */
export function RtGallery({ images, cols, caption }: { images: Img[]; cols: number; caption?: string }) {
  const [i, setI] = useState<number | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const x0 = useRef<number | null>(null);
  useEffect(() => {
    if (i === null) dlg.current?.close();
    else if (!dlg.current?.open) dlg.current?.showModal();
  }, [i]);
  const go = (d: number) => setI((v) => (v === null ? v : (v + d + images.length) % images.length));
  const rtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  return (
    <figure className="rt-gallery is-wide">
      <ul style={{ ["--cols" as string]: cols }}>
        {images.map((g, k) => (
          <li key={k}>
            <button type="button" onClick={() => setI(k)} aria-label={g.alt || `${k + 1}`}>
              <img src={g.thumb} srcSet={g.srcSet} sizes={`(min-width:1024px) ${Math.round(48 / cols)}rem, ${Math.round(100 / Math.min(cols, 2))}vw`} alt={g.alt} loading="lazy" decoding="async" />
            </button>
          </li>
        ))}
      </ul>
      {caption && <figcaption>{caption}</figcaption>}
      <dialog
        ref={dlg}
        className="rt-lightbox"
        onClose={() => setI(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(rtl ? -1 : 1);
          if (e.key === "ArrowLeft") go(rtl ? 1 : -1);
        }}
        onTouchStart={(e) => (x0.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const dx = (e.changedTouches[0]?.clientX ?? 0) - (x0.current ?? 0);
          if (Math.abs(dx) > 50) go((dx < 0 ? 1 : -1) * (rtl ? -1 : 1));
        }}
        onClick={(e) => e.target === e.currentTarget && setI(null)}
      >
        {i !== null && images[i] && (
          <>
            <img src={images[i]!.src} alt={images[i]!.alt} />
            <p>{images[i]!.alt} <span dir="ltr">{i + 1} / {images.length}</span></p>
            <button type="button" className="rt-lb-close" onClick={() => setI(null)} aria-label="Close">×</button>
            {images.length > 1 && (
              <>
                <button type="button" className="rt-lb-prev" onClick={() => go(-1)} aria-label="Previous">‹</button>
                <button type="button" className="rt-lb-next" onClick={() => go(1)} aria-label="Next">›</button>
              </>
            )}
          </>
        )}
      </dialog>
    </figure>
  );
}
