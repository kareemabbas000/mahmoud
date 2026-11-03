"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { z } from "zod";
import { sessionClient, serviceClient } from "@/lib/supabase/clients";
import { env, serverEnv } from "@/lib/env";

export type AuthState = { ok?: boolean; error?: string; message?: string };
const callback = (next: string) => `${env.siteUrl}/admin/auth/callback?next=${encodeURIComponent(next)}`;

export async function setAdminLocale(locale: "ar" | "en") {
  (await cookies()).set("admin_locale", locale, { path: "/admin", maxAge: 31536000, sameSite: "lax" });
}

export async function signIn(_p: AuthState, fd: FormData): Promise<AuthState> {
  const sb = await sessionClient();
  if (!sb) return { error: "not_configured" };
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: "invalid_credentials" };
  redirect("/admin");
}

export async function sendMagicLink(_p: AuthState, fd: FormData): Promise<AuthState> {
  const sb = await sessionClient();
  if (!sb) return { error: "not_configured" };
  const email = String(fd.get("email") ?? "").trim();
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: callback("/admin") } });
  if (error) return { error: error.status === 429 ? "rate_limited" : "generic" };
  return { ok: true, message: "link_sent" };
}

/** Owner bootstrap: only the configured OWNER_EMAIL may request the first sign-in link; the DB trigger grants ownership once. */
export async function requestOwnerLink(_p: AuthState, fd: FormData): Promise<AuthState> {
  const sb = await sessionClient();
  if (!sb) return { error: "not_configured" };
  const owner = serverEnv().ownerEmail;
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!owner) return { error: "owner_env_missing" };
  // Same response whether or not it matches, so the owner address can't be probed.
  if (email === owner) {
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: callback("/admin/set-password") } });
    if (error) return { error: error.status === 429 ? "rate_limited" : "generic" };
  }
  return { ok: true, message: "owner_link_sent" };
}

export async function requestReset(_p: AuthState, fd: FormData): Promise<AuthState> {
  const sb = await sessionClient();
  if (!sb) return { error: "not_configured" };
  const email = String(fd.get("email") ?? "").trim();
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: callback("/admin/set-password") });
  if (error && error.status === 429) return { error: "rate_limited" };
  return { ok: true, message: "reset_sent" };
}

export async function setPassword(_p: AuthState, fd: FormData): Promise<AuthState> {
  const sb = await sessionClient();
  if (!sb) return { error: "not_configured" };
  const password = String(fd.get("password") ?? "");
  const name = String(fd.get("full_name") ?? "").trim();
  if (password.length < 10) return { error: "weak_password" };
  const { data, error } = await sb.auth.updateUser({ password });
  if (error || !data.user) return { error: "generic" };
  if (name) await sb.from("profiles").update({ full_name: name }).eq("id", data.user.id);
  redirect("/admin");
}

const acceptSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), full_name: z.string().trim().min(2).max(120), password: z.string().min(10).max(200) });

export async function acceptInvitation(_p: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = acceptSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues.some((i) => i.path[0] === "password") ? "weak_password" : "generic" };
  const admin = serviceClient();
  const sb = await sessionClient();
  if (!admin || !sb) return { error: "not_configured" };
  const hash = createHash("sha256").update(parsed.data.token).digest("hex");
  const { data: inv } = await admin.from("invitations").select("id,email,expires_at,accepted_at,revoked_at").eq("token_hash", hash).maybeSingle();
  if (!inv || inv.accepted_at || inv.revoked_at || new Date(inv.expires_at) < new Date()) return { error: "invalid_invite" };
  const { error } = await admin.auth.admin.createUser({ email: inv.email, password: parsed.data.password, email_confirm: true, user_metadata: { full_name: parsed.data.full_name } });
  if (error) return { error: /registered|exists/i.test(error.message) ? "already_registered" : "generic" };
  // The DB trigger assigned the invited role and marked the invitation accepted.
  await sb.auth.signInWithPassword({ email: inv.email, password: parsed.data.password });
  const { data: u } = await sb.auth.getUser();
  if (u.user) await sb.from("profiles").update({ full_name: parsed.data.full_name }).eq("id", u.user.id);
  redirect("/admin");
}

export async function signOut() {
  const sb = await sessionClient();
  await sb?.auth.signOut();
  redirect("/admin/login");
}
