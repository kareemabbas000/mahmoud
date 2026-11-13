"use server";

import { z } from "zod";
import { after } from "next/server";
import { serviceClient } from "@/lib/supabase/clients";
import { clientMeta, rateLimit, token } from "@/lib/server/security";
import { esc, mailLayout, sendMail } from "@/lib/server/mail";
import { metaEvent } from "@/lib/server/capi";
import { getServices, getSettings } from "@/lib/data";
import { env } from "@/lib/env";
import { prettyPhone } from "@/lib/i18n";

/** `values` echoes what the visitor typed back to the form when something fails (React 19 resets forms after an action). */
export type FormState = { ok: boolean; error?: "generic" | "rate" | "validation"; fields?: Record<string, string>; eventId?: string; values?: Record<string, string> };

const KEEP = ["name", "phone", "email", "company", "service", "message", "job_title"] as const;
const echo = (fd: FormData) => Object.fromEntries(KEEP.map((k) => [k, String(fd.get(k) ?? "").slice(0, 5000)]));

const phoneRe = /^\+?[\d\s()-]{7,20}$/;
const MIN_FILL_MS = 2500;

function botCheck(fd: FormData): boolean {
  if (String(fd.get("website") ?? "").trim() !== "") return true; // honeypot
  const ts = Number(fd.get("ts") ?? 0);
  return !ts || Date.now() - ts < MIN_FILL_MS;
}

const enquirySchema = z.object({
  kind: z.enum(["contact", "consultation"]),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(phoneRe),
  email: z.union([z.literal(""), z.string().trim().email().max(200)]),
  company: z.string().trim().max(160).optional().default(""),
  service: z.string().trim().max(80).optional().default(""),
  message: z.string().trim().min(5).max(5000),
  consent: z.literal("on"),
  locale: z.string().max(10),
  page: z.string().max(500).optional().default(""),
  event_id: z.string().max(80).optional().default(""),
  marketing_consent: z.string().optional(),
});

function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "form");
    if (out[k]) continue;
    out[k] = k === "email" ? "email" : k === "phone" ? "phone" : k === "consent" ? "consent" : k === "cv" ? "file" : "required";
  }
  return out;
}

export async function submitEnquiry(_prev: FormState, fd: FormData): Promise<FormState> {
  if (botCheck(fd)) return { ok: true }; // silently accept bots
  const parsed = enquirySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "validation", fields: fieldErrors(parsed.error), values: echo(fd) };
  const d = parsed.data;
  const meta = await clientMeta();
  if (!(await rateLimit(`enquiry:${meta.ipHash}`, 5, 600))) return { ok: false, error: "rate", values: echo(fd) };

  const sb = serviceClient();
  if (!sb) {
    console.error("[enquiry] SUPABASE_SERVICE_ROLE_KEY not set — cannot store enquiry");
    return { ok: false, error: "generic", values: echo(fd) };
  }
  const { data: row, error } = await sb
    .from("enquiries")
    .insert({
      kind: d.kind,
      name: d.name,
      phone: d.phone,
      email: d.email || null,
      company: d.company || null,
      service: d.service || null,
      message: d.message,
      locale: d.locale,
      source_url: d.page || meta.referer,
      ip_hash: meta.ipHash,
      user_agent: meta.ua,
    })
    .select("id")
    .single();
  if (error || !row) {
    console.error("[enquiry] insert failed", error?.message);
    return { ok: false, error: "generic", values: echo(fd) };
  }

  const eventId = d.event_id || row.id;
  after(async () => {
    const [settings, services] = await Promise.all([getSettings(), getServices()]);
    const svc = services.find((s) => s.slug === d.service);
    const body = `<table style="font-size:14px;line-height:1.6">
<tr><td style="color:#525874;padding-inline-end:12px">Name</td><td>${esc(d.name)}</td></tr>
<tr><td style="color:#525874">Phone</td><td dir="ltr">${esc(prettyPhone(d.phone))}</td></tr>
${d.email ? `<tr><td style="color:#525874">Email</td><td>${esc(d.email)}</td></tr>` : ""}
${d.company ? `<tr><td style="color:#525874">Company</td><td>${esc(d.company)}</td></tr>` : ""}
<tr><td style="color:#525874">Service</td><td>${esc(svc?.name.en ?? d.service ?? "General")}</td></tr>
<tr><td style="color:#525874">Language</td><td>${esc(d.locale)}</td></tr></table>
<p style="white-space:pre-wrap;border-inline-start:3px solid #fc4e08;padding:8px 12px;background:#f5f6fa">${esc(d.message)}</p>
<p><a href="${env.siteUrl}/admin/enquiries/${row.id}" style="color:#04019f">Open in the control panel →</a></p>`;
    const r = await sendMail({ to: settings.contact.notify_email, subject: `New ${d.kind} request — ${d.name}`, html: mailLayout("New website enquiry", body), replyTo: d.email || undefined });
    if (!r.ok) console.warn("[enquiry] notification email not sent:", r.error);
    await metaEvent({ name: "Lead", eventId, url: d.page, ip: meta.ip, ua: meta.ua, email: d.email, phone: d.phone, consent: d.marketing_consent === "1" });
  });
  return { ok: true, eventId };
}

const careerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(phoneRe),
  email: z.string().trim().email().max(200),
  job_title: z.string().trim().min(2).max(160),
  message: z.string().trim().max(3000).optional().default(""),
  consent: z.literal("on"),
  locale: z.string().max(10),
  page: z.string().max(500).optional().default(""),
  event_id: z.string().max(80).optional().default(""),
  marketing_consent: z.string().optional(),
});

