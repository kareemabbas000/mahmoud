import { Icon } from "@/components/ui/Icon";
import { Band, SectionHead } from "./Section";
import { num } from "@/lib/i18n";
import type { BlockProps, HeadProps } from "./types";
import type { L } from "@/lib/types";

type Item = { icon?: string; title: L; text: L; hidden?: boolean };
type P = HeadProps & { columns?: 2 | 3 | 4; items?: Item[] };

/** Feature points styled as "Notes to the financial statements". */
export function Cards({ site, props, refCode }: BlockProps<P>) {
  const items = (props.items ?? []).filter((i) => !i.hidden);
  const cols = { 2: "md:grid-cols-2", 3: "md:grid-cols-2 lg:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }[props.columns ?? 3];
  const noteWord = site.locale === "ar" ? "إيضاح" : "Note";
  return (
    <Band>
      <SectionHead site={site} refCode={refCode} head={props} />
      <ul className={`grid gap-x-10 gap-y-12 ${cols}`} data-stagger>
        {items.map((it, i) => (
          <li key={i} className="group border-t border-rule-strong pt-6">
            <div className="flex items-center justify-between text-faint">
              <span className="text-xs font-medium">
                {noteWord} {num(i + 1, site.locale, site.numerals)}
              </span>
              {it.icon && <Icon name={it.icon} size={22} className="text-blue transition-transform duration-500 group-hover:-translate-y-0.5" />}
            </div>
            <h3 className="mt-5 text-xl font-semibold leading-snug text-ink">{site.l(it.title)}</h3>
            <p className="mt-3 text-muted">{site.l(it.text)}</p>
          </li>
        ))}
      </ul>
    </Band>
  );
}
