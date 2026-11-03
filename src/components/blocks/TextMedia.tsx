import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Band, Emph } from "./Section";
import { LiteVideo } from "./LiteVideo";
import { href as h } from "@/lib/i18n";
import type { BlockProps, LinkProp } from "./types";
import type { L } from "@/lib/types";

type P = { eyebrow?: L; title?: L; text?: L; image?: string; image_alt?: L; video_url?: string; link?: LinkProp; media_side?: "start" | "end" };

export function TextMedia({ site, props, refCode }: BlockProps<P>) {
  const mediaFirst = props.media_side === "start";
  return (
    <Band>
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className={`lg:col-span-6 ${mediaFirst ? "lg:order-2" : ""}`}>
          <div className="flex items-center gap-4">
            <span className="wp-ref">{refCode}</span>
            {props.eyebrow && <span className="eyebrow">{site.l(props.eyebrow)}</span>}
          </div>
          {props.title && (
            <h2 className="display d-2 mt-5" data-split>
              <Emph text={site.l(props.title)} />
            </h2>
          )}
          {props.text && (
            <p className="mt-6 max-w-[62ch] text-muted" data-reveal>
              {site.l(props.text)}
            </p>
          )}
          {props.link && (
            <Link href={h(props.link.href, site.locale)} className="link-arrow mt-8" data-reveal>
              {site.l(props.link.label)}
              <Icon name="arrow" size={16} className="arrow flip-rtl" />
            </Link>
          )}
        </div>
        {props.image && (
          <figure className={`relative lg:col-span-6 ${mediaFirst ? "lg:order-1" : ""}`} data-reveal>
            <div aria-hidden="true" className="absolute -inset-3 translate-x-4 translate-y-4 rounded-md border border-blue/30 rtl:-translate-x-4" />
            <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-paper-2" data-clip>
              {props.video_url ? (
                <LiteVideo url={props.video_url} poster={props.image} label={site.t("common.watch_video")} title={site.l(props.image_alt) || site.t("common.watch_video")} />
              ) : (
                <div className="absolute -inset-y-[12%] inset-x-0" data-parallax="0.08">
                  <Image src={props.image} alt={site.l(props.image_alt)} fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
                </div>
              )}
            </div>
          </figure>
        )}
      </div>
    </Band>
  );
}
