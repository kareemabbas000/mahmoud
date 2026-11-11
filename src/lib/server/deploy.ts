import "server-only";

/**
 * Triggers a fresh deployment for changes that are baked in at build time (new languages, panel redirects).
 * VERCEL_DEPLOY_HOOK_URL may hold several comma-separated hook URLs (one per Vercel project).
 * Returns false when no hook is configured, so the panel can tell the editor to redeploy manually.
 */
export async function triggerDeploy(reason: string): Promise<boolean> {
  const hooks = (process.env.VERCEL_DEPLOY_HOOK_URL ?? "").split(",").map((s) => s.trim()).filter((s) => /^https:\/\/api\.vercel\.com\//.test(s));
  if (!hooks.length) return false;
  const results = await Promise.allSettled(hooks.map((u) => fetch(u, { method: "POST", signal: AbortSignal.timeout(5000) })));
  const ok = results.some((r) => r.status === "fulfilled" && r.value.ok);
  if (!ok) console.warn("[deploy] hook failed for", reason);
  return ok;
}
