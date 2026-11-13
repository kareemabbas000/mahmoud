# Guardrails: cost, speed and security

**Read this before changing anything.** Start with [`ARCHITECTURE.md`](ARCHITECTURE.md) for the system map and [`SEO.md`](SEO.md) for search. These rules keep the site free to run on **Vercel Hobby** and **Supabase Free**, with thousands of posts and heavy traffic, while staying fast and secure. Every rule has a reason. If a change has to break one, write down why in the commit message and update this file.

---

## 1. The budget

| Resource | Free allowance per month | What uses it here | Expected use |
|---|---|---|---|
| Vercel **Function invocations** | 1,000,000 | page re-renders after an edit, forms, admin, `/api/*` | thousands |
| Vercel **Active CPU** | 4 CPU-hours | the same; page re-renders are the big one | well under 1 h |
| Vercel **Fast Origin Transfer** | 10 GB | bytes a function sends to the CDN (re-renders, admin, uncached responses) | well under 1 GB |
| Vercel **Fast Data Transfer** | 100 GB | bytes the CDN sends to visitors (HTML, JS, CSS, fonts, `/legacy` images) | grows with traffic |
| Vercel **Edge (CDN) Requests** | 1,000,000 | every file a visitor downloads | grows with traffic |
| Vercel **Image transformations** | 5,000 | only the bundled `/legacy` images (§5) | ~150, one-off |
| Vercel **Cron jobs** | daily minimum frequency on Hobby | `/api/keepalive` | 30 runs |
| Supabase **Database** | 500 MB (disk 2 GB, read-only at 95 %) | content, audit log, enquiries | a few MB |
| Supabase **Storage** | 1 GB | media (WebP sets), CVs | small |
| Supabase **Egress** | 5 GB uncached + 5 GB cached | page re-renders, media downloads | low |
| Supabase **Inactivity** | paused after 1 week idle | kept awake by the daily keep-alive | always awake |

When Hobby limits run out, the feature stops until the 30-day window resets. Images return 402, and other usage can pause the deployment. When Supabase limits run out, you get a grace period, then the database can go read-only or start answering 402. **The rules below exist so that never happens.**

Check usage monthly: Vercel → Project → Usage, and Supabase → Organization → Usage.

---

## 2. How a visit is served (and why it's cheap)

```
visitor ──► Vercel CDN ──(cache hit, ~all traffic)──► prebuilt HTML / JS / CSS      ← no function, no database
                │
                └─(only after an edit)──► function re-renders that one page once ──► Supabase (anon, RLS)
```

- **Public pages are static (SSG/ISR) and never expire on a timer.** They are re-rendered only when content they use changes: the panel calls `updateTag`, and the database calls `/api/revalidate`. A 30-day `revalidate` is only a backstop.
- **The proxy (`src/proxy.ts`) runs only for `/admin`.** Every proxy run is a billed function invocation, so locale handling is in `next.config.ts` `redirects()`, which the CDN serves.
- **Unknown first segments return a static 404 with no function** (`dynamicParams = false` in `[locale]/layout.tsx`). Bots probing `/wp-login.php`, `/.env` and the like cost nothing.
- **Scheduled posts:** `pg_cron` in Supabase checks every minute (free, inside Postgres). It calls Vercel only when a post actually goes live.
- **Errors keep the last good page.** Data functions throw at runtime instead of caching fallback content, so a Supabase outage serves stale pages rather than wrong ones.

---

## 3. Caching rules (the most important section)

All public data goes through `src/lib/data.ts`. All cache tags are defined in `src/lib/tags.ts`.

1. **Never add a time-based revalidate** (`export const revalidate = 60`, `revalidate: 3600`, `cache: "no-store"` on public pages). A timer re-renders every page on schedule. With 2,000 post pages that is the CPU and Fast Origin Transfer overrun this project is designed to avoid.
2. **Never add a catch-all tag** (`"content"`, `"all"`) and never bust one. One catch-all bust re-renders the whole site, including every post.
3. **Tag by what a page actually reads, and bust only what changed.**

   | Tag | Read by | Busted by |
   |---|---|---|
   | `languages`, `settings`, `ui`, `menus`, `branches`, `services:nav`, `tracking` | **every page** (header, footer, metadata) | Settings, Languages, Translations, Menus, Branches, a service's name/summary/slug/order/publish change |
   | `page:<slug>` (`page:home`) | that page (posts also read `page:home` for its CTA) | publishing/unpublishing that page |
   | `pages:index` | sitemap, static params | any page publish/rename/delete |
   | `services` | services blocks, service pages | any service edit |
   | `team`, `clients`, `certificates`, `faqs`, `gallery`, `taxonomy`, `services:also`, `redirects` | the blocks that show them | edits to that collection |
   | `post:<id>` | that post's page, plus cards of it on other posts' "related" | editing that post |
   | `slug:<slug>` | the slug → post lookup | saving/publishing/deleting a post with that slug (old and new) |
   | `posts:index` | `/insights` pages, RSS, sitemap | any post save/publish/delete |

   Global tags re-render every page as it is next visited, so those edits should stay rare. That's fine for settings, but **never move frequently edited data into a global query**.
