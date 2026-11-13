/**
 * Whether this deployment may be indexed. Only the real production site should be: preview deployments and
 * secondary projects (e.g. a test copy on *.vercel.app) would otherwise compete with it as duplicate content.
 * Set SITE_INDEXING=off on any Vercel project that isn't the public site.
 */
export const indexingAllowed = () =>
  process.env.SITE_INDEXING !== "off" && (process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true);
