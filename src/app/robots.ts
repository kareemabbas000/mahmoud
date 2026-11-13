import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo";
import { indexingAllowed } from "@/lib/indexing";

/**
 * Search engines and AI answer engines are welcome on public pages (that's where readers come from);
 * private areas and form endpoints are off-limits; heavy scrapers that send no visitors are refused to save
 * bandwidth (each request costs Vercel edge requests). See docs/SEO.md.
 */
const PRIVATE = ["/admin", "/api/", "/*/newsletter/", "/*/sco-preview/"];
const ANSWER_ENGINES = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "Bingbot", "DuckAssistBot", "Meta-ExternalAgent"];
const NO_VALUE_SCRAPERS = ["Bytespider", "MJ12bot", "DotBot", "BLEXBot", "PetalBot", "DataForSeoBot", "img2dataset"];

export default function robots(): MetadataRoute.Robots {
  if (!indexingAllowed()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: ANSWER_ENGINES, allow: ["/", "/llms.txt"], disallow: PRIVATE },
      { userAgent: NO_VALUE_SCRAPERS, disallow: "/" },
    ],
    sitemap: abs("/sitemap.xml"),
    host: abs("/"),
  };
}
