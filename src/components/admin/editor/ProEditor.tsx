"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { NodeSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import Typography from "@tiptap/extension-typography";
import { CharacterCount, Placeholder, Focus } from "@tiptap/extensions";
import { Callout, Cta, Embed, RichImage, Toggle } from "./nodes";
import { EdIcon } from "./icons";
import { MediaPicker, useUploader } from "../MediaPicker";
import { useAdmin } from "../AdminContext";
import type { RichDoc } from "@/lib/types";

/* ───────────────────────── palette ───────────────────────── */
const COLORS = ["#0b1033", "#2b2ff5", "#04019f", "#fc4e08", "#c23a00", "#0f7a4a", "#b42318", "#7c3aed", "#64748b"];
const MARKS = ["#fff3b0", "#ffd9c7", "#d9f2e3", "#dfe3ff", "#f3d9ff", "#ffe0e0"];

/* ───────────────────────── small UI ───────────────────────── */
function Btn({ on, label, active, disabled, children, wide }: { on: () => void; label: string; active?: boolean; disabled?: boolean; children: React.ReactNode; wide?: boolean }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={on}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`ed-btn ${wide ? "is-wide" : ""} ${active ? "is-on" : ""}`}
    >
      {children}
    </button>
  );
}
const Sep = () => <span className="ed-sep" aria-hidden="true" />;

function Pop({ label, icon, children, active }: { label: string; icon: React.ReactNode; children: (close: () => void) => React.ReactNode; active?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <Btn on={() => setOpen((o) => !o)} label={label} active={active || open}>
        {icon}
        <span className="ed-caret">▾</span>
      </Btn>
      {open && <div className="ed-pop">{children(() => setOpen(false))}</div>}
    </div>
  );
}

type DialogField = { key: string; label: string; value?: string; placeholder?: string; type?: "text" | "url" | "select"; options?: { value: string; label: string }[] };
type DialogState = { title: string; fields: DialogField[]; submit: string; onSubmit: (v: Record<string, string>) => void; onRemove?: () => void } | null;

