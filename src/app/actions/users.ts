"use server";

import { createHash, randomBytes } from "node:crypto";
import { ForbiddenError, requireAction } from "@/lib/admin/auth";
import { serviceClient } from "@/lib/supabase/clients";
import { env } from "@/lib/env";
import { esc, mailLayout, sendMail } from "@/lib/server/mail";
import type { Role } from "@/lib/types";
import type { Result } from "./admin";

async function run<T>(fn: (ctx: Awaited<ReturnType<typeof requireAction>>) => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await fn(await requireAction("admin"));
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: "forbidden" };
    console.error("[users]", e);
    return { ok: false, error: "generic", detail: (e as Error).message };
  }
}
const ROLES: Role[] = ["viewer", "editor", "admin"];

/** Creates a 7-day invitation. Returns the link so it can also be shared directly if email isn't configured. */
export async function inviteUser(email: string, role: Role, ui: "ar" | "en"): Promise<Result<{ link: string; emailed: boolean }>> {
  return run(async ({ sb, staff }) => {
    const mail = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return { ok: false, error: "validation", detail: "email" };
    if (!ROLES.includes(role)) return { ok: false, error: "validation", detail: "role" };
    const { data: existing } = await sb.from("profiles").select("id").ilike("email", mail).maybeSingle();
    if (existing) return { ok: false, error: "validation", detail: ui === "ar" ? "هذا البريد لديه حساب بالفعل" : "This email already has an account" };
    const token = randomBytes(32).toString("hex");
    const token_hash = createHash("sha256").update(token).digest("hex");
    const { data, error } = await sb.from("invitations").insert({ email: mail, role, token_hash, invited_by: staff.id }).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    const link = `${env.siteUrl}/admin/accept?token=${token}`;
    const ar = ui === "ar";
    const r = await sendMail({
      to: mail,
      subject: ar ? "دعوة للانضمام إلى لوحة تحكم SCO" : "You're invited to the SCO control panel",
      html: mailLayout(
        ar ? "دعوة للانضمام" : "Invitation",
        `<p>${ar ? `دعاك ${esc(staff.full_name || staff.email)} للانضمام إلى لوحة تحكم موقع المكتب الاستشاري المتخصص.` : `${esc(staff.full_name || staff.email)} invited you to the Specialized Consulting Office website control panel.`}</p>
         <p><a href="${link}" style="display:inline-block;background:#2b2ff5;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">${ar ? "قبول الدعوة" : "Accept the invitation"}</a></p>
         <p style="color:#667">${ar ? "الرابط صالح لمدة 7 أيام." : "The link is valid for 7 days."}</p>`,
        ar ? "rtl" : "ltr",
      ),
    });
    return { ok: true, data: { link, emailed: r.ok } };
  });
}

export async function revokeInvite(id: string): Promise<Result> {
  return run(async ({ sb }) => {
    const { data, error } = await sb.from("invitations").update({ revoked_at: new Date().toISOString() }).eq("id", id).is("accepted_at", null).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    return { ok: true };
  });
}

export async function changeRole(id: string, role: Role): Promise<Result> {
  return run(async ({ sb }) => {
    if (!["viewer", "editor", "admin", "owner"].includes(role)) return { ok: false, error: "validation", detail: "role" };
    const { data, error } = await sb.from("profiles").update({ role }).eq("id", id).select("id");
    if (error) return { ok: false, error: "validation", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    return { ok: true };
  });
}

/** Removes a staff account entirely (auth user + profile). The owner can't be removed; you can't remove yourself. */
export async function removeUser(id: string): Promise<Result> {
  return run(async ({ sb, staff }) => {
    if (id === staff.id) return { ok: false, error: "validation", detail: "You can't remove your own account." };
    const { data: p } = await sb.from("profiles").select("role").eq("id", id).maybeSingle();
    if (!p) return { ok: false, error: "blocked" };
    if (p.role === "owner") return { ok: false, error: "validation", detail: "The owner account can't be removed." };
    const admin = serviceClient();
    if (!admin) return { ok: false, error: "generic", detail: "SUPABASE_SERVICE_ROLE_KEY is not configured." };
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return { ok: false, error: "generic", detail: error.message };
    return { ok: true };
  });
}

export async function updateMyName(full_name: string): Promise<Result> {
  try {
    const { sb, staff } = await requireAction("viewer");
    const name = full_name.trim().slice(0, 120);
    const { data, error } = await sb.from("profiles").update({ full_name: name || null }).eq("id", staff.id).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    return { ok: true };
  } catch {
    return { ok: false, error: "forbidden" };
  }
}
