import type { Post } from "@/lib/types";
import { docText } from "@/lib/rich";

/** A post is available in a locale when it has a title and slug there. */
export const postIn = (p: Pick<Post, "title" | "slug">, locale: string) => Boolean(p.title?.[locale] && p.slug?.[locale]);
export const cardIn = postIn;

/** Reading time from a body (used at save time; lists read the stored read_minutes). */
export const minutesFor = (doc: unknown) => Math.max(1, Math.round(docText(doc as Post["body"][string]).split(/\s+/).filter(Boolean).length / 200));

/** Stored reading time, with a fallback for posts saved before read_minutes existed. */
export const readMinutes = (p: { read_minutes?: Record<string, number>; body?: Post["body"] }, locale: string) =>
  p.read_minutes?.[locale] ?? (p.body ? minutesFor(p.body[locale]) : 1);

/** Posts per page on /insights. */
export const PAGE_SIZE = 24;
