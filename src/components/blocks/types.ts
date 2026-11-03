import type { Site } from "@/lib/site";
import type { L } from "@/lib/types";

export type BlockProps<P = Record<string, unknown>> = { site: Site; props: P; refCode: string; index: number };
export type LinkProp = { label: L; href: string };
export type HeadProps = { eyebrow?: L; title?: L; intro?: L };
