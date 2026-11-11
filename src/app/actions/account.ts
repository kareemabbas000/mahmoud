"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getStaff } from "@/lib/admin/auth";
import { sessionClient } from "@/lib/supabase/clients";
import { clientMeta, rateLimit } from "@/lib/server/security";
import type { Result } from "./admin";

/** Every signed-in staff member manages their own account here (any role). */

export async function updateMyName(name: string): Promise<Result> {
  const staff = await getStaff();
  const sb = await sessionClient();
  if (!staff || !sb) return { ok: false, error: "forbidden" };
  const n = name.trim();
  if (n.length < 2 || n.length > 120) return { ok: false, error: "validation", detail: "name: 2–120 characters" };
  const { error } = await sb.from("profiles").update({ full_name: n }).eq("id", staff.id);
  if (error) return { ok: false, error: "generic", detail: error.message };
  await sb.auth.updateUser({ data: { full_name: n } });
  return { ok: true };
}

const pwSchema = z.object({ current: z.string().min(1).max(200), next: z.string().min(10).max(200) });

/** Re-checks the current password before changing it, so an open session alone can't take over the account. */
export async function changeMyPassword(current: string, next: string): Promise<Result> {
  const staff = await getStaff();
  const sb = await sessionClient();
  if (!staff || !sb) return { ok: false, error: "forbidden" };
  const parsed = pwSchema.safeParse({ current, next });
  if (!parsed.success) return { ok: false, error: "validation", detail: "weak_password" };
  if (next === current) return { ok: false, error: "validation", detail: "same_password" };
  const { ipHash } = await clientMeta();
  if (!(await rateLimit(`auth:pwchange:${ipHash}`, 5, 900))) return { ok: false, error: "validation", detail: "rate_limited" };
  const check = await sb.auth.signInWithPassword({ email: staff.email, password: current });
  if (check.error) return { ok: false, error: "validation", detail: "wrong_password" };
  const { error } = await sb.auth.updateUser({ password: next });
  if (error) return { ok: false, error: "validation", detail: /weak|pwned|leaked/i.test(error.message) ? "weak_password" : error.message };
  return { ok: true };
}

/** Signs this account out on every device (including this one). */
export async function signOutEverywhere(): Promise<void> {
  const sb = await sessionClient();
  await sb?.auth.signOut({ scope: "global" });
  redirect("/admin/login");
}
