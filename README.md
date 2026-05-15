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

### Testing

```bash
npm run test       # Vitest (trip scenarios, schema, makeFreshTrip)
npm run test:e2e   # Playwright smoke: home, seed trip, library
npm run i18n:check # en/zh/ja same keys + static t("…") keys exist
```

First-time Playwright browser download:

```bash
npx playwright install chromium
```

CI can run `npx playwright install --with-deps chromium` on Ubuntu before `npm run test:e2e`.

## Data Architecture (Current)

- Domain types + seed data: `src/lib/packlog-data.ts`
- Runtime schemas: `src/lib/packlog-schema.ts`
- Data repository adapter: `src/lib/packlog-repository.ts`
- State orchestration: `src/lib/packlog-store.tsx`

This keeps the front-end behavior unchanged while preparing for server-side storage migration.

## Deployment

This project already includes Cloudflare Worker config (`wrangler.jsonc`) and TanStack Start server entry. After `npm run build`, Wrangler reads the generated config under `dist/server/wrangler.json` (do not edit that file by hand).

### One-shot (local)

1. **First time only:** authenticate Wrangler with your Cloudflare account:
   - `npx wrangler login`
2. Ensure production `VITE_*` values are present when building (copy `.env.example` → `.env.production.local` or export vars). Vite inlines these at build time.
3. Build and upload in one command:
   - `npm run release:cf`

Equivalent manual steps:

1. `npm run build`
2. `npx wrangler deploy`

**Scripts:**

| Command                  | Purpose                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `npm run release:cf`     | Production build + `wrangler deploy`                                                 |
| `npm run deploy`         | Upload only (expects a finished build in `dist/`) — used by CI after `npm run build` |
| `npm run deploy:dry-run` | Build + validate bundle without uploading                                            |

Before deploy, set production variables/secrets in Cloudflare if your Worker needs runtime secrets (the Vite `VITE_*` bundle must still be set at **build** time).

### 中文（本地发布简要）

1. 首次执行 `npx wrangler login` 绑定 Cloudflare。
2. 生产环境的 `VITE_*` 应在执行 **`npm run build` 之前** 就绪（否则客户端拿不到 Supabase 等配置）。
3. 一键：`npm run release:cf`。若只想检查 Worker 包是否生成正常：`npm run deploy:dry-run`。

### Auto Deploy with GitHub Actions

This repository now includes `.github/workflows/deploy-cloudflare.yml`.

- Trigger: push to `main` (or manual run from Actions tab)
- Target: optional **Supabase `db push`** (when secrets are set), then Cloudflare Workers via `npm run release:cf` (build + deploy)
- Full checklist: **[docs/CI_DEPLOY.md](docs/CI_DEPLOY.md)**

Set these GitHub repository secrets before enabling auto deploy:

- `CLOUDFLARE_API_TOKEN` (required)
- `CLOUDFLARE_ACCOUNT_ID` (recommended)
- `VITE_DATA_BACKEND`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PACKLOG_WORKSPACE`
- `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` (optional; when all three are set, migrations run on every deploy)

## Supabase + Vercel Integration

Environment variables are documented in `.env.example`. Optional `VITE_WEIGHT_AI_URL` accepts `POST` JSON `{ "category", "nameHint" }` and returns `{ midG, lowG, highG }` (grams) for the weight reference band; if unset, the app uses a built-in heuristic.

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

### Authentication (lazy sign-in)

The app uses the **same** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for optional login (bottom sheet: magic link + Google). Data sync still respects your backend setting and RLS.

**Supabase Dashboard**

1. Authentication → Providers: enable **Email** (magic link) and **Google** (add OAuth client ID/secret from Google Cloud Console).
2. Authentication → URL configuration:
   - **Site URL**: local dev origin (e.g. `http://localhost:5173`) or production URL.
   - **Redirect URLs**: include  
     `http://localhost:5173/auth/callback`  
     and your production origin’s `/auth/callback` (e.g. `https://your-domain.com/auth/callback`).
3. Google Cloud OAuth consent screen: authorized redirect URI must match Supabase’s callback URL shown in the Google provider settings (typically `https://<project-ref>.supabase.co/auth/v1/callback`).

OAuth and magic links return to `/auth/callback`, which exchanges the PKCE code and navigates back (with optional `?next=` path).

**Google 登录不可用时的常见原因**

- Supabase → **URL Configuration** → **Redirect URLs** 必须包含你当前浏览器地址栏的 **完整 origin**（例如本地 `http://localhost:5173`，不要用错端口）。
- Google Cloud Console → OAuth 客户端 → **已授权的重定向 URI** 必须填写 Supabase 控制台「Google 提供商」里显示的那一个（形如 `https://<project-ref>.supabase.co/auth/v1/callback`），**不是你的前端域名**。
- 修改 providers 后等待一两分钟再试；浏览器可清除本站缓存或使用无痕窗口排除旧会话干扰。

**邮件订阅勾选**：勾选「产品更新」后，值保存在用户的 **`raw_user_meta_data.marketing_opt_in`**（boolean）。在 Supabase SQL Editor 可查询：`select id, email, raw_user_meta_data from auth.users`。

**按用户隔离的本地数据**：登录用户的浏览器快照键为 `packlog.snapshot.v1.u.<uuid>`，未登录访客仍为 `packlog.snapshot.v1`。启用 Supabase 且已登录时，`workspace` 会使用 `u:<user_id>`（与是否设置 `VITE_PACKLOG_WORKSPACE` 无关）。

## Next-step Upgrade Path

1. Add API-backed repository (Supabase / D1 / Postgres) implementing the same repository interface.
2. Move seed data out of runtime bundle once backend is online.
3. Add entity-level IDs and constraints from database as source of truth.
4. Add auth and tenancy (user/workspace ownership) on top of repository layer.

See `docs/architecture.md` for details.
