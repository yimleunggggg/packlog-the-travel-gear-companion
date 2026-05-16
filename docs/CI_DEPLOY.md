# CI 一键部署（GitHub → Supabase 迁移 → Cloudflare）

推送到 `main` 后，工作流会：

1. **（可选）** 若已配置 Supabase Secrets：在远端项目执行 `supabase db push`（应用 `supabase/migrations/` 中尚未应用的迁移）。
2. **构建并部署** Cloudflare Workers（`npm run release:cf`）。

日常开发：**本地 commit → `git push origin main`**，无需每次打开 Supabase SQL Editor 或 Cloudflare 控制台发版。

**生产环境以 Cloudflare Workers 为准**（`wrangler.jsonc` + `.github/workflows/deploy-cloudflare.yml`）。若仓库曾在 Vercel 连过 Git，推 `main` 仍会触发 Vercel 构建并可能发失败邮件；不需要 Vercel 时，在 [Vercel 控制台](https://vercel.com) 断开该项目的 Git 集成，或删除/停用对应 Project 即可。

## GitHub Repository secrets（一次性配置）

在仓库 **Settings → Secrets and variables → Actions → New repository secret** 添加。

### Cloudflare（已有）

| Name | 说明 |
|------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（需 Workers 编辑等权限） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账号 Account ID |

### 构建期 `VITE_*`（已有）

| Name | 说明 |
|------|------|
| `VITE_DATA_BACKEND` | 生产填 `supabase` |
| `VITE_SUPABASE_URL` | Supabase **Project URL** |
| `VITE_SUPABASE_ANON_KEY` | Supabase **anon public** key |
| `VITE_PACKLOG_WORKSPACE` | 逻辑工作区，如 `packlog-prod` |

### Supabase CLI（迁移自动化，新增）

| Name | 说明 |
|------|------|
| `SUPABASE_ACCESS_TOKEN` | [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) 创建，用于 CLI 管理远端项目 |
| `SUPABASE_PROJECT_REF` | 项目 ref，见控制台 URL `https://supabase.com/dashboard/project/<ref>` |
| `SUPABASE_DB_PASSWORD` | **Project Settings → Database** 下的数据库密码（用于 `supabase link` 非交互链接） |

三者**任缺其一**时，CI 会 **跳过迁移步骤**（仍会部署 Cloudflare），并在日志里输出 `notice`，避免误以为自己已推迁移。

## Supabase Auth（仍建议一次性人工配置）

**Authentication → URL configuration** 中的 **Site URL**、**Redirect URLs**（含 `/auth/callback`）与线上公网地址一致即可。换 Worker 名或换域名时**只需改这一处**，与 CI 是否跑迁移无关。

## 本地与 CI

- 迁移文件仍放在 **`supabase/migrations/`**，与 `docs/DATABASE_SYNC.md` 一致。
- 本地可用 `supabase link` + `supabase db push` 调试；CI 会在每次 `main` 部署前尝试同步远端迁移历史。
