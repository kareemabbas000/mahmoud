/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import type { RichDoc, RichNode } from "@/lib/types";

/**
 * Server renderer for ProseMirror/TipTap JSON. No editor code ships to visitors.
 * Unknown nodes render their children; raw HTML is never injected.
 */
/** Only plain colour values reach the page (hex / rgb / named). */
function safeColor(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]{3,20})$/i.test(s) ? s : null;
}
const ALIGN = new Set(["left", "right", "center", "justify"]);
const alignStyle = (n: RichNode) => {
  const a = String(n.attrs?.textAlign ?? "");
  return ALIGN.has(a) ? { textAlign: a as "left" } : undefined;
};

function marks(node: RichNode, child: ReactNode, key: string): ReactNode {
  return (node.marks ?? []).reduce<ReactNode>((acc, m, i) => {
    const k = `${key}-m${i}`;
    switch (m.type) {
      case "bold":
        return <strong key={k}>{acc}</strong>;
      case "italic":
        return <em key={k}>{acc}</em>;
      case "underline":
        return <u key={k}>{acc}</u>;
      case "code":
        return <code key={k}>{acc}</code>;
      case "strike":
        return <s key={k}>{acc}</s>;
      case "subscript":
        return <sub key={k}>{acc}</sub>;
      case "superscript":
        return <sup key={k}>{acc}</sup>;
      case "highlight": {
        const c = safeColor(m.attrs?.color) ?? "#fff3b0";
        return <mark key={k} style={{ background: c }}>{acc}</mark>;
      }
      case "textStyle": {
        const c = safeColor(m.attrs?.color);
        return c ? <span key={k} style={{ color: c }}>{acc}</span> : acc;
      }
      case "link": {
        const href = String(m.attrs?.href ?? "#");
        const safe = /^(https?:|mailto:|tel:|\/|#)/.test(href) ? href : "#";
        const ext = /^https?:/.test(safe);
        return (
          <a key={k} href={safe} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {acc}
          </a>
        );
      }
      default:
        return acc;
    }
  }, child);
}

function render(node: RichNode, key: string, ctx: { h: number }): ReactNode {
  const kids = () => (node.content ?? []).map((c, i) => render(c, `${key}-${i}`, ctx));
  switch (node.type) {
    case "text":
      return marks(node, node.text ?? "", key);
    case "paragraph":
      return <p key={key} style={alignStyle(node)}>{kids()}</p>;
    case "heading": {
      const lvl = Math.min(Math.max(Number(node.attrs?.level ?? 2), 2), 4);
      const id = `h-${++ctx.h}`;
      if (lvl === 2) return <h2 key={key} id={id} style={alignStyle(node)}>{kids()}</h2>;
      if (lvl === 3) return <h3 key={key} id={id} style={alignStyle(node)}>{kids()}</h3>;
      return <h4 key={key} id={id} style={alignStyle(node)}>{kids()}</h4>;
    }
    case "bulletList":
      return <ul key={key}>{kids()}</ul>;
    case "orderedList":
      return <ol key={key}>{kids()}</ol>;
    case "listItem":
      return <li key={key}>{kids()}</li>;
    case "blockquote":
      return <blockquote key={key}>{kids()}</blockquote>;
    case "callout":
      return (
        <div key={key} className="callout" role="note" data-tone={["info", "success", "warning", "danger"].includes(String(node.attrs?.tone)) ? String(node.attrs?.tone) : "info"}>
          {kids()}
        </div>
      );
    case "taskList":
      return <ul key={key} className="rt-tasks">{kids()}</ul>;
    case "taskItem":
      return <li key={key} className={node.attrs?.checked ? "is-done" : ""}>{kids()}</li>;
    case "codeBlock":
      return (
        <pre key={key} dir="ltr">
          <code>{(node.content ?? []).map((c) => c.text ?? "").join("")}</code>
        </pre>
      );
    case "toggle":
      return (
        <details key={key} className="rt-toggle">
          <summary>{String(node.attrs?.summary ?? "")}</summary>
          {kids()}
        </details>
      );
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} className="border-rule" />;
    case "image": {
      const src = String(node.attrs?.src ?? "");
      if (!src) return null;
      const cap = node.attrs?.caption ? String(node.attrs.caption) : "";
      const size = ["wide", "full"].includes(String(node.attrs?.size)) ? String(node.attrs?.size) : "normal";
      return (
        <figure key={key} className={`is-${size}`}>
          <img src={src} alt={String(node.attrs?.alt ?? "")} loading="lazy" decoding="async" className="h-auto w-full" />
          {cap && <figcaption>{cap}</figcaption>}
        </figure>
      );
    }
    case "table":
      return (
        <div key={key} className="table-wrap">
          <table>
            <tbody>{kids()}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr key={key}>{kids()}</tr>;
    case "tableHeader":
      return <th key={key} scope="col">{kids()}</th>;
    case "tableCell":
      return <td key={key}>{kids()}</td>;
    case "embed": {
      const src = String(node.attrs?.src ?? "");
      const yt = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/.exec(src);
      const vm = /vimeo\.com\/(\d+)/.exec(src);
      const url = yt ? `https://www.youtube-nocookie.com/embed/${yt[1]}` : vm ? `https://player.vimeo.com/video/${vm[1]}` : null;
      if (!url) return null;
      return (
        <div key={key} className="rt-video">
          <iframe src={url} title={String(node.attrs?.title || "Video")} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      );
    }
    case "cta": {
      const raw = String(node.attrs?.href ?? "#");
      const href = /^(https?:|mailto:|tel:|\/|#)/.test(raw) ? raw : "#";
      const v = { accent: "btn-accent", ghost: "btn-ghost" }[String(node.attrs?.variant)] ?? "btn-primary";
      return (
        <p key={key} style={{ textAlign: "center" }}>
          <a href={href} className={`btn ${v} !no-underline`}>
            {String(node.attrs?.label ?? "")}
          </a>
        </p>
      );
    }
    default:
      return <div key={key}>{kids()}</div>;
  }
}

export function RichText({ doc, className = "" }: { doc: RichDoc | null | undefined; className?: string }) {
  if (!doc?.content?.length) return null;
  const ctx = { h: 0 };
  return <div className={`prose-sco ${className}`}>{doc.content.map((n, i) => render(n, `n${i}`, ctx))}</div>;
}
