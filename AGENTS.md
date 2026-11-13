<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rules (read before any edit)

- `docs/ARCHITECTURE.md`: start here. The system map, data and caching contract, database, panel, blog, themes, and how-to recipes.
- `docs/GUARDRAILS.md`: cost, speed and security rules for Vercel Hobby and Supabase Free. Every change must pass its checklist (§10).
- `docs/SEO.md`: technical and on-page SEO, `llms.txt`, sitemap, structured data, and the blog publishing checklist.
- `docs/CONTROL_PANEL.md`: how the panel works and its environment variables.
- Schema changes go in `supabase/migrations/`, get applied to the project, and are checked with the advisors.
- Finished, verified work is committed and pushed to `main` (Vercel deploys it).
