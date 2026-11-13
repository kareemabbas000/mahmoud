# SEO and discoverability

The blog is the main traffic source. This document is the contract for technical and on-page SEO, and for being found by AI answer engines. It covers what exists, where it lives, and the rules for keeping it right. The cost side (staying light for bots) is in [`GUARDRAILS.md`](GUARDRAILS.md).

## 1. Crawling and indexing

| Item | Where | Behaviour |
|---|---|---|
| `robots.txt` | `src/app/robots.ts` | Search engines and AI answer engines (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, Bingbot …) are allowed on public pages. `/admin`, `/api`, newsletter endpoints and previews are disallowed. A few heavy scrapers that send no visitors are refused, to save edge requests. |
| Indexing switch | `src/lib/indexing.ts` | Only the real production site is indexable. **Set `SITE_INDEXING=off` on the `sco-test` Vercel project** (and any copy). It then serves `Disallow: /`, `noindex` meta tags and an empty sitemap, so it never competes with the real site as duplicate content. Preview deployments are always noindexed. |
| Sitemap | `src/app/sitemap.ts` | One URL per language with hreflang alternates and `x-default`. Includes services, team profiles, block pages, non-empty category archives and posts (with cover images). `lastModified` is only set where it's real (posts, categories, the insights index). Excludes legal pages and posts marked noindex. Static; refreshed by tags. |
| `llms.txt` | `src/app/llms.txt/route.ts` | Markdown map for AI assistants (llmstxt.org): who the firm is, contact, services with summaries, key pages, the latest 40 posts per language with excerpts, FAQ pointer, sitemap and RSS. Static; refreshed by tags. |
| RSS | `/[lang]/insights/rss.xml` | The latest 50 posts per language. Linked from every page's `<head>`. |
| Canonical + hreflang | `lib/seo.ts` `pageMeta()` | Every page has a canonical URL and alternates for each language that has the content, plus `x-default`. A post links only to languages it's translated into. |
| Legacy URLs | `content/redirects.json` + panel redirects | 301s from the old WordPress site and from changed slugs. |
| Junk URLs | `[locale]/layout.tsx` `dynamicParams=false` | Bot probes (`/wp-login.php`, `/.env`) get a static 404. |

## 2. On-page (every page)

- **Title and meta description:** each page and post has its own (Page builder → Page & SEO; Post → SEO). Defaults come from Settings → Default SEO.
- **Open Graph and Twitter:** `og:title`/`og:description` (posts can override them for social), `og:image` with alt text, `og:locale` plus alternates, article published/modified time, section, tags and author.
  - Default share cards are `/og/ar.jpg` and `/og/en.jpg` (1200×630, about 60 kB each; WhatsApp ignores images over about 300 kB).
  - For posts, upload a cover in **1200×630** (it becomes the share image).
- **Structured data (JSON-LD):**
  - every page: Organization/ProfessionalService + WebSite;
  - posts: **BlogPosting** (headline, description, dates, image, author Person linked to their team profile, publisher, section, keywords, word count), **BreadcrumbList** and **FAQPage** when the post has questions;
  - lists: **Blog** / **CollectionPage** with their posts;
  - services: Service; team profiles: Person; the FAQ page: FAQPage.
- **Headings:** one H1 per page (the title). The editor offers only H2–H4. The table of contents and `#h-n` anchors come from the same numbering (`rich.ts` `docHeadings` = `RichText.tsx`).
- **Images:** alt text per language (the media library and every image field); responsive `srcset`; lazy-loaded except the hero and cover; explicit sizes.
- **Speed (Core Web Vitals):**
  - static HTML from the CDN;
  - fonts self-hosted;
  - heavy scripts lazy-loaded;
  - CSS-only reading progress;
  - `preconnect` to the image origin;
  - no layout-shifting embeds (fixed aspect ratios).

## 3. The blog workflow (what the editor enforces)

The **SEO tab** scores every post live (0–100) with these checks:
- focus keyphrase present, in the SEO title (and at its start), meta description, slug, introduction, a subheading and image alt text;
- keyphrase density, and whether it's already used by another post;
- secondary keyphrases used;
- SEO title length (characters and pixels) and meta description length;
- word count, internal links, outbound links, images with alt text, cover, excerpt, slug length.

The **Readability** score checks:
- H2 structure and heading order;
- spacing between headings;
- sentence and paragraph length;
- lists or tables in long posts.

The SEO tab also shows **previews**: Google (desktop and mobile) and the social share card.

**Advanced settings:** social title and description, share image, canonical URL, noindex.

**Publishing:** draft (autosaved), publish now, or schedule (goes live within a minute through `pg_cron`). Every save keeps a revision (the History tab).

**Before publishing a money article:**
1. The SEO score is green (≥ 75) and readability is at least orange.
2. The focus keyphrase is unique to the post. Secondary keyphrases cover synonyms.
3. The cover is 1200×630, with alt text describing it.
4. There are 2+ internal links (services, related posts), and 1+ outbound link to an authoritative source.
5. There's a Key takeaways box near the top. FAQ entries answer real questions (this gives a FAQPage rich result).
6. The author is set, and linked to a team profile (supports E-E-A-T).
7. The category is set, so it appears in its archive and the related-posts logic.

## 4. Rules for future changes

- New public routes must call `pageMeta()` (canonical + hreflang + OG) and stay static (`●`/`○` in the build output).
- New content types must be added to the sitemap and, if useful to AI answers, to `llms.txt`, with the right cache tags.
- Never noindex a page by removing it from the sitemap alone: use `noindex` in metadata (pages and posts have the switch).
- Don't change post or category slugs casually. If you must, add a 301 in Redirects.
- Keep JSON-LD truthful: only facts shown on the page.
