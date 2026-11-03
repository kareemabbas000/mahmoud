import type { Metadata } from "next";
import Link from "next/link";
import { serviceClient } from "@/lib/supabase/clients";
import { getSite } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

export default async function Confirm({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string }> }) {
  const { locale } = await params;
  const { token } = await searchParams;
  const site = await getSite(locale);
  let ok = false;
  const sb = serviceClient();
  if (sb && token && /^[a-f0-9]{64}$/.test(token)) {
    const { data } = await sb.from("newsletter_subscribers").update({ status: "confirmed", confirmed_at: new Date().toISOString(), confirm_token: null }).eq("confirm_token", token).select("id");
    ok = Boolean(data?.length);
  }
  return (
    <section className="container-x grid min-h-[50vh] place-items-center py-24 text-center">
      <div>
        <h1 className="display d-2">{ok ? site.t("newsletter.confirmed") : site.t("newsletter.invalid")}</h1>
        <Link href={`/${locale}`} className="btn btn-primary mt-8">{site.t("404.home")}</Link>
      </div>
    </section>
  );
}
