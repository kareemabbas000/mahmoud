/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/admin/auth";
import { sessionClient } from "@/lib/supabase/clients";
import { RichText } from "@/components/site/RichText";
import type { RichDoc } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preview", robots: { index: false, follow: false } };

/** Staff-only preview of a post (drafts included), styled like the public article. */
export default async function PreviewPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { id } = await params;
  const { lang: q } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  await requirePage("viewer");
  const sb = (await sessionClient())!;
  const [{ data: p }, { data: langs }] = await Promise.all([sb.from("posts").select("*").eq("id", id).maybeSingle(), sb.from("languages").select("code,dir,native_name").eq("enabled", true).order("sort")]);
  if (!p) notFound();
  const lang = (langs ?? []).find((l) => l.code === q) ?? (langs ?? [])[0] ?? { code: "ar", dir: "rtl", native_name: "العربية" };
  const L = (o: Record<string, string> | null | undefined) => o?.[lang.code] ?? "";
  const faqs = ((p.faqs ?? {}) as Record<string, { q: string; a: string }[]>)[lang.code] ?? [];
  const live = p.status !== "draft" && p.publish_at && new Date(p.publish_at) <= new Date();
  return (
    <div lang={lang.code} dir={lang.dir} className="site min-h-dvh bg-paper">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-center gap-3 bg-ink px-4 py-2 text-center text-xs text-paper">
        <span>{lang.code === "ar" ? "معاينة — " : "Preview — "}{live ? (lang.code === "ar" ? "المقال منشور" : "this post is live") : lang.code === "ar" ? "غير ظاهر للزوار" : "not visible to visitors"}</span>
        {(langs ?? []).map((l) => (
          <a key={l.code} href={`?lang=${l.code}`} className={`rounded-full px-2.5 py-0.5 ${l.code === lang.code ? "bg-paper text-ink" : "text-paper/80 hover:text-paper"}`}>{l.native_name}</a>
        ))}
      </div>
      <article className="container-x max-w-3xl py-14">
        <h1 className="display d-1">{L(p.title) || "—"}</h1>
        {L(p.excerpt) && <p className="lede mt-5">{L(p.excerpt)}</p>}
        {p.cover && <img src={p.cover} alt={L(p.cover_alt)} className="mt-10 w-full rounded-2xl" />}
        <RichText doc={(p.body as Record<string, RichDoc>)?.[lang.code]} className="mt-10" />
        {faqs.length > 0 && (
          <section className="mt-14 border-t border-rule pt-10">
            <h2 className="display d-3">{lang.code === "ar" ? "أسئلة شائعة" : "FAQ"}</h2>
            <div className="prose-sco mt-6 grid gap-3">
              {faqs.map((f, i) => (
                <details key={i} className="rt-toggle">
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
