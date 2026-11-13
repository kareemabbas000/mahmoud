# Architecture

**Read this first if you're a developer or an AI tool about to change the site.** It maps every part of the system: where it lives, how data flows, and the contracts that must not break. Then read [`GUARDRAILS.md`](GUARDRAILS.md) (cost, speed and security rules plus the change checklist) and [`SEO.md`](SEO.md).

**Related docs:**

| Doc | What it covers |
|---|---|
| [`CONTROL_PANEL.md`](CONTROL_PANEL.md) | What editors can do in the panel, and the environment variables |
| [`CONTENT_MAP.md`](CONTENT_MAP.md) | The legacy site and its URL map |
| [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) | Facts the client still has to confirm |
| [`src/app/themes/README.md`](../src/app/themes/README.md) | How to add a design theme |

---

## 1. The system in one picture

```
                     ┌──────────────── Vercel (Hobby) ─────────────────┐
 visitor ──► CDN ──► │ prebuilt HTML/JS/CSS (SSG/ISR, no timer)         │──(re-render only after an edit)──┐
                     │ next.config redirects (/, /contact, legacy, panel)│                                  │
 editor ──► /admin ─►│ proxy.ts (admin only) → server components/actions │──(session client, RLS)──────────┤
                     │ /api/revalidate  /api/keepalive (daily cron)      │                                  ▼
                     └───────────────────────────────────────────────────┘                   ┌──── Supabase (Free) ────┐
                                     ▲                                                       │ Postgres + RLS          │
                                     └──────── pg_net POST /api/revalidate ◄── pg_cron ──────│ Storage: media, cvs     │
 visitor browser ──► Supabase Storage CDN (uploaded images, WebP sets, 1-year cache) ◄───────│ Auth (staff only)       │
                                                                                              └─────────────────────────┘
```

| Layer | Tech | Where |
|---|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript, Tailwind 4 | `src/app`, `src/components` |
| Data | Supabase Postgres with RLS, Storage, Auth; `@supabase/ssr` | `src/lib/supabase/*`, `supabase/migrations` |
| Rich text | TipTap 3 (editor), our own server renderer (site) | `components/admin/editor`, `components/site/RichText.tsx` |
| Motion | CSS first; GSAP and Lenis lazy-loaded | `components/site/{Motion,ScrollScenes}.tsx` |
| Email | Resend (optional) | `lib/server/mail.ts` |
| Hosting | Vercel (two projects: `scowebsite2026` = public site, `sco-test` = test copy) | `vercel.json`, `next.config.ts` |

---

## 2. Directory map

```
src/
  app/
    (site)/[locale]/            public site, one tree per language (ar default, en)
      layout.tsx                html shell, theme, consent, header/footer, JSON-LD (Organization, WebSite)
      page.tsx                  home = page "" rendered from blocks
      [...slug]/                any other block page (about, services, team, faq, contact, custom pages)
      services/[slug]/          service detail       team/[slug]/  team profile
      insights/                 blog: List.tsx (shared list), page/[n], category/[cat](/page/[n]), [slug], rss.xml
      sco-preview/[id]/         staff-only page-builder preview (dynamic, noindex)
      newsletter/confirm|unsubscribe
    (admin)/admin/              control panel (dynamic, noindex): (auth) screens, (panel) screens
    actions/                    server actions: admin (collections/settings/media), pages, posts, media, account, auth, users, inbox, public (forms)
    api/revalidate              cache invalidation called by the database (secret)
    api/keepalive               daily Vercel cron so Supabase Free never pauses
    llms.txt/  sitemap.ts  robots.ts
    globals.css                 design tokens, components, blocks; themes/ = per-theme CSS
  components/
    blocks/                     one component per page-builder block (+ BlockRenderer registry)
    site/                       header, footer, RichText, forms, share, gallery lightbox, consent
    admin/                      panel UI: Sidebar (nav + quick search), editors, pickers, MediaManager
    ui/                         Icon, SmartImage
  content/seed/                 bundled fallback content (used at build time or when Supabase is unset)
  lib/
    data.ts                     ★ every public read, cached with tags (see §4)
    tags.ts                     ★ cache-tag names shared with the database
    site.ts                     getSite(locale): settings + dictionary + menus + helpers for one request
    seo.ts                      pageMeta(), JSON-LD builders       indexing.ts   indexing on/off switch
    themes.ts                   ★ design theme registry            media.ts      upload WebP set helpers
    admin/                      auth (roles), blocks (page-builder catalogue), collections (generic CRUD schema), i18n
    seo-analyzer.ts             blog SEO and readability scoring (runs in the editor)
    rich.ts, posts.ts, i18n.ts, types.ts, env.ts
  proxy.ts                      runs ONLY on /admin (session refresh)
supabase/migrations/            the schema, in order; every change is a new file (never edit applied ones)
docs/                           this folder
```