const CV_TYPES: Record<string, { ext: string; magic: number[][] }> = {
  "application/pdf": { ext: "pdf", magic: [[0x25, 0x50, 0x44, 0x46]] },
  "application/msword": { ext: "doc", magic: [[0xd0, 0xcf, 0x11, 0xe0]] },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { ext: "docx", magic: [[0x50, 0x4b, 0x03, 0x04]] },
};

export async function submitCareer(_prev: FormState, fd: FormData): Promise<FormState> {
  if (botCheck(fd)) return { ok: true };
  const { cv, ...rest } = Object.fromEntries(fd);
  const parsed = careerSchema.safeParse(rest);
  const file = cv instanceof File ? cv : null;
  const type = file ? CV_TYPES[file.type] : undefined;
  let fileOk = Boolean(file && type && file.size > 0 && file.size <= 5 * 1024 * 1024);
  let bytes: Uint8Array | null = null;
  if (fileOk && file && type) {
    bytes = new Uint8Array(await file.arrayBuffer());
    fileOk = type.magic.some((m) => m.every((b, i) => bytes![i] === b));
  }
  if (!parsed.success || !fileOk) {
    const fields = parsed.success ? {} : fieldErrors(parsed.error);
    if (!fileOk) fields.cv = "file";
    return { ok: false, error: "validation", fields, values: echo(fd) };
  }
  const d = parsed.data;
  const meta = await clientMeta();
  if (!(await rateLimit(`career:${meta.ipHash}`, 3, 3600))) return { ok: false, error: "rate" };
  const sb = serviceClient();
  if (!sb) return { ok: false, error: "generic" };

  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${type!.ext}`;
  const up = await sb.storage.from("cvs").upload(path, bytes!, { contentType: file!.type, upsert: false });
  if (up.error) {
    console.error("[career] upload failed", up.error.message);
    return { ok: false, error: "generic" };
  }
  const { data: row, error } = await sb
    .from("enquiries")
    .insert({ kind: "career", name: d.name, phone: d.phone, email: d.email, job_title: d.job_title, message: d.message || null, cv_path: path, locale: d.locale, source_url: d.page, ip_hash: meta.ipHash, user_agent: meta.ua })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: "generic" };
  const eventId = d.event_id || row.id;
  after(async () => {
    const settings = await getSettings();
    await sendMail({
      to: settings.contact.notify_email,
      subject: `New job application — ${d.name} (${d.job_title})`,
      html: mailLayout("New job application", `<p>${esc(d.name)} applied for <strong>${esc(d.job_title)}</strong>.</p><p dir="ltr">${esc(d.email)} · ${esc(prettyPhone(d.phone))}</p><p><a href="${env.siteUrl}/admin/enquiries/${row.id}">Open in the control panel →</a></p>`),
      replyTo: d.email,
    });
    await metaEvent({ name: "SubmitApplication", eventId, url: d.page, ip: meta.ip, ua: meta.ua, email: d.email, phone: d.phone, consent: d.marketing_consent === "1" });
  });
  return { ok: true, eventId };
}

const nlSchema = z.object({ email: z.string().trim().email().max(200), locale: z.string().max(10) });

export async function subscribeNewsletter(_prev: FormState, fd: FormData): Promise<FormState> {
  if (String(fd.get("website") ?? "") !== "") return { ok: true };
  const parsed = nlSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "validation", fields: { email: "email" } };
  const { email, locale } = parsed.data;
  const meta = await clientMeta();
  if (!(await rateLimit(`nl:${meta.ipHash}`, 5, 3600))) return { ok: false, error: "rate" };
  const sb = serviceClient();
  if (!sb) return { ok: false, error: "generic" };
  const confirmToken = token();
  const { data: existing } = await sb.from("newsletter_subscribers").select("id,status").eq("email", email.toLowerCase()).maybeSingle();
  if (existing?.status === "confirmed") return { ok: true };
  const { error } = await sb
    .from("newsletter_subscribers")
    .upsert({ email: email.toLowerCase(), locale, status: "pending", confirm_token: confirmToken, unsubscribe_token: token(), ip_hash: meta.ipHash }, { onConflict: "email" });
  if (error) return { ok: false, error: "generic" };
  const ar = locale === "ar";
  const link = `${env.siteUrl}/${locale}/newsletter/confirm?token=${confirmToken}`;
  const r = await sendMail({
    to: email,
    subject: ar ? "أكّد اشتراكك في نشرة SCO" : "Confirm your SCO newsletter subscription",
    html: mailLayout(
      ar ? "تأكيد الاشتراك" : "Confirm your subscription",
      `<p>${ar ? "اضغط الزر لتأكيد اشتراكك في النشرة البريدية للمكتب الاستشاري المتخصص." : "Click the button to confirm your subscription to the Specialized Consulting Office newsletter."}</p><p><a href="${link}" style="display:inline-block;background:#04019f;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">${ar ? "تأكيد الاشتراك" : "Confirm subscription"}</a></p><p style="font-size:12px;color:#525874">${ar ? "إذا لم تطلب ذلك فتجاهل هذه الرسالة." : "If you didn't ask for this, ignore this email."}</p>`,
      ar ? "rtl" : "ltr",
    ),
  });
  if (!r.ok) console.warn("[newsletter] confirmation email not sent:", r.error);
  return { ok: true, eventId: crypto.randomUUID() };
}
