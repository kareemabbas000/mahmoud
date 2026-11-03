"use server";

import { revalidatePath } from "next/cache";
import { requireAction, ForbiddenError } from "@/lib/admin/auth";
import { esc, mailLayout, sendMail } from "@/lib/server/mail";
import type { Result } from "./admin";

const STATUSES = ["new", "in_progress", "replied", "closed", "spam"] as const;

async function guard<T>(min: "viewer" | "editor" | "admin", fn: (sb: Awaited<ReturnType<typeof requireAction>>["sb"], staff: Awaited<ReturnType<typeof requireAction>>["staff"]) => Promise<Result<T>>): Promise<Result<T>> {
  try {
    const { sb, staff } = await requireAction(min);
    return await fn(sb, staff);
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: "forbidden" };
    return { ok: false, error: "generic", detail: (e as Error).message };
  }
}

export async function setEnquiryStatus(id: string, status: string): Promise<Result> {
  if (!STATUSES.includes(status as never)) return { ok: false, error: "validation" };
  return guard("editor", async (sb) => {
    const { data, error } = await sb.from("enquiries").update({ status }).eq("id", id).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    revalidatePath("/admin/enquiries");
    return { ok: true };
  });
}

export async function saveEnquiryNotes(id: string, notes: string): Promise<Result> {
  return guard("editor", async (sb) => {
    const { data, error } = await sb.from("enquiries").update({ notes: notes.slice(0, 5000) }).eq("id", id).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    return { ok: true };
  });
}

export async function replyToEnquiry(id: string, subject: string, body: string): Promise<Result<{ delivery: string }>> {
  return guard("editor", async (sb, staff) => {
    const { data: e } = await sb.from("enquiries").select("email,name,locale").eq("id", id).maybeSingle();
    if (!e) return { ok: false, error: "blocked" };
    if (!e.email) return { ok: false, error: "validation", detail: "This enquiry has no email address — reply by phone or WhatsApp." };
    if (subject.trim().length < 2 || body.trim().length < 2) return { ok: false, error: "validation", detail: "Subject and message are required." };
    const rtl = e.locale === "ar";
    const r = await sendMail({
      to: e.email,
      subject,
      replyTo: staff.email,
      html: mailLayout(subject, `<p>${esc(rtl ? `السيد/ة ${e.name}،` : `Dear ${e.name},`)}</p><div style="white-space:pre-wrap;line-height:1.7">${esc(body)}</div>`, rtl ? "rtl" : "ltr"),
    });
    const delivery = r.ok ? "sent" : "failed";
    const { data, error } = await sb
      .from("enquiry_replies")
      .insert({ enquiry_id: id, subject, body, delivery, provider_id: r.ok ? r.id : null, error: r.ok ? null : r.error })
      .select("id");
    if (error || !data?.length) return { ok: false, error: error ? "generic" : "blocked", detail: error?.message };
    if (r.ok) await sb.from("enquiries").update({ status: "replied" }).eq("id", id);
    revalidatePath(`/admin/enquiries/${id}`);
    if (!r.ok) return { ok: false, error: "generic", detail: `Saved, but the email was not sent: ${r.error}` };
    return { ok: true, data: { delivery } };
  });
}

export async function cvLink(path: string): Promise<Result<{ url: string }>> {
  return guard("editor", async (sb) => {
    const { data, error } = await sb.storage.from("cvs").createSignedUrl(path, 300);
    if (error || !data) return { ok: false, error: "forbidden", detail: error?.message };
    return { ok: true, data: { url: data.signedUrl } };
  });
}

export async function deleteEnquiry(id: string): Promise<Result> {
  return guard("admin", async (sb) => {
    const { data, error } = await sb.from("enquiries").delete().eq("id", id).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    revalidatePath("/admin/enquiries");
    return { ok: true };
  });
}

export async function setSubscriberStatus(id: string, status: "confirmed" | "unsubscribed"): Promise<Result> {
  return guard("admin", async (sb) => {
    const { data, error } = await sb
      .from("newsletter_subscribers")
      .update({ status, ...(status === "unsubscribed" ? { unsubscribed_at: new Date().toISOString() } : {}) })
      .eq("id", id)
      .select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    revalidatePath("/admin/newsletter");
    return { ok: true };
  });
}

export async function deleteSubscriber(id: string): Promise<Result> {
  return guard("admin", async (sb) => {
    const { data, error } = await sb.from("newsletter_subscribers").delete().eq("id", id).select("id");
    if (error) return { ok: false, error: "generic", detail: error.message };
    if (!data?.length) return { ok: false, error: "blocked" };
    revalidatePath("/admin/newsletter");
    return { ok: true };
  });
}
