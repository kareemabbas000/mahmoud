import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { serviceClient } from "@/lib/supabase/clients";
import { serverEnv } from "@/lib/env";
import { isKnownTag } from "@/lib/tags";

/**
 * On-demand cache invalidation for changes made outside the panel (pg_cron publishing scheduled posts,
 * SQL edits). POST {"tags": [...]} with header x-revalidate-secret.
 * The secret is REVALIDATE_SECRET if set, otherwise the one stored in private.app_config (checked
 * through a service-role-only RPC), so nothing has to be copied into Vercel by hand.
 */
export const dynamic = "force-dynamic";

let okCache: { secret: string; at: number } | null = null;

async function secretOk(given: string): Promise<boolean> {
  if (given.length < 32 || given.length > 200) return false;
  const env = serverEnv().revalidateSecret;
  if (env) {
    const a = Buffer.from(given);
    const b = Buffer.from(env);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  if (okCache && okCache.secret === given && Date.now() - okCache.at < 10 * 60_000) return true;
  const sb = serviceClient();
  if (!sb) return false;
  const { data } = await sb.rpc("revalidate_secret_ok", { p_secret: given });
  if (data === true) okCache = { secret: given, at: Date.now() };
  return data === true;
}

export async function POST(req: Request) {
  if (!(await secretOk(req.headers.get("x-revalidate-secret") ?? ""))) return Response.json({ ok: false }, { status: 401 });
  let tags: unknown;
  try {
    tags = ((await req.json()) as { tags?: unknown }).tags;
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const list = (Array.isArray(tags) ? tags : []).filter(isKnownTag).slice(0, 100) as string[];
  for (const t of new Set(list)) revalidateTag(t, "max");
  return Response.json({ ok: true, revalidated: list.length });
}
