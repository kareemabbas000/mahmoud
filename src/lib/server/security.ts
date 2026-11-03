import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { serverEnv } from "@/lib/env";
import { serviceClient } from "@/lib/supabase/clients";

export async function clientMeta() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("x-real-ip") || "0.0.0.0";
  return {
    ip,
    ipHash: createHash("sha256").update(serverEnv().ipSalt + ip).digest("hex").slice(0, 32),
    ua: (h.get("user-agent") ?? "").slice(0, 300),
    referer: (h.get("referer") ?? "").slice(0, 500),
  };
}

const mem = new Map<string, { n: number; t: number }>();

/** Returns true when the caller is within the limit. Uses a DB counter (shared across instances) with in-memory fallback. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const sb = serviceClient();
  if (sb) {
    const { data, error } = await sb.rpc("hit_rate_limit", { p_key: key, p_limit: limit, p_window_seconds: windowSec });
    if (!error) return Boolean(data);
  }
  const now = Date.now();
  const cur = mem.get(key);
  if (!cur || now - cur.t > windowSec * 1000) {
    mem.set(key, { n: 1, t: now });
    return true;
  }
  cur.n += 1;
  return cur.n <= limit;
}

export const sha256 = (s: string) => createHash("sha256").update(s.trim().toLowerCase()).digest("hex");
export const token = () => createHash("sha256").update(crypto.randomUUID() + Date.now()).digest("hex");
