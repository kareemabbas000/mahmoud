import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const production = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;
  return production
    ? { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/*/newsletter/"] }], sitemap: abs("/sitemap.xml"), host: abs("/") }
    : { rules: [{ userAgent: "*", disallow: "/" }] }; // preview deployments are never indexed
}