4. **Post pages must not read the full post list.** They read `getPostRefBySlug` → `getPost(id)` → `getPostCards(related_ids)`. Related posts are chosen when a post is **saved** (`posts.related_ids`), so publishing post #1001 doesn't touch posts #1–1000.
5. **Lists never load bodies.** `getPostIndex()` selects card fields only, and reading time is stored at save time (`posts.read_minutes`). Keep data cache entries well under **2 MB**; larger entries silently stop caching.
6. **Paginate lists:** `/insights` shows 24 per page (`/insights/page/<n>`). Never render an unbounded list into one page.
7. **Prebuild only what is hot.** `generateStaticParams` builds the newest 40 posts; the rest render once on first visit and stay cached.
8. **Data edited directly in SQL:** call `select private.revalidate(array['<tag>', …]);` afterwards. Redeploying also refreshes everything, because cache keys include the deployment id.
9. **Server Actions** use `updateTag` (read-your-own-writes). **Route handlers** use `revalidateTag(tag, "max")`.

---

## 4. Routing rules

- Anything that changes only through a redeploy is built into `next.config.ts`:
  - the default language redirect (`/` → `/ar`),
  - language-less links (`/contact` → `/ar/contact`),
  - legacy WordPress redirects (`content/redirects.json`),
  - **panel redirects** (the `redirects` table).
- Saving redirects, or adding a language or changing the default, calls `VERCEL_DEPLOY_HOOK_URL` (`src/lib/server/deploy.ts`). Without the hook, the panel tells the editor to redeploy.
- Child dynamic routes keep `dynamicParams = true`, so new services, posts and pages work without a deploy.
- Don't add `headers()`, `cookies()` or `searchParams` to public pages: any of them makes the page dynamic, which means a function runs on every visit. Read query strings on the client if you must.

---

## 5. Images

- **Uploads:** the panel (`MediaPicker.tsx` → `useUploader`) turns JPEG/PNG/WebP into a WebP set in the browser: `…/w480.webp`, `w960.webp` and `w1600.webp`, cached for 1 year. Everything stores the `w1600` URL.
- **Rendering:** always use `<SmartImage>` (`src/components/ui/SmartImage.tsx`), never `next/image` directly.
  - Upload sets are served **from Supabase with a `srcset`**, so they use 0 Vercel transformations.
  - Other remote URLs are shown unoptimised.
  - Only bundled `/legacy/*` files use the Vercel optimiser, limited to WebP only, 4 device widths + 3 icon widths, and qualities `[75, 92]` (`next.config.ts`).
- Rich-text images get the same `srcset` (`RichText.tsx`).
- Don't add AVIF, more widths or more qualities: each combination is a separate billed transformation.
- Deleting a media item removes all three files (`variantPaths`).

**Media caching map (who serves each file, and what it costs):**

| Media | Served by | Cache | Free-plan cost |
|---|---|---|---|
| Uploaded photos (WebP sets) | Supabase Storage CDN, direct | `cacheControl: 31536000` set at upload; paths never change (a replacement is a new file) | Supabase cached egress (5 GB) + uncached egress only on CDN miss. **0 Vercel.** |
| Uploaded PDFs/files | Supabase Storage CDN | 1 year | Same as above |
| Thumbnails in the panel (library, picker, fields, post list) | the `w480` variant, never the full image | 1 year | A fraction of the egress of the full image |
| In-article galleries | `w960` thumbnails + `srcset`; the lightbox loads `w1600` only when opened | 1 year | Same as above |
| `/legacy/*` bundled photos | Vercel CDN + image optimiser (WebP) | `immutable`, 1 year; optimiser cache 31 days | ~150 transformations, then cache reads |
| `/og/*.jpg` share cards | Vercel CDN, static | 7 days + stale-while-revalidate | Fast Data Transfer only |
| Fonts | `next/font`, self-hosted | immutable | Fast Data Transfer only |

Rules: never proxy Supabase images through a Vercel route or `next/image`; never overwrite a file at the same path (the 1-year cache would serve the old one, so use **Replace everywhere**); always render thumbnails from `w480`/`w960`, never `w1600`.

---

## 6. Supabase rules

- **Every schema change is a migration file** in `supabase/migrations/` (timestamped name), applied to the project, then checked with the security and performance advisors. The repo and the database must never drift.
- **RLS on every table**, including the `private` schema (deny-all). Public reads go through anon + RLS; writes from public forms go through the service key on the server only, after validation.
- **Growth controls (already in place; keep them):**
  - The audit log ignores draft autosaves and `updated_at`, and truncates diffs over 32 kB.
  - Page versions are capped at 25 per page.
  - Daily `private.housekeeping()` deletes: rate-limit rows older than 2 days, audit entries older than 400 days, finished invitations older than 90 days, and unconfirmed newsletter sign-ups older than 30 days.
  - `cron.job_run_details` keeps 7 days.
