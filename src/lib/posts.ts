import type { Post } from "@/lib/types";
import { docText } from "@/lib/rich";

/** A post is available in a locale when it has a title and slug there. */
export const postIn = (p: Post, locale: string) => Boolean(p.title?.[locale] && p.slug?.[locale]);
export const readMinutes = (p: Post, locale: string) => Math.max(1, Math.round(docText(p.body?.[locale]).split(/\s+/).length / 200));
