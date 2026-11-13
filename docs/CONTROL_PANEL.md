# SCO control panel — guide

The panel lives at **`/admin`** and is fully bilingual (Arabic RTL / English). Every change is saved to Supabase and goes live on the site within seconds (only the pages that use it are refreshed). Redirects and new languages are applied by an automatic redeploy (about a minute) when `VERCEL_DEPLOY_HOOK_URL` is set.

## 1. Setup checklist (Vercel → Project → Settings → Environment Variables)

| Variable | Needed for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | everything | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | everything | public anon key (RLS protects the data) |
| `SUPABASE_SERVICE_ROLE_KEY` | accepting invitations, removing users | server-only, never exposed to the browser |
| `NEXT_PUBLIC_SITE_URL` | canonical URLs, sitemap, invitation links | e.g. `https://sco-eg.com` |
| `OWNER_EMAIL` | first sign-in becomes the owner | the owner's email |
| `RESEND_API_KEY`, `MAIL_FROM` | enquiry notifications, invitations, newsletter | without it invitation links can still be copied and shared |
| `IP_HASH_SALT` | anti-spam rate limiting | any long random string |
| `META_CAPI_ACCESS_TOKEN` | Meta Conversions API (optional) | only if enabled in Analytics & tracking |
| `CRON_SECRET` | protects the daily `/api/keepalive` cron (optional) | any long random string |
| `VERCEL_DEPLOY_HOOK_URL` | auto-redeploy after saving redirects, adding a language or changing the default language (optional) | Vercel → Settings → Git → Deploy Hooks; comma-separate one per project |
| `SITE_INDEXING` | set to `off` on every Vercel project that is **not** the public site (e.g. `sco-test`) | stops search engines indexing the copy as duplicate content |
| `REVALIDATE_SECRET` | `/api/revalidate` (optional) | if unset, the secret stored in the database is used |

Cost, speed and security rules for every future change are in [`GUARDRAILS.md`](GUARDRAILS.md).

In Supabase → Authentication → URL configuration, add `https://<your-domain>/admin/auth/callback` to the redirect URLs.

## 2. Roles

| Role | Can do |
|---|---|
| **Owner** | everything; can't be removed |
| **Admin** | all content, site settings, menus, languages, tracking, redirects, users, audit log, deletions |
| **Editor** | write and publish posts, pages and all content collections, upload media |
| **Viewer** | look around without editing |

Roles are enforced twice: in the panel and inside the database (row-level security), so a role can't be bypassed from the browser.

## 3. What each section manages

