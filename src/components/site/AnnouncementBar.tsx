import Link from "next/link";
import { href } from "@/lib/i18n";
import type { Site } from "@/lib/site";
import { Icon } from "@/components/ui/Icon";

export function AnnouncementBar({ site }: { site: Site }) {
  const h = site.settings.header;
  const text = site.l(h.announcement);
  if (!h.show_announcement || !text) return null;
  const inner = (
    <span className="inline-flex items-center gap-2">
      <span className="size-1.5 rounded-full bg-orange" aria-hidden="true" />
      {text}
      {h.announcement_url && <Icon name="arrow" size={14} className="flip-rtl" />}
    </span>
  );
  return (
    <div className="bg-deep text-center text-sm text-deep-ink">
      <div className="container-x py-2.5">
        {h.announcement_url ? <Link href={href(h.announcement_url, site.locale)} className="hover:underline">{inner}</Link> : inner}
      </div>
    </div>
  );
}
