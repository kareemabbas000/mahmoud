import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "./JsonLd";
import { breadcrumbLd } from "@/lib/seo";

export function Breadcrumbs({ items, label, onDeep = false }: { items: { name: string; url: string }[]; label: string; onDeep?: boolean }) {
  return (
    <>
      <nav aria-label={label} className={`text-sm ${onDeep ? "text-deep-muted" : "text-muted"}`}>
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((it, i) => (
            <li key={it.url} className="flex items-center gap-2">
              {i > 0 && <Icon name="chevron" size={14} className="flip-rtl opacity-50" />}
              {i < items.length - 1 ? (
                <Link href={it.url} className={onDeep ? "hover:text-deep-ink" : "hover:text-ink"}>{it.name}</Link>
              ) : (
                <span aria-current="page" className={onDeep ? "text-deep-ink" : "text-ink"}>{it.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbLd(items)} />
    </>
  );
}
