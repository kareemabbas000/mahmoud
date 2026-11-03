import type { ComponentType } from "react";
import type { Site } from "@/lib/site";
import type { Block } from "@/lib/types";
import type { BlockProps } from "./types";
import { Hero } from "./Hero";
import { Process } from "./Process";
import { PageHeader } from "./PageHeader";
import { TextMedia } from "./TextMedia";
import { Services } from "./Services";
import { Stats } from "./Stats";
import { Cards } from "./Cards";
import { Clients } from "./Clients";
import { Credentials } from "./Credentials";
import { Faq } from "./Faq";
import { Cta } from "./Cta";
import { AlsoOffered, ImageBlock, Quote, RichTextBlock, Spacer, Values, VideoBlock } from "./Misc";
import { Team } from "./Team";
import { Gallery } from "./Gallery";
import { Contact } from "./Contact";
import { CareersBlock, NewsletterBlock } from "./Forms";

export const registry: Record<string, ComponentType<BlockProps<any>>> = {
  hero: Hero,
  process: Process,
  pageHeader: PageHeader,
  textMedia: TextMedia,
  services: Services,
  stats: Stats,
  cards: Cards,
  clients: Clients,
  credentials: Credentials,
  faq: Faq,
  cta: Cta,
  richText: RichTextBlock,
  values: Values,
  quote: Quote,
  team: Team,
  gallery: Gallery,
  alsoOffered: AlsoOffered,
  contact: Contact,
  careersForm: CareersBlock,
  newsletter: NewsletterBlock,
  image: ImageBlock,
  video: VideoBlock,
  spacer: Spacer,
};

/** Renders a page's block list. Working-paper references run A·01, A·02… per page (letter set by the caller). */
export function BlockRenderer({ site, blocks, letter = "A", extra }: { site: Site; blocks: Block[]; letter?: string; extra?: Record<string, Record<string, unknown>> }) {
  const visible = blocks.filter((b) => !b.hidden && registry[b.type]);
  return (
    <>
      {visible.map((b, i) => {
        const C = registry[b.type]!;
        const refCode = `${letter}·${String(i + 1).padStart(2, "0")}`;
        return <C key={b.id} site={site} props={{ ...b.props, ...(extra?.[b.type] ?? {}) }} refCode={refCode} index={i + 1} />;
      })}
    </>
  );
}
