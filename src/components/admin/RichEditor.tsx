"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { Node, mergeAttributes } from "@tiptap/core";
import { MediaPicker } from "./MediaPicker";
import { useAdmin } from "./AdminContext";
import type { RichDoc } from "@/lib/types";

/* Custom nodes mirrored by the public renderer (components/site/RichText.tsx). */
const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "paragraph+",
  defining: true,
  addAttributes: () => ({ tone: { default: "info" } }),
  parseHTML: () => [{ tag: "div[data-callout]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-callout": "", class: "callout" }), 0],
});
const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  addAttributes: () => ({ src: { default: "" }, title: { default: "" } }),
  parseHTML: () => [{ tag: "div[data-embed]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-embed": "", class: "rounded-md border border-dashed border-rule p-4 text-sm text-muted" }), `▶ ${HTMLAttributes.src}`],
});
const Cta = Node.create({
  name: "cta",
  group: "block",
  atom: true,
  addAttributes: () => ({ label: { default: "" }, href: { default: "/contact" } }),
  parseHTML: () => [{ tag: "div[data-cta]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-cta": "", class: "inline-block rounded-full bg-blue px-5 py-2 text-on-blue" }), String(HTMLAttributes.label ?? "CTA")],
});
const CaptionedImage = Image.extend({
  addAttributes() {
    return { ...this.parent?.(), caption: { default: "" } };
  },
});

function Btn({ on, label, active, children }: { on: () => void; label: string; active?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={on} title={label} aria-label={label} aria-pressed={active} className={`inline-flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm ${active ? "bg-ink text-paper" : "text-ink hover:bg-paper-2"}`}>
      {children}
    </button>
  );
}

function Toolbar({ ed, openMedia }: { ed: Editor; openMedia: () => void }) {
  const { t } = useAdmin();
  const ask = (q: string, d = "") => window.prompt(q, d)?.trim();
  return (
    <div className="sticky top-0 z-10 flex flex-wrap gap-0.5 border-b border-rule bg-surface p-1.5">
      <Btn on={() => ed.chain().focus().toggleHeading({ level: 2 }).run()} active={ed.isActive("heading", { level: 2 })} label="H2">H2</Btn>
      <Btn on={() => ed.chain().focus().toggleHeading({ level: 3 }).run()} active={ed.isActive("heading", { level: 3 })} label="H3">H3</Btn>
      <Btn on={() => ed.chain().focus().toggleBold().run()} active={ed.isActive("bold")} label={t("عريض", "Bold")}><b>B</b></Btn>
      <Btn on={() => ed.chain().focus().toggleItalic().run()} active={ed.isActive("italic")} label={t("مائل (للإنجليزية فقط)", "Italic")}><i>I</i></Btn>
      <Btn on={() => ed.chain().focus().toggleBulletList().run()} active={ed.isActive("bulletList")} label={t("قائمة", "Bullet list")}>•</Btn>
      <Btn on={() => ed.chain().focus().toggleOrderedList().run()} active={ed.isActive("orderedList")} label={t("قائمة مرقمة", "Numbered list")}>1.</Btn>
      <Btn on={() => ed.chain().focus().toggleBlockquote().run()} active={ed.isActive("blockquote")} label={t("اقتباس", "Quote")}>❝</Btn>
      <Btn on={() => (ed.isActive("callout") ? ed.chain().focus().lift("callout").run() : ed.chain().focus().wrapIn("callout").run())} active={ed.isActive("callout")} label={t("تنبيه بارز", "Callout")}>ⓘ</Btn>
      <Btn
        on={() => {
          const href = ask(t("الرابط (https:// أو /ar/...)", "Link (https:// or /en/...)"), ed.getAttributes("link").href ?? "");
          if (href === undefined) return;
          if (!href) ed.chain().focus().unsetLink().run();
          else ed.chain().focus().extendMarkRange("link").setLink({ href }).run();
        }}
        active={ed.isActive("link")}
        label={t("رابط", "Link")}
      >
        🔗
      </Btn>
      <Btn on={openMedia} label={t("صورة", "Image")}>🖼</Btn>
      <Btn on={() => ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} label={t("جدول", "Table")}>▦</Btn>
      {ed.isActive("table") && (
        <>
          <Btn on={() => ed.chain().focus().addRowAfter().run()} label={t("صف", "Row +")}>+R</Btn>
          <Btn on={() => ed.chain().focus().addColumnAfter().run()} label={t("عمود", "Col +")}>+C</Btn>
          <Btn on={() => ed.chain().focus().deleteTable().run()} label={t("حذف الجدول", "Delete table")}>×▦</Btn>
        </>
      )}
      <Btn on={() => { const src = ask(t("رابط فيديو يوتيوب", "YouTube URL")); if (src) ed.chain().focus().insertContent({ type: "embed", attrs: { src } }).run(); }} label={t("فيديو", "Video embed")}>▶</Btn>
      <Btn on={() => { const label = ask(t("نص الزر", "Button label")); if (!label) return; const href = ask(t("رابط الزر", "Button link"), "/contact"); ed.chain().focus().insertContent({ type: "cta", attrs: { label, href } }).run(); }} label={t("زر دعوة", "CTA button")}>CTA</Btn>
      <span className="mx-1 w-px bg-rule" />
      <Btn on={() => ed.chain().focus().undo().run()} label={t("تراجع", "Undo")}>↶</Btn>
      <Btn on={() => ed.chain().focus().redo().run()} label={t("إعادة", "Redo")}>↷</Btn>
    </div>
  );
}

export function RichEditor({ value, onChange, dir, placeholder }: { value: RichDoc | null | undefined; onChange: (doc: RichDoc) => void; dir: "ltr" | "rtl"; placeholder?: string }) {
  const [media, setMedia] = useState(false);
  const ed = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false } }), CaptionedImage, TableKit, Callout, Embed, Cta, Placeholder.configure({ placeholder: placeholder ?? "…" })],
    content: value && value.content?.length ? value : "",
    editorProps: { attributes: { class: "prose-sco min-h-48 max-w-none p-4 outline-none", dir } },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichDoc),
  });
  // Switching language tabs swaps the document.
  useEffect(() => {
    if (!ed) return;
    const cur = JSON.stringify(ed.getJSON());
    const next = value && value.content?.length ? value : { type: "doc", content: [] };
    if (cur !== JSON.stringify(next)) ed.commands.setContent(next as never, { emitUpdate: false });
    ed.view.dom.setAttribute("dir", dir);
  }, [ed, value, dir]);
  if (!ed) return <div className="min-h-48 rounded-md border border-rule bg-surface" />;
  return (
    <div className="overflow-hidden rounded-md border border-rule-strong bg-surface focus-within:border-blue">
      <Toolbar ed={ed} openMedia={() => setMedia(true)} />
      <EditorContent editor={ed} />
      <MediaPicker
        open={media}
        onClose={() => setMedia(false)}
        onPick={(m) => {
          const alt = window.prompt("Alt text", m.alt?.[dir === "rtl" ? "ar" : "en"] ?? "") ?? "";
          const caption = window.prompt("Caption (optional)", "") ?? "";
          ed.chain().focus().setImage({ src: m.url, alt }).updateAttributes("image", { caption }).run();
        }}
      />
    </div>
  );
}
