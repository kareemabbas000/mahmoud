import { getEnabledLanguages, getPosts, getSettings } from "@/lib/data";
import { abs } from "@/lib/seo";
import { tr } from "@/lib/i18n";
import { postIn } from "@/lib/posts";

export const revalidate = 3600;
const x = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

export async function generateStaticParams() {
  return (await getEnabledLanguages()).map((l) => ({ locale: l.code }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [posts, settings] = await Promise.all([getPosts(), getSettings()]);
  const items = posts
    .filter((p) => postIn(p, locale))
    .slice(0, 50)
    .map((p) => {
      const url = abs(`/${locale}/insights/${p.slug[locale]}`);
      return `<item><title>${x(tr(p.title, locale))}</title><link>${url}</link><guid isPermaLink="true">${url}</guid>${p.publish_at ? `<pubDate>${new Date(p.publish_at).toUTCString()}</pubDate>` : ""}<description>${x(tr(p.excerpt, locale))}</description></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${x(tr(settings.brand.name, locale))} – Insights</title><link>${abs(`/${locale}/insights`)}</link><description>${x(tr(settings.seo.default_description, locale))}</description><language>${locale}</language><atom:link href="${abs(`/${locale}/insights/rss.xml`)}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
