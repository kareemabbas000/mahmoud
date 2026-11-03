import type { RichDoc, RichNode } from "./types";

/**
 * Tiny markdown → ProseMirror JSON converter used to author seed content.
 * Supports: "## " / "### " headings, "- " bullets, "1. " ordered items,
 * "> " callouts, blank-line separated paragraphs, **bold**.
 */
function inline(text: string): RichNode[] {
  const out: RichNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ type: "text", text: text.slice(last, m.index) });
    out.push({ type: "text", text: m[1] ?? "", marks: [{ type: "bold" }] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out.length ? out : [];
}

const para = (t: string): RichNode => ({ type: "paragraph", content: inline(t) });

export function md(src: string): RichDoc {
  const lines = src.replace(/\r/g, "").split("\n");
  const content: RichNode[] = [];
  let list: RichNode | null = null;
  let buf: string[] = [];
  const flushPara = () => {
    if (buf.length) content.push(para(buf.join(" ").trim()));
    buf = [];
  };
  const flushList = () => {
    if (list) content.push(list);
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    const h = /^(#{2,4})\s+(.*)$/.exec(line);
    const ul = /^[-•]\s+(.*)$/.exec(line);
    const ol = /^\d+[.)]\s+(.*)$/.exec(line);
    const q = /^>\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      flushList();
      content.push({ type: "heading", attrs: { level: (h[1] ?? "##").length }, content: inline(h[2] ?? "") });
    } else if (ul || ol) {
      flushPara();
      const kind = ul ? "bulletList" : "orderedList";
      if (!list || list.type !== kind) {
        flushList();
        list = { type: kind, content: [] };
      }
      list.content!.push({ type: "listItem", content: [para((ul ?? ol)![1] ?? "")] });
    } else if (q) {
      flushPara();
      flushList();
      content.push({ type: "callout", attrs: { tone: "info" }, content: [para(q[1] ?? "")] });
    } else {
      flushList();
      buf.push(line);
    }
  }
  flushPara();
  flushList();
  return { type: "doc", content };
}

export function emptyDoc(): RichDoc {
  return { type: "doc", content: [] };
}

/** Plain text of a rich doc (for excerpts, SEO scoring, search). */
export function docText(doc: RichDoc | null | undefined): string {
  if (!doc) return "";
  const walk = (n: RichNode): string =>
    n.text ?? (n.content ?? []).map(walk).join(n.type === "doc" ? "\n" : " ");
  return walk(doc as RichNode).replace(/\s+\n/g, "\n").trim();
}

/** Headings inside a doc, for a table of contents. */
export function docHeadings(doc: RichDoc | null | undefined): { level: number; text: string; id: string }[] {
  if (!doc) return [];
  return doc.content
    .filter((n) => n.type === "heading")
    .map((n, i) => {
      const text = (n.content ?? []).map((c) => c.text ?? "").join("");
      return { level: Number(n.attrs?.level ?? 2), text, id: `h-${i + 1}` };
    });
}
