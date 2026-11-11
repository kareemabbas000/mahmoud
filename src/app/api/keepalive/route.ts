import { publicClient } from "@/lib/supabase/clients";
import { serverEnv } from "@/lib/env";

/**
 * Called once a day by Vercel Cron (vercel.json; Hobby allows daily jobs). Supabase pauses Free projects
 * after a week without activity, and this site is so well cached that it can go a week without querying
 * the database. One tiny read a day keeps the project awake: about 30 invocations a month.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = serverEnv().cronSecret;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("unauthorized", { status: 401 });
  const sb = publicClient();
  if (!sb) return Response.json({ ok: false, reason: "supabase not configured" });
  const { error } = await sb.from("languages").select("code").limit(1);
  return Response.json({ ok: !error, at: new Date().toISOString() }, { status: error ? 503 : 200 });
}