**Finding your way.** The sidebar is grouped by what you want to do: **Website** (pages, media, look, header & footer, menus), **Content** (posts and collections), **Inbox**, **Settings** and **People & security**. Press **Ctrl K** (⌘K on Mac) or **/** anywhere for quick search: type a word such as "colours", "password" or "image", in Arabic or English, and press Enter. On phones, the bottom bar has Home, Pages, Posts, Inbox and More.

- **Dashboard**: a "What would you like to do?" list of common tasks (each opens the right screen), plus new enquiries, subscribers, posts and translation coverage.
- **Pages**: visual page builder for every page, including the home page.
  - Add, reorder (drag and drop), duplicate, hide and delete sections.
  - Each section has its own form; every text field is per language.
  - The **live preview** shows the real site (header, footer, animations) on desktop, tablet or mobile. Click any section in the preview to edit it.
  - Changes autosave as a **draft** that visitors can't see. **Publish** makes them live, and the previous version is kept under **Versions** for one-click restore.
  - Undo / redo (Ctrl+Z / Ctrl+Y). Page title, SEO title and description with a Google preview, share image, noindex.
  - **New page** creates a custom page from a starter (blank, content page, service landing page) or from a saved template.
  - **Display options** (every section): show it on all devices, desktop only or mobile only, and give it an anchor (e.g. `pricing`) so menus and buttons can link to `#pricing`.
- **Insights (blog)**:
  - **Blocks** (press **/** or the + button):
    - paragraph, H2–H4, lists, checklist, quote, **pull quote with source**, four callouts plus a **Key takeaways** box, collapsible section, code, divider, table;
    - image, **image gallery** (2–4 columns, lightbox), **file download** (PDF or form), **highlighted figure** (big number + source), YouTube/Vimeo video or **Google map**, call-to-action button.
    - Click an embedded block to **Edit** or delete it; galleries can take more images.
  - **Article layout** (Settings tab): Classic (side contents), Feature (full-width cover behind the title) or Minimal (one calm column).
  - **History** tab: the last 20 versions, each restorable into the editor. **Drafts save themselves** after 12 seconds without typing.
  - **SEO extras**: secondary keyphrases, and a social share title and description.
  - **On the site**: reading progress bar, contents that fold on phones, share row (native share on phones, LinkedIn, X, Facebook, WhatsApp, email, copy link), author box, related posts, and category pages at `/insights/category/<slug>`.
  - **Editor**:
    - Headings H2–H4, bold, italic, underline, strikethrough, superscript, subscript, inline code.
    - Text colour, highlight colours, alignment.
    - Bullet, numbered and checklist lists with indent and outdent.
    - Links (Ctrl+K), quotes, four callout styles, collapsible sections, code blocks, dividers.
    - Tables (add or delete rows and columns, merge cells, header row).
    - Images: alt text and caption, normal, wide or full width. Paste or drag an image to upload it.
    - YouTube and Vimeo videos, call-to-action buttons.
    - Press **/** for the block menu. Select text for the quick-format bar. The outline panel, focus/full-screen mode, word count and reading time are always available.
  - **SEO optimiser**:
    - Live SEO and readability scores, focus keyphrase checks (title, description, slug, intro, subheadings, density, image alt text, not used in another post).
    - Title and description counters with length bars, Google preview on desktop and mobile, and a WhatsApp/LinkedIn/Facebook share preview.
    - Internal and external link checks, sentence and paragraph length, heading structure.
    - Canonical URL, noindex and share image settings.
  - **Publishing**:
    - Draft, publish now, or schedule for a date and time. Scheduled posts go live within a minute of their time (a database job publishes them).
    - Arabic and English versions with per-language completeness, a FAQ section that adds FAQ schema, cover image, category, tags and author.
    - Preview before publishing; duplicate a post.
    - Local backup: if the browser closes before you save, the panel offers to restore your work.
- **Services, Team, Clients, Credentials, Branches, FAQ, Gallery**: content collections with ordering, publish toggles and per-language fields.
- **Categories, tags & authors**: blog taxonomy.
- **Media library**:
  - **Library**: uploads up to 10 MB. Photos are converted to light WebP in three sizes automatically. Search, alt text per language, how many places use each image, copy URL, delete (with a warning when the image is in use).
  - **On the website**: every image the site shows, including the original photos from the old site and design images, with where each one appears.
  - **Replace / Replace everywhere**: pick or upload a new image and it replaces the old one in every page, section, collection, post and setting at once. Only the affected pages are refreshed.
- **Enquiries**: inbox with statuses, replies and CSV export. **Newsletter**: double opt-in subscribers with CSV export.
- **Texts & translations**: every interface string on the site, per language.
- **Site settings** (admin):
  - Brand: name, logo, favicon, founding year.
  - Contact details and social accounts.
  - Default SEO and search-console verification codes.
  - Appearance: light/dark default, colour preset or **custom brand colours** (primary + accent; dark-mode shades are derived), Arabic numerals, 3D hero, **motion** (full / subtle / off), intro animation, background glow, smooth scrolling.
  - Design images: founder cut-out portrait, default video poster, and the office image and logo shown to search engines.
  - Languages & landing: shortcuts to the default (landing) language and to interface texts.
  - Header and announcement bar, footer, floating buttons.
  - The figures shown in "Why SCO".
- **Navigation menus**: header and footer menu links (nested items supported).
- **Languages**: add, enable or set the default language.
- **Analytics & tracking**:
  - GA4, Google Tag Manager, Google Ads conversions, Meta Pixel (+ Conversions API), Microsoft Clarity, LinkedIn, TikTok and custom code.
  - Nothing loads before visitor consent (Consent Mode v2). The cookie notice appears automatically once any tool is configured.
- **Redirects**: 301 redirects, such as when a page or post address changes.
- **Users & roles**: invite by email (a link is also shown for copying), change roles, revoke invitations, remove users.
- **Audit log**: every create, edit and delete with who, when and what changed, filterable. Draft autosaves aren't logged.
- **My account** (everyone): change your display name, change your password (your current password is checked first, with a strength meter), and sign out of every device.

## 4. SEO built in

- Per-page and per-post title and description, canonical URLs and hreflang (ar/en + x-default).
- Localised `sitemap.xml` and `robots.txt`; preview pages are never indexed.
- Structured data:
  - Organization / AccountingService, WebSite, BreadcrumbList.
  - Service, Person (team profiles), BlogPosting, FAQPage.
- Branded share images (`/og/ar.png`, `/og/en.png`) when a page has none.
- An RSS feed for the blog: `/{lang}/insights/rss.xml`.
- The legacy site's URLs 301-redirect to the new pages.