---

## 3. Request lifecycles

**Public page view (the 99% case).** The CDN serves prebuilt HTML. No function or database work runs. Images come from `/legacy` (CDN) or the Supabase Storage CDN.

**Editor saves something.**
1. A server action runs `requireAction(role)`, which checks the role. RLS checks it again in the database.
2. It writes through the session client.
3. It calls `updateTag(<narrow tags>)`.
4. The next visitor to an affected page triggers one re-render. That page is then static again.

**Scheduled post goes live.** `pg_cron` runs `private.publish_due_posts()` every minute inside Postgres. When a post is due, it flips the status and calls `pg_net` → `POST /api/revalidate` with `posts:index`, `post:<id>` and `slug:<slug>`.

**Visitor submits the contact form.**
1. `submitEnquiry` (server action) runs the honeypot and minimum-fill-time checks, then Zod validation, then a per-IP rate limit (DB-backed).
2. It inserts into `enquiries` with the **service key**.
3. After the response is sent, it emails `settings.contact.notify_email` (Resend) and sends the Meta CAPI event if enabled.
4. Staff see the enquiry in **Inbox → Enquiries** (new-count badge), with statuses, replies and CSV export.

**Staff sign-in.**
1. Supabase Auth with password, magic link, invitation or owner bootstrap.
2. `proxy.ts` refreshes cookies on `/admin`.
3. `getStaff()` uses `getClaims()` (verified locally, since the project uses ES256 keys), then reads the `profiles` row to get the role.

---

## 4. Data and caching contract (don't break this)

- **All public reads go through `src/lib/data.ts`.** Each function is wrapped in `cached(tags, key, fn, fallback)`:
  - no timer; a 30-day backstop only;
  - errors are thrown at runtime, so the last good page keeps being served;
  - seed content is used at build time when Supabase is unreachable.
- **Tags live in `src/lib/tags.ts`.** The same strings are used by SQL (`private.publish_due_posts`), so don't rename them without a migration. The tag-to-reader table is in `GUARDRAILS.md` §3.
- **Every save busts exactly what it changed:**
  - `actions/admin.ts` → `tagsFor()` (services also bust `services:nav` when navigation fields change);
  - `actions/pages.ts` → `page:<slug>` + `pages:index`;
  - `actions/posts.ts` → `post:<id>`, `slug:<slug>` (old and new) and `posts:index`. Draft-only saves bust nothing.
- **Post pages read only their own data:** `getPostRefBySlug` → `getPost(id)` → `getPostCards(related_ids)`. Lists use `getPostIndex()` (card fields only; `read_minutes` is stored at save time).
- **Routing data is baked in at build time** (`next.config.ts` `redirects()`): the default language, language-less sections, legacy redirects and panel redirects. Changing languages or redirects triggers `VERCEL_DEPLOY_HOOK_URL` (`lib/server/deploy.ts`).
- **`[locale]/layout.tsx` has `dynamicParams = false`.** Unknown first segments get a static 404. Child routes keep `dynamicParams = true`.

---

## 5. Database

Schema: `supabase/migrations/*.sql`, applied in order.

| Group | Tables | Notes |
|---|---|---|
| People | `profiles` (role: owner/admin/editor/viewer), `invitations` | Roles are checked by `public.has_role()`, which calls `private.has_role()` (security definer) |
| Site | `settings` (keys `site`, `tracking`, `services_also_offered`), `languages`, `menus`, `ui_strings`, `redirects` | `settings.site` is deep-merged over `content/seed/site.ts`, so new fields always have defaults |
| Pages | `pages` (`blocks` jsonb, `draft` jsonb), `page_versions` (capped 25), `page_templates` | |
| Collections | `services`, `team_members`, `clients`, `certificates`, `branches`, `faqs`, `gallery_items` | Driven by `lib/admin/collections.ts` |
| Blog | `posts` (per-language jsonb fields, `layout`, `read_minutes`, `related_ids`), `post_versions` (capped 20), `post_categories`, `post_tags`, `authors` | |
| Inbox | `enquiries`, `enquiry_replies`, `newsletter_subscribers` | Public inserts only via the service key |
| Media | `media` (metadata); Storage buckets `media` (public, not listable) and `cvs` (private) | |
| System | `audit_log` (trigger on content tables; drafts not logged; diffs over 32 kB truncated); `private.app_config`, `private.rate_limits` | |

**Jobs (`pg_cron`):**
- `sco-publish-due-posts`: every minute;
- `sco-housekeeping`: 03:17 UTC daily;
- `sco-cron-history`: 03:27 UTC daily.

**Localized fields are `{ "<lang>": value }` objects**, so adding a language needs no schema change.

---

## 6. Control panel structure

