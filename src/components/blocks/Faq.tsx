import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { RichText } from "@/components/site/RichText";
import { JsonLd } from "@/components/site/JsonLd";
import { Band, SectionHead } from "./Section";
import { FaqSearch } from "./FaqSearch";
import { getFaqs } from "@/lib/data";
import { faqLd } from "@/lib/seo";
import { docText } from "@/lib/rich";
import { digits, href as h, num } from "@/lib/i18n";
import type { BlockProps, HeadProps, LinkProp } from "./types";

type P = HeadProps & { group?: string; limit?: number; link?: LinkProp; show_notice?: boolean };

export async function Faq({ site, props, refCode }: BlockProps<P>) {
  const all = (await getFaqs()).filter((f) => !props.group || f.group_key === props.group);
  const list = props.limit ? all.slice(0, props.limit) : all;
  if (!list.length) return null;
  const qWord = site.locale === "ar" ? "س" : "Q";
  const first = list[0];
  return (
    <Band tone={props.limit ? "paper-2" : "paper"}>
      <SectionHead site={site} refCode={refCode} head={props} link={props.limit ? props.link : undefined} />
      {props.show_notice && first?.legal_basis && (
        <aside className="mb-10 grid gap-2 rounded-md border-s-2 border-orange bg-paper-2 p-5 md:grid-cols-[auto_1fr] md:gap-6" role="note">
          <Icon name="shield" size={24} className="text-orange-text" />
          <div>
            <p className="font-semibold text-ink">{site.t("faq.notice_title")}</p>
            <p className="mt-1 text-muted">{site.t("faq.notice_text")}</p>
            <p className="mt-3 text-sm text-faint">
              {site.t("faq.legal_basis")}: {site.l(first.legal_basis)}
              {first.reviewed_at && <> · {site.t("faq.last_reviewed")}: {digits(first.reviewed_at.slice(0, 4), site.locale, site.numerals)}</>}
            </p>
          </div>
        </aside>
      )}
      {!props.limit && <FaqSearch placeholder={site.t("faq.search")} empty={site.t("faq.no_results")} />}
      <ol className="faq-list border-b border-rule">
        {list.map((f, i) => (
          <li key={i} className="faq-item border-t border-rule" data-text={`${site.l(f.question)} ${docText(f.answer[site.locale])}`.toLowerCase()}>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-start gap-4 py-6 [&::-webkit-details-marker]:hidden">
                <span className="wp-ref w-12 shrink-0 pt-1.5">
                  {qWord}
                  {num(i + 1, "en").padStart(2, "0")}
                </span>
                <span className="flex-1 text-lg font-medium text-ink transition-colors group-hover:text-blue">{site.l(f.question)}</span>
                <span className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-rule transition-transform group-open:rotate-45">
                  <Icon name="plus" size={16} />
                </span>
              </summary>
              <div className="pb-8 ps-16">
                <RichText doc={f.answer[site.locale] ?? f.answer[site.defaultLocale]} />
              </div>
            </details>
          </li>
        ))}
      </ol>
      {props.limit && props.link && (
        <Link href={h(props.link.href, site.locale)} className="btn btn-ghost mt-10">
          {site.l(props.link.label)}
          <Icon name="arrow" size={16} className="arrow flip-rtl" />
        </Link>
      )}
      {!props.limit && <JsonLd data={faqLd(site, list)} />}
    </Band>
  );
}
