/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import type { RichDoc, RichNode } from "@/lib/types";

/**
 * Server renderer for ProseMirror/TipTap JSON. No editor code ships to visitors.
 * Unknown nodes render their children; raw HTML is never injected.
 */
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
      return <p key={key}>{kids()}</p>;
    case "heading": {
      const lvl = Math.min(Math.max(Number(node.attrs?.level ?? 2), 2), 4);
      const id = `h-${++ctx.h}`;
      if (lvl === 2) return <h2 key={key} id={id}>{kids()}</h2>;
      if (lvl === 3) return <h3 key={key} id={id}>{kids()}</h3>;
      return <h4 key={key} id={id}>{kids()}</h4>;
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
        <div key={key} className="callout" role="note">
          {kids()}
        </div>
      );
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} className="border-rule" />;
    case "image": {
      const src = String(node.attrs?.src ?? "");
      if (!src) return null;
      const cap = node.attrs?.caption ? String(node.attrs.caption) : "";
      return (
        <figure key={key}>
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
      const yt = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/.exec(src);
      if (!yt) return null;
      return (
        <iframe
          key={key}
          src={`https://www.youtube-nocookie.com/embed/${yt[1]}`}
          title={String(node.attrs?.title ?? "Video")}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    case "cta": {
      const href = String(node.attrs?.href ?? "#");
      return (
        <p key={key}>
          <a href={href} className="btn btn-primary !no-underline">
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
