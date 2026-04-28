# Packlog Travel Gear Companion

Packlog is a scenario-driven travel packing app built with TanStack Start + React.

The current UI flow is kept intact (archive -> trip -> library/community), and the data layer now has a clearer long-term path:

- runtime schema validation (`zod`)
- versioned snapshot format
- repository abstraction (`load/save/clear`)
- local persistence (browser `localStorage`) as a drop-in adapter

## Quick Start

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Data Architecture (Current)

- Domain types + seed data: `src/lib/packlog-data.ts`
- Runtime schemas: `src/lib/packlog-schema.ts`
- Data repository adapter: `src/lib/packlog-repository.ts`
- State orchestration: `src/lib/packlog-store.tsx`

This keeps the front-end behavior unchanged while preparing for server-side storage migration.

## Deployment

This project already includes Cloudflare Worker config (`wrangler.jsonc`) and TanStack Start server entry.

Recommended flow:

1. Run production build check:
   - `npm run build`
2. Deploy with Wrangler:
   - `npx wrangler deploy`

Before deploy, set production variables/secrets in Cloudflare if needed.

### Auto Deploy with GitHub Actions

This repository now includes `.github/workflows/deploy-cloudflare.yml`.

- Trigger: push to `main` (or manual run from Actions tab)
- Target: Cloudflare Workers via `npm run deploy`

Set these GitHub repository secrets before enabling auto deploy:

- `CLOUDFLARE_API_TOKEN` (required)
- `CLOUDFLARE_ACCOUNT_ID` (recommended)
- `VITE_DATA_BACKEND`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PACKLOG_WORKSPACE`

## Supabase + Vercel Integration

Environment variables are documented in `.env.example`.

For full remote persistence:

1. Create a Supabase project.
2. Run `docs/database-schema.sql` in Supabase SQL editor.
3. Set env vars:
   - `VITE_DATA_BACKEND=supabase`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PACKLOG_WORKSPACE`
4. Deploy to Vercel and set the same variables in Project Settings -> Environment Variables.

If `VITE_DATA_BACKEND` is not `supabase`, app falls back to local storage automatically.

## Next-step Upgrade Path

1. Add API-backed repository (Supabase / D1 / Postgres) implementing the same repository interface.
2. Move seed data out of runtime bundle once backend is online.
3. Add entity-level IDs and constraints from database as source of truth.
4. Add auth and tenancy (user/workspace ownership) on top of repository layer.

See `docs/architecture.md` for details.
