import { Band, SectionHead } from "./Section";
import { GalleryGrid } from "./GalleryGrid";
import { getGallery } from "@/lib/data";
import type { BlockProps, HeadProps, LinkProp } from "./types";

export async function Gallery({ site, props, refCode }: BlockProps<HeadProps & { limit?: number; link?: LinkProp }>) {
  const all = await getGallery();
  const items = (props.limit ? all.filter((g) => g.width >= g.height || g.image.includes("china") || g.image.includes("kuwait")).concat(all).filter((g, i, a) => a.indexOf(g) === i).slice(0, props.limit) : all).map((g) => ({ src: g.image, w: g.width, h: g.height, caption: site.l(g.caption) }));
  if (!items.length) return null;
  return (
    <Band tone={props.limit ? "paper-2" : "paper"}>
      <SectionHead site={site} refCode={refCode} head={props} link={props.link} />
      <GalleryGrid mosaic={Boolean(props.limit)} items={items} labels={{ open: site.t("gallery.open"), close: site.t("common.close"), prev: site.t("common.previous"), next: site.t("common.next") }} />
    </Band>
  );
}
