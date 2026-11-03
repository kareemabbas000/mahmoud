/** Centralised env access. Nothing here throws: missing values degrade gracefully. */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")).replace(/\/$/, ""),
};

export const serverEnv = () => ({
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  ownerEmail: (process.env.OWNER_EMAIL ?? "").trim().toLowerCase(),
  resendKey: process.env.RESEND_API_KEY ?? "",
  mailFrom: process.env.MAIL_FROM ?? "SCO <onboarding@resend.dev>",
  ipSalt: process.env.IP_HASH_SALT ?? "sco-default-salt",
  metaCapiToken: process.env.META_CAPI_ACCESS_TOKEN ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
  revalidateSecret: process.env.REVALIDATE_SECRET ?? "",
});

export const hasSupabase = () => Boolean(env.supabaseUrl && env.supabaseAnonKey);