function MiniDialog({ state, close }: { state: DialogState; close: () => void }) {
  const { t } = useAdmin();
  const dlg = useRef<HTMLDialogElement>(null);
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => {
    if (state) {
      setVals(Object.fromEntries(state.fields.map((f) => [f.key, f.value ?? ""])));
      dlg.current?.showModal();
    } else dlg.current?.close();
  }, [state]);
  return (
    <dialog ref={dlg} onClose={close} className="ed-dialog">
      {state && (
        <form
          method="dialog"
          onSubmit={(e) => {
            e.preventDefault();
            state.onSubmit(vals);
            close();
          }}
          className="grid gap-4 p-5"
        >
          <h3 className="font-semibold text-ink">{state.title}</h3>
          {state.fields.map((f, i) => (
            <label key={f.key} className="grid gap-1.5 text-sm">
              <span className="text-muted">{f.label}</span>
              {f.type === "select" ? (
                <select className="ed-input" value={vals[f.key] ?? ""} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input autoFocus={i === 0} dir="auto" className="ed-input" value={vals[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
              )}
            </label>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primary !min-h-10 !px-5 text-sm">{state.submit}</button>
            <button type="button" className="btn btn-ghost !min-h-10 !px-5 text-sm" onClick={close}>{t("إلغاء", "Cancel")}</button>
            {state.onRemove && (
              <button type="button" className="ms-auto text-sm text-danger hover:underline" onClick={() => { state.onRemove!(); close(); }}>
                {t("إزالة", "Remove")}
              </button>
            )}
          </div>
        </form>
      )}
    </dialog>
  );
}

/* ───────────────────────── block catalogue (toolbar · slash menu · + button) ───────────────────────── */
type Ctx = { ed: Editor; media: () => void; dialog: (d: DialogState) => void; t: (a: string, e: string) => string };
type BlockCmd = { id: string; icon: string; label: [string, string]; hint: [string, string]; keys: string; run: (c: Ctx) => void };

const BLOCKS: BlockCmd[] = [
  { id: "p", icon: "p", label: ["فقرة", "Paragraph"], hint: ["نص عادي", "Plain text"], keys: "text paragraph فقرة نص", run: ({ ed }) => ed.chain().focus().setParagraph().run() },
  { id: "h2", icon: "h", label: ["عنوان رئيسي H2", "Heading 2"], hint: ["قسم رئيسي في المقال", "Main section"], keys: "h2 heading title عنوان", run: ({ ed }) => ed.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: "h3", icon: "h", label: ["عنوان فرعي H3", "Heading 3"], hint: ["قسم فرعي", "Sub-section"], keys: "h3 heading subtitle عنوان فرعي", run: ({ ed }) => ed.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: "h4", icon: "h", label: ["عنوان صغير H4", "Heading 4"], hint: ["عنوان داخلي", "Minor heading"], keys: "h4 heading", run: ({ ed }) => ed.chain().focus().toggleHeading({ level: 4 }).run() },
  { id: "ul", icon: "bullet", label: ["قائمة نقطية", "Bullet list"], hint: ["قائمة بسيطة", "Simple list"], keys: "list bullet ul قائمة", run: ({ ed }) => ed.chain().focus().toggleBulletList().run() },
  { id: "ol", icon: "ordered", label: ["قائمة مرقمة", "Numbered list"], hint: ["خطوات متتالية", "Steps in order"], keys: "list ordered numbered ol مرقمة", run: ({ ed }) => ed.chain().focus().toggleOrderedList().run() },
  { id: "task", icon: "task", label: ["قائمة مهام", "Checklist"], hint: ["عناصر قابلة للتأشير", "Tick-box items"], keys: "todo task check checklist مهام", run: ({ ed }) => ed.chain().focus().toggleTaskList().run() },
  { id: "quote", icon: "quote", label: ["اقتباس", "Quote"], hint: ["اقتباس بارز", "Pull quote"], keys: "quote blockquote اقتباس", run: ({ ed }) => ed.chain().focus().toggleBlockquote().run() },
  { id: "info", icon: "callout", label: ["تنبيه: معلومة", "Callout: info"], hint: ["صندوق ملاحظة أزرق", "Blue note box"], keys: "callout note info تنبيه ملاحظة", run: ({ ed }) => ed.chain().focus().wrapIn("callout", { tone: "info" }).run() },
  { id: "success", icon: "callout", label: ["تنبيه: نصيحة", "Callout: tip"], hint: ["صندوق أخضر", "Green box"], keys: "callout tip success نصيحة", run: ({ ed }) => ed.chain().focus().wrapIn("callout", { tone: "success" }).run() },
  { id: "warning", icon: "callout", label: ["تنبيه: تحذير", "Callout: warning"], hint: ["صندوق برتقالي", "Orange box"], keys: "callout warning تحذير", run: ({ ed }) => ed.chain().focus().wrapIn("callout", { tone: "warning" }).run() },
  { id: "danger", icon: "callout", label: ["تنبيه: هام جدًا", "Callout: important"], hint: ["صندوق أحمر", "Red box"], keys: "callout danger important هام", run: ({ ed }) => ed.chain().focus().wrapIn("callout", { tone: "danger" }).run() },
  {
    id: "toggle", icon: "toggle", label: ["قسم قابل للطي", "Toggle section"], hint: ["سؤال وجواب أو تفاصيل", "Q&A or details"], keys: "toggle accordion details faq طي سؤال",
    run: ({ ed, dialog, t }) =>
      dialog({ title: t("قسم قابل للطي", "Toggle section"), submit: t("إدراج", "Insert"), fields: [{ key: "summary", label: t("العنوان الظاهر", "Visible title"), placeholder: t("مثال: ما المستندات المطلوبة؟", "e.g. Which documents are needed?") }], onSubmit: (v) => v.summary && ed.chain().focus().insertContent({ type: "toggle", attrs: { summary: v.summary }, content: [{ type: "paragraph" }] }).run() }),
  },
  { id: "code", icon: "codeblock", label: ["كتلة كود", "Code block"], hint: ["نص برمجي أو صيغة", "Code or formula"], keys: "code block كود", run: ({ ed }) => ed.chain().focus().toggleCodeBlock().run() },
  { id: "hr", icon: "divider", label: ["فاصل", "Divider"], hint: ["خط فاصل بين الأقسام", "Section break"], keys: "hr divider line فاصل", run: ({ ed }) => ed.chain().focus().setHorizontalRule().run() },
  { id: "image", icon: "image", label: ["صورة", "Image"], hint: ["من المكتبة أو رفع جديد", "From the library or upload"], keys: "image photo picture صورة", run: ({ media }) => media() },
  { id: "table", icon: "table", label: ["جدول", "Table"], hint: ["جدول 3×3 مع رأس", "3×3 with header row"], keys: "table grid جدول", run: ({ ed }) => ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  {
    id: "video", icon: "video", label: ["فيديو يوتيوب", "YouTube video"], hint: ["تضمين بمشغل خفيف", "Embed with a light player"], keys: "video youtube embed فيديو",
    run: ({ ed, dialog, t }) =>
      dialog({ title: t("فيديو يوتيوب", "YouTube video"), submit: t("إدراج", "Insert"), fields: [{ key: "src", label: t("رابط الفيديو", "Video URL"), placeholder: "https://www.youtube.com/watch?v=…", type: "url" }, { key: "title", label: t("عنوان الفيديو (لإمكانية الوصول)", "Video title (accessibility)") }], onSubmit: (v) => v.src && ed.chain().focus().insertContent({ type: "embed", attrs: { src: v.src, title: v.title } }).run() }),
  },
  {
    id: "cta", icon: "button", label: ["زر دعوة لإجراء", "Call-to-action button"], hint: ["زر يقود إلى صفحة", "A button linking to a page"], keys: "button cta link زر",
    run: ({ ed, dialog, t }) =>
      dialog({
        title: t("زر دعوة لإجراء", "Call-to-action button"),
        submit: t("إدراج", "Insert"),
        fields: [
          { key: "label", label: t("نص الزر", "Button text"), placeholder: t("احجز استشارة", "Book a consultation") },
          { key: "href", label: t("الرابط", "Link"), value: "/contact", placeholder: "/contact" },
          { key: "variant", label: t("الشكل", "Style"), type: "select", value: "primary", options: [{ value: "primary", label: t("أزرق", "Blue") }, { value: "accent", label: t("برتقالي", "Orange") }, { value: "ghost", label: t("إطار", "Outline") }] },
        ],
        onSubmit: (v) => v.label && ed.chain().focus().insertContent({ type: "cta", attrs: v }).run(),
      }),
  },
];

/* ───────────────────────── link dialog ───────────────────────── */
function linkDialog({ ed, dialog, t }: Ctx) {
  const cur = String(ed.getAttributes("link").href ?? "");
  dialog({
    title: t("رابط", "Link"),
    submit: t("تطبيق", "Apply"),
    fields: [{ key: "href", label: t("الرابط: https://… أو صفحة داخلية مثل /ar/services", "URL: https://… or an internal page like /en/services"), value: cur, placeholder: "https://", type: "url" }],
    onSubmit: (v) => {
      const href = (v.href ?? "").trim();
      if (!href) return ed.chain().focus().extendMarkRange("link").unsetLink().run();
      ed.chain().focus().extendMarkRange("link").setLink({ href }).run();
    },
    onRemove: cur ? () => ed.chain().focus().extendMarkRange("link").unsetLink().run() : undefined,
  });
}

/* ───────────────────────── toolbar ───────────────────────── */
function Toolbar({ ctx, full, setFull, outline, setOutline }: { ctx: Ctx; full: boolean; setFull: (v: boolean) => void; outline: boolean; setOutline: (v: boolean) => void }) {
  const { ed, t } = ctx;
  const s = useEditorState({
    editor: ed,
    selector: ({ editor: e }) => ({
      h: [2, 3, 4].find((l) => e.isActive("heading", { level: l })) ?? 0,
      bold: e.isActive("bold"), italic: e.isActive("italic"), underline: e.isActive("underline"), strike: e.isActive("strike"), code: e.isActive("code"),
      sup: e.isActive("superscript"), sub: e.isActive("subscript"),
      ul: e.isActive("bulletList"), ol: e.isActive("orderedList"), task: e.isActive("taskList"), li: e.isActive("listItem") || e.isActive("taskItem"),
      link: e.isActive("link"), table: e.isActive("table"),
      align: (["left", "center", "right", "justify"] as const).find((a) => e.isActive({ textAlign: a })) ?? "",
      undo: e.can().undo(), redo: e.can().redo(),
      color: (e.getAttributes("textStyle").color as string | undefined) ?? "",
    }),
  });
  const rtl = ed.view.dom.getAttribute("dir") === "rtl";
  const startA = rtl ? "right" : "left";
  const endA = rtl ? "left" : "right";
  return (
    <div className="ed-toolbar" role="toolbar" aria-label={t("أدوات التنسيق", "Formatting")}>
      <Btn on={() => ed.chain().focus().undo().run()} disabled={!s.undo} label={t("تراجع (Ctrl+Z)", "Undo (Ctrl+Z)")}><EdIcon name="undo" /></Btn>
      <Btn on={() => ed.chain().focus().redo().run()} disabled={!s.redo} label={t("إعادة (Ctrl+Y)", "Redo (Ctrl+Y)")}><EdIcon name="redo" /></Btn>
      <Sep />
      <select
        className="ed-select"
        aria-label={t("نوع النص", "Text style")}
        value={String(s.h)}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!v) ed.chain().focus().setParagraph().run();
          else ed.chain().focus().setHeading({ level: v as 2 | 3 | 4 }).run();
        }}
      >
        <option value="0">{t("فقرة", "Paragraph")}</option>
        <option value="2">{t("عنوان H2", "Heading 2")}</option>
        <option value="3">{t("عنوان H3", "Heading 3")}</option>
        <option value="4">{t("عنوان H4", "Heading 4")}</option>
      </select>
      <Sep />
      <Btn on={() => ed.chain().focus().toggleBold().run()} active={s.bold} label={t("عريض (Ctrl+B)", "Bold (Ctrl+B)")}><EdIcon name="bold" /></Btn>
      <Btn on={() => ed.chain().focus().toggleItalic().run()} active={s.italic} label={t("مائل (Ctrl+I)", "Italic (Ctrl+I)")}><EdIcon name="italic" /></Btn>
      <Btn on={() => ed.chain().focus().toggleUnderline().run()} active={s.underline} label={t("تسطير (Ctrl+U)", "Underline (Ctrl+U)")}><EdIcon name="underline" /></Btn>
      <Btn on={() => ed.chain().focus().toggleStrike().run()} active={s.strike} label={t("يتوسطه خط", "Strikethrough")}><EdIcon name="strike" /></Btn>
      <Btn on={() => ed.chain().focus().toggleSuperscript().run()} active={s.sup} label={t("نص علوي", "Superscript")}><EdIcon name="sup" /></Btn>
      <Btn on={() => ed.chain().focus().toggleSubscript().run()} active={s.sub} label={t("نص سفلي", "Subscript")}><EdIcon name="sub" /></Btn>
      <Btn on={() => ed.chain().focus().toggleCode().run()} active={s.code} label={t("كود داخل السطر", "Inline code")}><EdIcon name="code" /></Btn>
      <Pop label={t("لون النص", "Text colour")} icon={<span className="ed-colorchip" style={{ ["--c" as string]: s.color || "currentColor" } as React.CSSProperties}><EdIcon name="color" /></span>}>
        {(close) => (
          <div className="grid gap-2">
            <p className="ed-pop-title">{t("لون النص", "Text colour")}</p>
            <div className="ed-swatches">
              {COLORS.map((c) => <button key={c} type="button" className="ed-swatch" style={{ background: c }} aria-label={c} onMouseDown={(e) => e.preventDefault()} onClick={() => { ed.chain().focus().setColor(c).run(); close(); }} />)}
            </div>
            <button type="button" className="ed-pop-link" onClick={() => { ed.chain().focus().unsetColor().run(); close(); }}>{t("اللون الافتراضي", "Default colour")}</button>
          </div>
        )}
      </Pop>
      <Pop label={t("تظليل", "Highlight")} icon={<EdIcon name="highlight" />}>
        {(close) => (
          <div className="grid gap-2">
            <p className="ed-pop-title">{t("تظليل", "Highlight")}</p>
            <div className="ed-swatches">
              {MARKS.map((c) => <button key={c} type="button" className="ed-swatch" style={{ background: c }} aria-label={c} onMouseDown={(e) => e.preventDefault()} onClick={() => { ed.chain().focus().setHighlight({ color: c }).run(); close(); }} />)}
            </div>
            <button type="button" className="ed-pop-link" onClick={() => { ed.chain().focus().unsetHighlight().run(); close(); }}>{t("إزالة التظليل", "Remove highlight")}</button>
          </div>
        )}
      </Pop>
      <Sep />
      <Btn on={() => ed.chain().focus().setTextAlign(startA).run()} active={s.align === startA} label={t("محاذاة للبداية", "Align start")}><EdIcon name={rtl ? "alignEnd" : "alignStart"} /></Btn>
      <Btn on={() => ed.chain().focus().setTextAlign("center").run()} active={s.align === "center"} label={t("توسيط", "Centre")}><EdIcon name="alignCenter" /></Btn>
      <Btn on={() => ed.chain().focus().setTextAlign(endA).run()} active={s.align === endA} label={t("محاذاة للنهاية", "Align end")}><EdIcon name={rtl ? "alignStart" : "alignEnd"} /></Btn>
      <Btn on={() => ed.chain().focus().setTextAlign("justify").run()} active={s.align === "justify"} label={t("ضبط", "Justify")}><EdIcon name="justify" /></Btn>
      <Sep />
      <Btn on={() => ed.chain().focus().toggleBulletList().run()} active={s.ul} label={t("قائمة نقطية", "Bullet list")}><EdIcon name="bullet" /></Btn>
      <Btn on={() => ed.chain().focus().toggleOrderedList().run()} active={s.ol} label={t("قائمة مرقمة", "Numbered list")}><EdIcon name="ordered" /></Btn>
      <Btn on={() => ed.chain().focus().toggleTaskList().run()} active={s.task} label={t("قائمة مهام", "Checklist")}><EdIcon name="task" /></Btn>
      <Btn on={() => ed.chain().focus().sinkListItem(ed.isActive("taskItem") ? "taskItem" : "listItem").run()} disabled={!s.li} label={t("زيادة المسافة", "Indent")}><EdIcon name={rtl ? "outdent" : "indent"} /></Btn>
      <Btn on={() => ed.chain().focus().liftListItem(ed.isActive("taskItem") ? "taskItem" : "listItem").run()} disabled={!s.li} label={t("إنقاص المسافة", "Outdent")}><EdIcon name={rtl ? "indent" : "outdent"} /></Btn>
      <Sep />
      <Btn on={() => linkDialog(ctx)} active={s.link} label={t("رابط (Ctrl+K)", "Link (Ctrl+K)")}><EdIcon name="link" /></Btn>
      <Btn on={ctx.media} label={t("صورة", "Image")}><EdIcon name="image" /></Btn>
      <Btn on={() => ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} active={s.table} label={t("جدول", "Table")}><EdIcon name="table" /></Btn>
      <Btn on={() => BLOCKS.find((b) => b.id === "video")!.run(ctx)} label={t("فيديو", "Video")}><EdIcon name="video" /></Btn>
      <Pop label={t("إدراج عنصر", "Insert block")} icon={<EdIcon name="plus" />}>
        {(close) => (
          <div className="ed-blocks">
            {BLOCKS.filter((b) => !["p", "h2", "h3", "h4"].includes(b.id)).map((b) => (
              <button key={b.id} type="button" className="ed-block-item" onMouseDown={(e) => e.preventDefault()} onClick={() => { close(); b.run(ctx); }}>
                <span className="ed-block-ic"><EdIcon name={b.icon} /></span>
                <span><b>{t(...b.label)}</b><small>{t(...b.hint)}</small></span>
              </button>
            ))}
          </div>
        )}
      </Pop>
      <Btn on={() => ed.chain().focus().unsetAllMarks().clearNodes().run()} label={t("مسح التنسيق", "Clear formatting")}><EdIcon name="clear" /></Btn>
      <span className="ms-auto" />
      <Btn on={() => setOutline(!outline)} active={outline} label={t("مخطط العناوين", "Outline")}><EdIcon name="outline" /></Btn>
      <Btn on={() => setFull(!full)} active={full} label={full ? t("خروج من ملء الشاشة (Esc)", "Exit full screen (Esc)") : t("وضع التركيز / ملء الشاشة", "Focus / full screen")}><EdIcon name={full ? "collapse" : "expand"} /></Btn>
    </div>
  );
}

/* ───────────────────────── slash menu ───────────────────────── */
function SlashMenu({ ctx, at, close }: { ctx: Ctx; at: { x: number; y: number; pos: number }; close: () => void }) {
  const { t } = ctx;
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return BLOCKS.filter((b) => !s || b.keys.includes(s) || t(...b.label).toLowerCase().includes(s));
  }, [q, t]);
  const pick = (b: BlockCmd) => {
    const { ed } = ctx;
    // remove the "/" that opened the menu
    const ch = ed.state.doc.textBetween(at.pos - 1, at.pos);
    if (ch === "/") ed.chain().focus().deleteRange({ from: at.pos - 1, to: at.pos }).run();
    close();
    b.run(ctx);
  };
  return (
    <div className="ed-slash" style={{ top: at.y, left: at.x }} role="listbox">
      <div className="ed-slash-search">
        <EdIcon name="search" size={16} />
        <input
          autoFocus
          value={q}
          placeholder={t("ابحث عن عنصر… (عنوان، صورة، جدول)", "Search blocks… (heading, image, table)")}
          onChange={(e) => { setQ(e.target.value); setI(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(list.length - 1, x + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
            if (e.key === "Enter") { e.preventDefault(); if (list[i]) pick(list[i]!); }
            if (e.key === "Escape") { e.preventDefault(); close(); ctx.ed.commands.focus(); }
          }}
        />
      </div>
      <div className="ed-slash-list">
        {list.map((b, k) => (
          <button key={b.id} type="button" role="option" aria-selected={k === i} className={`ed-block-item ${k === i ? "is-on" : ""}`} onMouseEnter={() => setI(k)} onClick={() => pick(b)}>
            <span className="ed-block-ic"><EdIcon name={b.icon} /></span>
            <span><b>{t(...b.label)}</b><small>{t(...b.hint)}</small></span>
          </button>
        ))}
        {!list.length && <p className="p-3 text-sm text-muted">{t("لا نتائج", "No matches")}</p>}
      </div>
    </div>
  );
}

/* ───────────────────────── editor ───────────────────────── */
export type EditorStats = { words: number; chars: number; minutes: number };

export function ProEditor({
  value,
  onChange,
  dir,
  lang,
  placeholder,
  onStats,
  minHeight = "28rem",
}: {
  value: RichDoc | null | undefined;
  onChange: (doc: RichDoc) => void;
  dir: "ltr" | "rtl";
  lang: string;
  placeholder?: string;
  onStats?: (s: EditorStats) => void;
  minHeight?: string;
}) {
  const { t } = useAdmin();
  const [media, setMedia] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [full, setFull] = useState(false);
  const [outline, setOutline] = useState(false);
  const [slash, setSlash] = useState<{ x: number; y: number; pos: number } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const upload = useUploader();
  const uploadRef = useRef(upload);
  useEffect(() => {
    uploadRef.current = upload;
  }, [upload]);
  const slashRef = useRef(setSlash);

  const ed = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true, defaultProtocol: "https" }, codeBlock: { HTMLAttributes: { class: "ed-code" } } }),
      RichImage.configure({ allowBase64: false }),
      TableKit.configure({ table: { resizable: false } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      Typography,
      CharacterCount,
      Focus.configure({ className: "has-focus", mode: "shallowest" }),
      Placeholder.configure({
        placeholder: ({ node }) => (node.type.name === "heading" ? t("عنوان…", "Heading…") : placeholder ?? t("اكتب هنا، أو اضغط / لإدراج عنصر…", "Write here, or press / to insert a block…")),
      }),
      Callout,
      Toggle,
      Embed,
      Cta,
    ],
    content: value && value.content?.length ? value : "",
    editorProps: {
      attributes: { class: "prose-sco ed-surface outline-none", dir, lang, spellcheck: "true" },
      handleKeyDown: (view, e) => {
        if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
          const { $from, empty } = view.state.selection;
          if (empty && $from.parent.type.name === "paragraph" && $from.parent.textContent.length === 0) {
            requestAnimationFrame(() => {
              const pos = view.state.selection.from;
              const c = view.coordsAtPos(pos);
              const box = wrap.current?.getBoundingClientRect();
              if (box) slashRef.current({ x: Math.max(8, Math.min(c.left - box.left, box.width - 330)), y: c.bottom - box.top + 6, pos });
            });
          }
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          document.dispatchEvent(new CustomEvent("ed:link"));
          return true;
        }
        return false;
      },
      handlePaste: (view, e) => {
        const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (!files.length) return false;
        e.preventDefault();
        void uploadRef.current(files).then((rows) => {
          rows.forEach((r) => view.dispatch(view.state.tr.replaceSelectionWith(view.state.schema.nodes.image!.create({ src: r.url, alt: "" }))));
        });
        return true;
      },
      handleDrop: (view, e) => {
        const files = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (!files.length) return false;
        e.preventDefault();
        void uploadRef.current(files).then((rows) => {
          rows.forEach((r) => view.dispatch(view.state.tr.replaceSelectionWith(view.state.schema.nodes.image!.create({ src: r.url, alt: "" }))));
        });
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as RichDoc);
    },
  });

  const ctx: Ctx | null = ed ? { ed, media: () => setMedia(true), dialog: setDialog, t } : null;

  // Ctrl+K from the keymap above
  useEffect(() => {
    if (!ctx) return;
    const on = () => linkDialog(ctx);
    document.addEventListener("ed:link", on);
    return () => document.removeEventListener("ed:link", on);
  });

  // Language tab switch swaps the document and direction.
  useEffect(() => {
    if (!ed) return;
    const cur = JSON.stringify(ed.getJSON());
    const next = value && value.content?.length ? value : { type: "doc", content: [] };
    if (cur !== JSON.stringify(next)) ed.commands.setContent(next as never, { emitUpdate: false });
    ed.view.dom.setAttribute("dir", dir);
    ed.view.dom.setAttribute("lang", lang);
  }, [ed, value, dir, lang]);

  // Esc leaves full screen; lock page scroll while it's on.
  useEffect(() => {
    if (!full) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && !slash && setFull(false);
    document.addEventListener("keydown", k);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", k);
      document.documentElement.style.overflow = "";
    };
  }, [full, slash]);

  const stats = useEditorState({
    editor: ed,
    selector: ({ editor: e }) => {
      if (!e) return { words: 0, chars: 0, minutes: 0, heads: [] as { level: number; text: string; i: number }[] };
      const words = e.storage.characterCount.words() as number;
      const chars = e.storage.characterCount.characters() as number;
      const heads: { level: number; text: string; i: number }[] = [];
      let i = 0;
      e.state.doc.descendants((n) => {
        if (n.type.name === "heading") heads.push({ level: n.attrs.level as number, text: n.textContent, i: i++ });
      });
      return { words, chars, minutes: Math.max(1, Math.round(words / 200)), heads };
    },
  });
  const statsKey = `${stats?.words}-${stats?.chars}`;
  useEffect(() => {
    if (stats) onStats?.({ words: stats.words, chars: stats.chars, minutes: stats.minutes });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsKey]);

  const jump = useCallback(
    (i: number) => {
      const h = ed?.view.dom.querySelectorAll("h2,h3,h4")[i] as HTMLElement | undefined;
      h?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [ed],
  );

  if (!ed || !ctx) return <div className="ed-shell animate-pulse" style={{ minHeight }} />;

  const isImage = () => ed.state.selection instanceof NodeSelection && ed.state.selection.node.type.name === "image";
  const imgAttrs = ed.getAttributes("image");

  return (
    <div className={`ed-shell ${full ? "is-full" : ""}`}>
      <Toolbar ctx={ctx} full={full} setFull={setFull} outline={outline} setOutline={setOutline} />
      <div className="ed-body">
        {outline && (
          <aside className="ed-outline" aria-label={t("مخطط العناوين", "Outline")}>
            <p className="ed-pop-title">{t("مخطط العناوين", "Outline")}</p>
            {stats?.heads.length ? (
              <ol>
                {stats.heads.map((h) => (
                  <li key={h.i} style={{ paddingInlineStart: `${(h.level - 2) * 0.9}rem` }}>
                    <button type="button" onClick={() => jump(h.i)}><span className="ed-h-tag">H{h.level}</span>{h.text || "…"}</button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-muted">{t("أضف عناوين H2/H3 لتنظيم المقال.", "Add H2/H3 headings to structure the article.")}</p>
            )}
          </aside>
        )}
        <div ref={wrap} className="ed-canvas" style={{ minHeight }} onClick={(e) => e.target === e.currentTarget && ed.commands.focus("end")}>
          <EditorContent editor={ed} />
          {slash && <SlashMenu ctx={ctx} at={slash} close={() => setSlash(null)} />}
        </div>
      </div>

      {/* text selection menu */}
      <BubbleMenu
        editor={ed}
        pluginKey="textMenu"
        shouldShow={({ editor: e, state }) => !state.selection.empty && !(state.selection instanceof NodeSelection) && !e.isActive("codeBlock")}
        options={{ placement: "top" }}
        className="ed-bubble"
      >
        <Btn on={() => ed.chain().focus().toggleBold().run()} active={ed.isActive("bold")} label={t("عريض", "Bold")}><EdIcon name="bold" size={16} /></Btn>
        <Btn on={() => ed.chain().focus().toggleItalic().run()} active={ed.isActive("italic")} label={t("مائل", "Italic")}><EdIcon name="italic" size={16} /></Btn>
        <Btn on={() => ed.chain().focus().toggleUnderline().run()} active={ed.isActive("underline")} label={t("تسطير", "Underline")}><EdIcon name="underline" size={16} /></Btn>
        <Btn on={() => ed.chain().focus().toggleStrike().run()} active={ed.isActive("strike")} label={t("يتوسطه خط", "Strike")}><EdIcon name="strike" size={16} /></Btn>
        <Btn on={() => ed.chain().focus().toggleHighlight({ color: MARKS[0]! }).run()} active={ed.isActive("highlight")} label={t("تظليل", "Highlight")}><EdIcon name="highlight" size={16} /></Btn>
        <Btn on={() => ed.chain().focus().toggleHeading({ level: 2 }).run()} active={ed.isActive("heading", { level: 2 })} label="H2"><b className="text-xs">H2</b></Btn>
        <Btn on={() => ed.chain().focus().toggleHeading({ level: 3 }).run()} active={ed.isActive("heading", { level: 3 })} label="H3"><b className="text-xs">H3</b></Btn>
        <Btn on={() => linkDialog(ctx)} active={ed.isActive("link")} label={t("رابط", "Link")}><EdIcon name="link" size={16} /></Btn>
        <Btn on={() => ed.chain().focus().unsetAllMarks().run()} label={t("مسح التنسيق", "Clear")}><EdIcon name="clear" size={16} /></Btn>
      </BubbleMenu>

      {/* image menu */}
      <BubbleMenu editor={ed} pluginKey="imageMenu" shouldShow={() => isImage()} options={{ placement: "top" }} className="ed-bubble">
        {(["normal", "wide", "full"] as const).map((sz) => (
          <Btn key={sz} on={() => ed.chain().focus().updateAttributes("image", { size: sz }).run()} active={imgAttrs.size === sz} label={{ normal: t("عرض عادي", "Normal width"), wide: t("عريض", "Wide"), full: t("كامل العرض", "Full width") }[sz]}>
            <EdIcon name={sz} size={16} />
          </Btn>
        ))}
        <Btn
          wide
          on={() =>
            setDialog({
              title: t("بيانات الصورة", "Image details"),
              submit: t("حفظ", "Save"),
              fields: [
                { key: "alt", label: t("النص البديل (مهم لمحركات البحث وذوي الإعاقة البصرية)", "Alt text (matters for search engines and screen readers)"), value: String(imgAttrs.alt ?? "") },
                { key: "caption", label: t("تعليق أسفل الصورة (اختياري)", "Caption under the image (optional)"), value: String(imgAttrs.caption ?? "") },
              ],
              onSubmit: (v) => ed.chain().focus().updateAttributes("image", v).run(),
            })
          }
          label={t("النص البديل والتعليق", "Alt text & caption")}
        >
          <span className="text-xs font-semibold">{imgAttrs.alt ? "ALT ✓" : t("أضف ALT", "Add ALT")}</span>
        </Btn>
        <Btn on={() => ed.chain().focus().deleteSelection().run()} label={t("حذف الصورة", "Delete image")}><EdIcon name="trash" size={16} /></Btn>
      </BubbleMenu>

      {/* table menu */}
      <BubbleMenu editor={ed} pluginKey="tableMenu" shouldShow={({ editor: e }) => e.isActive("table") && !isImage()} options={{ placement: "bottom" }} className="ed-bubble">
        <Btn on={() => ed.chain().focus().addRowBefore().run()} label={t("صف قبل", "Row above")}><EdIcon name="rowBefore" size={16} /></Btn>
        <Btn on={() => ed.chain().focus().addRowAfter().run()} label={t("صف بعد", "Row below")}><EdIcon name="rowAfter" size={16} /></Btn>
        <Btn on={() => ed.chain().focus().addColumnBefore().run()} label={t("عمود قبل", "Column before")}><EdIcon name="colBefore" size={16} /></Btn>
        <Btn on={() => ed.chain().focus().addColumnAfter().run()} label={t("عمود بعد", "Column after")}><EdIcon name="colAfter" size={16} /></Btn>
        <Btn on={() => ed.chain().focus().deleteRow().run()} label={t("حذف الصف", "Delete row")}><EdIcon name="delRow" size={16} /></Btn>
        <Btn on={() => ed.chain().focus().deleteColumn().run()} label={t("حذف العمود", "Delete column")}><EdIcon name="delCol" size={16} /></Btn>
        <Btn on={() => ed.chain().focus().mergeOrSplit().run()} label={t("دمج/فصل الخلايا", "Merge / split cells")}><EdIcon name="merge" size={16} /></Btn>
        <Btn on={() => ed.chain().focus().toggleHeaderRow().run()} label={t("صف العناوين", "Header row")}><EdIcon name="headerRow" size={16} /></Btn>
        <Btn on={() => ed.chain().focus().deleteTable().run()} label={t("حذف الجدول", "Delete table")}><EdIcon name="trash" size={16} /></Btn>
      </BubbleMenu>

      <div className="ed-status">
        <span>{t("الكلمات", "Words")}: <b className="tnum">{stats?.words ?? 0}</b></span>
        <span>{t("الأحرف", "Characters")}: <b className="tnum">{stats?.chars ?? 0}</b></span>
        <span>{t("وقت القراءة", "Reading time")}: <b className="tnum">{stats?.minutes ?? 0}</b> {t("دقيقة", "min")}</span>
        <span>{t("العناوين", "Headings")}: <b className="tnum">{stats?.heads.length ?? 0}</b></span>
        <span className="ms-auto hidden text-faint sm:inline">{t("اضغط / لإدراج عنصر · Ctrl+K رابط · الصق صورة لرفعها", "Press / to insert · Ctrl+K link · paste an image to upload it")}</span>
      </div>

      <MediaPicker
        open={media}
        onClose={() => setMedia(false)}
        onPick={(m) => {
          ed.chain().focus().setImage({ src: m.url, alt: m.alt?.[lang] ?? "" }).run();
        }}
      />
      <MiniDialog state={dialog} close={() => setDialog(null)} />
    </div>
  );
}