- **Navigation:** `app/(admin)/admin/(panel)/layout.tsx` defines the groups (Website, Content, Inbox, Settings, People & security). `components/admin/Sidebar.tsx` adds quick search (Ctrl/⌘ K), the settings-tab deep links (`?tab=`) and the phone bottom bar.
- **Generic collections:** add one entry to `lib/admin/collections.ts` (table, fields, minimum role, tag) and the list and form screens work automatically. Add the read function in `lib/data.ts` with its own tag.
- **Page builder:**
  - Block catalogue: `lib/admin/blocks.ts`. Fields drive the form, and `DISPLAY_FIELDS` applies to every block.
  - Renderer registry: `components/blocks/BlockRenderer.tsx`.
  - Adding a block = a definition in `blocks.ts` + a component in `components/blocks/` + a registry entry.
- **Settings:** the section/field arrays in `app/(admin)/admin/(panel)/settings/page.tsx`, rendered by `SettingsEditor`. Field types: `text`, `ltext`, `ltextarea`, `number`, `boolean`, `image`, `color`, `select`, `strings`, `social`, `stats`, `link`, `code`.
- **Media:**
  - `MediaPicker` handles uploads and turns photos into WebP sets.
  - `MediaManager` has the library plus "On the website".
  - `actions/media.ts` scans every table and setting for image URLs and replaces them everywhere.

---

## 7. Blog

| Part | Where |
|---|---|
| Editor | `components/admin/posts/PostEditor.tsx` (tabs: SEO, Publish, Settings, FAQ, History) + `editor/ProEditor.tsx` (TipTap) |
| Custom nodes | `editor/nodes.ts`: callout (info/success/warning/danger/summary), toggle, embed (YouTube/Vimeo/Maps), cta, pullquote, stat, file, gallery, image (size/caption) |
| Contract | **Every node has a matching case in `components/site/RichText.tsx`.** Unknown nodes render only their children; raw HTML is never injected. Text inside block attributes counts towards SEO and reading time (`rich.ts` `docText`, `seo-analyzer.ts`). |
| Scoring | `lib/seo-analyzer.ts`: SEO and readability scores, focus and secondary keyphrases, lengths, links, alt text, structure |
| Saving | `actions/posts.ts` `savePost`: slug uniqueness, revision snapshot (not on autosave), `read_minutes`, `related_ids`, narrow cache busts. Drafts autosave after 12 s idle; published posts never autosave. |
| Front end | `insights/[slug]/page.tsx`: layouts `classic`, `feature`, `minimal`; CSS-only reading progress; folding contents on phones; share row; author box; related posts; FAQ; JSON-LD (BlogPosting, BreadcrumbList, FAQPage) |
| Lists | `insights/List.tsx` (24 per page, category chips are links, Blog/CollectionPage JSON-LD), category archives under `insights/category/<slug>` |

---

## 8. Themes (design system)

- **Tokens:** CSS variables in `globals.css` `:root` and `[data-theme="dark"]` (`--blue`, `--orange`, `--paper`, `--ink`, `--rule` …). Components must use tokens, never raw brand hex values.
- **Registry:** `src/lib/themes.ts`. The theme script, settings picker and types read it. A theme is `html[data-preset="<key>"]` plus a CSS file in `src/app/themes/`. See that folder's README.
- **Per-site overrides:**
  - custom brand colours (`settings.theme.custom_colors`, validated hex values, applied as a `<style>` in `[locale]/layout.tsx`);
  - motion level, intro, background glow and smooth scroll (`data-motion` and `data-smooth` on `<html>`, read by `Motion.tsx`, `ScrollScenes.tsx` and `HeroTilt.tsx`).
- **Dark mode:** `ThemeScript` sets `data-theme` before first paint.

---

## 9. How to change things safely (recipes)

| Task | Steps |
|---|---|
| New editable field in Settings | Add it to `SiteSettings` in `lib/types.ts` → default in `content/seed/site.ts` → field in the settings page sections → read it via `site.settings` |
| New collection | Migration (table + RLS + indexes + audit trigger) → `collections.ts` entry → `data.ts` reader with a new tag → `tags.ts` → block or page that shows it |
| New page-builder block | `blocks.ts` definition → component in `components/blocks/` → `BlockRenderer` registry |
| New editor block | Node in `editor/nodes.ts` → register it in ProEditor `extensions` and `BLOCKS` → edit dialog in `editAtom` → **renderer case in `RichText.tsx`** → CSS (`.ed-*` and `.prose-sco`) |
| New theme | `lib/themes.ts` entry → `src/app/themes/<key>.css` → import it in `globals.css` |
| Schema change | New file `supabase/migrations/<timestamp>_<name>.sql` → apply → run the advisors → commit |
| Content edited by SQL | `select private.revalidate(array['<tag>']);` |

**Before pushing:** `npm run typecheck && npm run lint && npm run build`, and check that public routes are still `●`/`○` (static), not `ƒ`. Finished work goes to `main`, and Vercel deploys it.
