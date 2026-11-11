/* eslint-disable @next/next/no-img-element */
import { RichText } from "@/components/site/RichText";
import { Band, Emph, SectionHead } from "./Section";
import { LiteVideo } from "./LiteVideo";
import { num } from "@/lib/i18n";
import { getServicesAlsoOffered } from "@/lib/data";
import type { BlockProps, HeadProps } from "./types";
import type { L, RichDoc } from "@/lib/types";

export function RichTextBlock({ site, props, refCode }: BlockProps<HeadProps & { body?: L<RichDoc> }>) {
  const doc = props.body?.[site.locale] ?? props.body?.[site.defaultLocale];
  return (
    <Band>
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-4">
            <span className="wp-ref">{refCode}</span>
            {props.eyebrow && <span className="eyebrow">{site.l(props.eyebrow)}</span>}
          </div>
          {props.title && <h2 className="display d-2 mt-5" data-split><Emph text={site.l(props.title)} /></h2>}
        </div>
        <div className="lg:col-span-8" data-reveal>
          <RichText doc={doc} />
        </div>
      </div>
    </Band>
  );
}

export function Values({ site, props, refCode }: BlockProps<HeadProps & { items?: L[] }>) {
  return (
    <Band tone="paper-2">
      <SectionHead site={site} refCode={refCode} head={props} />
      <ol className="grid gap-px overflow-hidden rounded-md border border-rule bg-rule md:grid-cols-5" data-stagger>
        {(props.items ?? []).map((v, i) => (
          <li key={i} className="flex flex-col gap-8 bg-surface p-6 md:min-h-64">
            <span className="font-display text-5xl font-semibold leading-none text-transparent [-webkit-text-stroke:1px_var(--orange)]">
              {num(i + 1, site.locale, site.numerals)}
            </span>
            <p className="mt-auto font-medium text-ink">{site.l(v)}</p>
          </li>
        ))}
      </ol>
    </Band>
  );
}

export function Quote({ site, props }: BlockProps<{ text?: L; cite?: L }>) {
  return (
    <section className="bg-paper">
      <div className="container-x py-20 md:py-28">
        <figure className="mx-auto max-w-4xl text-center">
          <span className="block font-display text-8xl leading-none text-orange" aria-hidden="true">{site.locale === "ar" ? "«" : "“"}</span>
          <blockquote className="display d-3 -mt-6 !font-medium leading-snug text-ink" data-split>
            {site.l(props.text)}
          </blockquote>
          {props.cite && <figcaption className="mt-8 text-sm font-semibold text-muted">— {site.l(props.cite)}</figcaption>}
        </figure>
      </div>
    </section>
  );
}

export async function AlsoOffered({ site, props, refCode }: BlockProps<HeadProps>) {
  const list = await getServicesAlsoOffered();
  return (
    <Band tone="paper-2">
      <SectionHead site={site} refCode={refCode} head={props} />
      <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((x, i) => (
          <li key={i} className="flex items-baseline gap-4 border-b border-rule py-4" data-reveal>
            <span className="h-px w-4 shrink-0 translate-y-[-0.3em] bg-orange" aria-hidden="true" />
            <span className="text-ink">{site.l(x)}</span>
          </li>
        ))}
      </ul>
    </Band>
  );
}

export function ImageBlock({ site, props }: BlockProps<{ src?: string; alt?: L; caption?: L; wide?: boolean }>) {
  if (!props.src) return null;
  return (
    <section className="bg-paper">
      <figure className={`container-x py-12 ${props.wide ? "" : "max-w-4xl"}`}>
        <img src={props.src} alt={site.l(props.alt)} loading="lazy" decoding="async" className="h-auto w-full rounded-md" />
        {props.caption && <figcaption className="mt-3 text-sm text-muted">{site.l(props.caption)}</figcaption>}
      </figure>
    </section>
  );
}

export function VideoBlock({ site, props, refCode }: BlockProps<HeadProps & { url?: string; poster?: string }>) {
  if (!props.url) return null;
  return (
    <Band>
      <SectionHead site={site} refCode={refCode} head={props} />
      <div className="relative aspect-video overflow-hidden rounded-md bg-deep">
        <LiteVideo url={props.url} poster={props.poster || site.settings.images?.video_poster || "/legacy/office/video-poster.png"} label={site.t("common.watch_video")} title={site.l(props.title) || "Video"} />
      </div>
    </Band>
  );
}

export function Spacer({ props }: BlockProps<{ size?: "s" | "m" | "l" }>) {
  const h = { s: "h-8", m: "h-16", l: "h-28" }[props.size ?? "m"];
  return <div className={`${h} bg-paper`} aria-hidden="true" />;
}
