import "server-only";
import { serverEnv } from "@/lib/env";
import { getTracking } from "@/lib/data";
import { sha256 } from "./security";

/** Meta Conversions API (server-side), deduplicated with the browser Pixel via event_id. Only runs when enabled and consented. */
export async function metaEvent(e: {
  name: "Lead" | "CompleteRegistration" | "SubmitApplication";
  eventId: string;
  url: string;
  ip: string;
  ua: string;
  email?: string | null;
  phone?: string | null;
  consent: boolean;
}) {
  if (!e.consent) return;
  const tr = await getTracking();
  const token = serverEnv().metaCapiToken;
  if (!tr.meta_capi_enabled || !tr.meta_pixel_id || !token) return;
  const user_data: Record<string, unknown> = { client_ip_address: e.ip, client_user_agent: e.ua };
  if (e.email) user_data.em = [sha256(e.email)];
  if (e.phone) user_data.ph = [sha256(e.phone.replace(/\D/g, ""))];
  try {
    await fetch(`https://graph.facebook.com/v21.0/${tr.meta_pixel_id}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [{ event_name: e.name, event_time: Math.floor(Date.now() / 1000), event_id: e.eventId, action_source: "website", event_source_url: e.url, user_data }] }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    /* tracking must never break a form submission */
  }
}
