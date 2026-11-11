import { Node, mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";

/**
 * Custom document nodes. Every node here has a matching case in the public renderer
 * (components/site/RichText.tsx), so what the editor shows is what visitors get.
 */

/** Highlighted note box: info · success · warning · danger. */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes: () => ({ tone: { default: "info", parseHTML: (el) => el.getAttribute("data-tone") ?? "info", renderHTML: (a) => ({ "data-tone": a.tone }) } }),
  parseHTML: () => [{ tag: "div[data-callout]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-callout": "", class: "callout" }), 0],
});

/** Collapsible section (renders as <details>). The summary is editable text in the attribute. */
export const Toggle = Node.create({
  name: "toggle",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes: () => ({ summary: { default: "" } }),
  parseHTML: () => [{ tag: "div[data-toggle]" }],
  renderHTML: ({ HTMLAttributes, node }) => [
    "div",
    mergeAttributes(HTMLAttributes, { "data-toggle": "", class: "ed-toggle" }),
    ["div", { class: "ed-toggle-sum", contenteditable: "false" }, `▾ ${node.attrs.summary || "…"}`],
    ["div", { class: "ed-toggle-body" }, 0],
  ],
});

/** YouTube / Vimeo embed (privacy-friendly player on the site). */
export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ src: { default: "" }, title: { default: "" } }),
  parseHTML: () => [{ tag: "div[data-embed]" }],
  renderHTML: ({ HTMLAttributes }) => {
    const src = String(HTMLAttributes.src ?? "");
    const yt = /(?:youtube\.com\/watch\?v=|youtu\.be\/|embed\/)([\w-]{11})/.exec(src)?.[1];
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-embed": "", class: "ed-embed" }),
      yt ? ["img", { src: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`, alt: "" }] : ["span", {}, src],
      ["span", { class: "ed-embed-play" }, "▶"],
    ];
  },
});

/** Call-to-action button. */
export const Cta = Node.create({
  name: "cta",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ label: { default: "" }, href: { default: "/contact" }, variant: { default: "primary" } }),
  parseHTML: () => [{ tag: "div[data-cta]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-cta": "", class: "ed-cta" }), ["span", { class: `ed-cta-btn is-${HTMLAttributes.variant}` }, String(HTMLAttributes.label || "CTA")]],
});

/** Image with caption, size (normal · wide · full) and alignment. */
export const RichImage = Image.extend({
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: { default: "" },
      size: { default: "normal", parseHTML: (el) => el.getAttribute("data-size") ?? "normal", renderHTML: (a) => ({ "data-size": a.size }) },
      align: { default: "center", parseHTML: (el) => el.getAttribute("data-align") ?? "center", renderHTML: (a) => ({ "data-align": a.align }) },
    };
  },
});