- **Never store files in table columns.** Files go in Storage, under the size limits on each bucket.
- **Select only the columns you need** in hot queries. `select("*")` is fine for small collections, never for posts lists.
- **Inactivity pause:** `/api/keepalive` runs daily via Vercel Cron (`vercel.json`). Don't remove it.
- **Scheduled jobs belong in `pg_cron`**, not external cron services: it's free and calls Vercel only when needed. Current jobs: `sco-publish-due-posts` (every minute), `sco-housekeeping` (03:17 UTC) and `sco-cron-history` (03:27 UTC).
- **Deployments that receive revalidations** are listed in `private.app_config.site_urls`. When the production domain changes:
  ```sql
  update private.app_config set value = 'https://sco-eg.com,https://scowebsite2026.vercel.app' where key = 'site_urls';
  ```

---

## 7. Frontend performance rules

- **No `backdrop-filter` or `filter: blur()` on many elements, and never on anything that animates.** The aurora background is soft through its gradients alone. Glass cards use translucent fills. Keep `backdrop-filter` for the few floating bars (header, menus).
- **Animate only `transform` and `opacity`.** No `transition: all`.
- **Pointer and scroll handlers are passive and throttled with `requestAnimationFrame`** (see `Motion.tsx`). No `querySelectorAll` or layout reads per event.
- **Heavy libraries load lazily** after first paint (GSAP, Lenis in `ScrollScenes.tsx`). Admin-only libraries (TipTap, dnd-kit) must never be imported from public components.
- **Respect `prefers-reduced-motion`** everywhere.
- **Admin:**
  - `(panel)/loading.tsx` gives every click instant feedback.
  - The page builder soft-refreshes its preview (`router.refresh()` over `postMessage`) instead of reloading the iframe.
  - Auth uses `getClaims()`, which verifies locally once the project uses asymmetric JWT keys (§9).

---

## 8. Security rules

- **Secrets:**
  - Only `NEXT_PUBLIC_*` values may reach the browser.
  - The service key is used only in server code (`serviceClient()`), after validating input.
- **Rate limits** (DB-backed, per hashed IP):
  - contact 5/10 min, careers 3/h, newsletter 5/h;
  - sign-in 10/10 min, magic link / owner link / reset 5/15 min, invitation accept 10/15 min.
  - Add one to every new public form or auth action.
- **Forms:**
  - honeypot plus minimum fill time, and Zod validation;
  - uploads checked by MIME type **and** magic bytes;
  - CVs stay in a private bucket and are opened with 5-minute signed URLs.
- **Roles** are enforced twice: `requireAction(min)` in every server action, and RLS in the database.
- **`/api/revalidate`** requires the shared secret (from `REVALIDATE_SECRET`, or `private.app_config` via a service-only RPC) and accepts only known tag shapes.
- **The public `media` bucket can't be listed anonymously**: files are readable only by exact URL.
- **Headers** (`next.config.ts`): HSTS, nosniff, frame-ancestors, COOP, Permissions-Policy, and no-index on `/admin`.
- **Never** build SQL strings from user input, render user HTML without the rich-text renderer, or disable RLS.

---

## 9. One-time setup that only the owner can do (dashboards)

1. **Vercel → Settings → Environment Variables:** `SUPABASE_SERVICE_ROLE_KEY` (required for forms, invitations and revalidation). Optional:
   - `VERCEL_DEPLOY_HOOK_URL`: create it in Vercel → Settings → Git → Deploy Hooks (branch `main`). Comma-separate one hook per project.
   - `CRON_SECRET`: protects `/api/keepalive`.
   - `REVALIDATE_SECRET`: if unset, the secret stored in the database is used.
2. **Vercel → Firewall:** turn on the managed **Bot Protection** ruleset. Optionally add a custom rule (Hobby allows 3) that **denies** paths matching `^/(wp-|xmlrpc|\.env|\.git|cgi-bin|phpmyadmin)`.
3. **Supabase → Authentication → Password security:** turn on **Leaked password protection**.
4. **Supabase → Project Settings → JWT keys:** migrate to **asymmetric signing keys**. `getClaims()` then verifies sessions locally, which makes every admin request faster and saves Auth calls.
5. **Production domain:** when you point `sco-eg.com` at Vercel, set `NEXT_PUBLIC_SITE_URL` and update `site_urls` (§6).

---

## 10. Checklist for every change

- [ ] Public pages are still `●`/`○` in `npm run build` output (not `ƒ`), and no `revalidate` timer was added.
- [ ] New data reads go through `lib/data.ts` with **narrow tags**, and the matching save **busts exactly those tags**.
- [ ] No new list loads bodies or renders unbounded items. Cache entries stay small.
- [ ] Images use `<SmartImage>`. No new image widths, formats or qualities.
- [ ] No new proxy matcher paths, and no `headers()`/`cookies()` in public pages.
- [ ] New tables: RLS on, policies written, indexes on foreign keys, retention decided, migration file committed and applied, advisors clean.
- [ ] New public forms and auth actions are rate-limited and validated.
- [ ] No blur, backdrop or layout-triggering animations added. Handlers are throttled. Reduced motion is respected.
- [ ] `npm run typecheck`, `npm run lint` and `npm run build` pass, then push to `main`.
