"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

type Item = { src: string; w: number; h: number; caption: string };

export function GalleryGrid({ items, labels, mosaic = false }: { items: Item[]; labels: { open: string; close: string; prev: string; next: string }; mosaic?: boolean }) {
  const [i, setI] = useState<number | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const open = (n: number, el: HTMLButtonElement) => {
    opener.current = el;
    setI(n);
  };
  useEffect(() => {
    if (i === null) return;
    if (!dlg.current?.open) dlg.current?.showModal();
  }, [i]);
  const close = useCallback(() => {
    dlg.current?.close();
    setI(null);
    opener.current?.focus();
  }, []);
  const step = (d: number) => setI((x) => (x === null ? x : (x + d + items.length) % items.length));
  const cur = i === null ? null : items[i];
  const rtl = typeof document !== "undefined" && document.dir === "rtl";
  return (
    <>
      {mosaic ? (
        <ul className="mosaic">
          {items.map((it, n) => (
            <li key={it.src} className="group relative overflow-hidden rounded-2xl bg-paper-2" data-reveal>
              <button type="button" onClick={(e) => open(n, e.currentTarget)} className="absolute inset-0 block" aria-label={`${labels.open}: ${it.caption}`}>
                <Image src={it.src} alt={it.caption} fill sizes="(min-width:768px) 40vw, 50vw" className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]" />
                <span className="absolute inset-0 bg-gradient-to-t from-deep/85 via-deep/10 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="absolute inset-x-0 bottom-0 translate-y-2 p-4 text-start text-sm leading-snug text-white opacity-90 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">{it.caption}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
      <ul className="columns-2 gap-4 md:columns-3">
        {items.map((it, n) => (
          <li key={it.src} className="mb-4 break-inside-avoid" data-reveal>
            <figure>
              <button type="button" onClick={(e) => open(n, e.currentTarget)} className="group block w-full overflow-hidden rounded-md bg-paper-2" aria-label={`${labels.open}: ${it.caption}`}>
                <Image src={it.src} alt={it.caption} width={it.w} height={it.h} sizes="(min-width:768px) 33vw, 50vw" className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.03]" />
              </button>
              <figcaption className="mt-2 text-sm text-muted">{it.caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
      )}
      <dialog
        ref={dlg}
        onClose={() => setI(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(rtl ? -1 : 1);
          if (e.key === "ArrowLeft") step(rtl ? 1 : -1);
        }}
        onClick={(e) => e.target === dlg.current && close()}
        className="m-auto max-h-[92dvh] w-[min(64rem,94vw)] bg-transparent p-0 backdrop:bg-deep/85 backdrop:backdrop-blur-sm"
        aria-label={cur?.caption}
      >
        {cur && (
          <figure className="relative">
            <Image src={cur.src} alt={cur.caption} width={cur.w} height={cur.h} sizes="94vw" className="mx-auto max-h-[80dvh] w-auto rounded-md object-contain" />
            <figcaption className="mt-3 text-center text-deep-ink">{cur.caption}</figcaption>
            <div className="mt-4 flex justify-center gap-2">
              <button type="button" onClick={() => step(-1)} className="btn btn-on-deep !min-h-10" aria-label={labels.prev}><Icon name="arrow" size={18} className="rotate-180 rtl:rotate-0" /></button>
              <button type="button" onClick={close} className="btn btn-on-deep !min-h-10">{labels.close}</button>
              <button type="button" onClick={() => step(1)} className="btn btn-on-deep !min-h-10" aria-label={labels.next}><Icon name="arrow" size={18} className="flip-rtl" /></button>
            </div>
          </figure>
        )}
      </dialog>
    </>
  );
}
