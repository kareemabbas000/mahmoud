import "server-only";
import { serverEnv } from "@/lib/env";

export type MailResult = { ok: true; id?: string } | { ok: false; error: string };

/** Sends through Resend's HTTP API. Without RESEND_API_KEY it reports not-configured (callers decide). */
export async function sendMail(m: { to: string | string[]; subject: string; html: string; replyTo?: string; text?: string }): Promise<MailResult> {
  const { resendKey, mailFrom } = serverEnv();
  if (!resendKey) return { ok: false, error: "Email is not configured (RESEND_API_KEY missing)." };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: mailFrom, to: m.to, subject: m.subject, html: m.html, text: m.text, reply_to: m.replyTo }),
      signal: AbortSignal.timeout(10000),
    });
    const j = (await r.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!r.ok) return { ok: false, error: j.message ?? `Resend HTTP ${r.status}` };
    return { ok: true, id: j.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function mailLayout(title: string, body: string, dir: "rtl" | "ltr" = "ltr") {
  return `<!doctype html><html dir="${dir}"><body style="margin:0;background:#f5f6fa;font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#1a1f3d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #dadde9;border-radius:8px">
<tr><td style="padding:24px 28px;border-bottom:3px solid #fc4e08"><strong style="font-size:20px;letter-spacing:.12em;color:#04019f">SCO</strong></td></tr>
<tr><td style="padding:28px"><h1 style="margin:0 0 16px;font-size:20px;color:#0b1033">${esc(title)}</h1>${body}</td></tr>
<tr><td style="padding:16px 28px;font-size:12px;color:#525874;border-top:1px solid #dadde9">Specialized Consulting Office · 92 Abdel Aziz Fahmy St., El Nozha, Cairo · info@sco-eg.com</td></tr>
</table></td></tr></table></body></html>`;
}
