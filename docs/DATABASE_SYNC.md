# 数据库与本地快照

## Supabase（云端）

项目在 `supabase/migrations/002_incremental.sql` 保存与 `PACKLOG-增量迁移.sql` 一致的增量迁移，适用于 PostgreSQL / Supabase SQL Editor。`004_trip_items_system_group.sql` 为后续追加的 `trip_items.system_group` 字段。

**请在 Supabase SQL Editor 中执行一次该文件全文**（或 `supabase db push` 若你使用 Supabase CLI 关联项目）。

迁移会：

- 扩展 `gear_library`：`kits`、`weight_source`、`photos`、`catalog_product_id`
- 扩展 `trip_items`：`is_consumable`
- 新建 `gear_kits` 与 RLS
- 条件扩展 `community_lists`：`experience_level`、`base_weight_g`
- 新建 `ai_usage_log` 与 RLS
- 条件扩展 `profiles`：`subscription_tier`、`subscription_expires_at`

## 本地应用（当前仓库）

运行时数据为 **版本化 JSON 快照**（`packlogSnapshotSchema`），通过 `packlog-repository` 持久化到浏览器 `localStorage`，**不直接执行上述 SQL**。

### 字段映射（SQL → 本地类型）

| PostgreSQL / 规格 | 本地 `Item` / `GearSpec` |
|-------------------|-------------------------|
| `trip_items.is_consumable` | `Item.isConsumable?: boolean` |
| `trip_items.system_group` | `Item.systemGroup?: PackSystemGroup`（可空；与 `packlog-schema` / `packlog-system-groups` 枚举一致） |
| 穿着不计入基础重量 | `Item.isWorn?: boolean`（与 SQL 中 `container = 'worn'` 意图一致；本地仍用箱包结构 + 标记） |
| `gear_library.weight_source` | `Item.weightSource` / `GearSpec` 无该字段时沿用 `weightSource` 枚举（`user` ≈ `user_measured`） |
| `gear_library.kits`, `photos` | `GearSpec.kits?`, `GearSpec.photos?`（预留） |
| `gear_kits` 表 | 尚未有独立 UI；迁移已就位供后续接入 |

### RLS 说明

迁移里 `ai_usage_log` 的 `INSERT WITH CHECK (true)` 依赖 **仅服务端使用 service_role** 写入的设计；客户端 anon key 不应具备 insert 权限。上线前请在 Supabase 控制台收紧策略或改为 Edge Function 写入。

---

## 操作手册：在 Supabase 执行 SQL 并收紧 `ai_usage_log`

### A. 第一次建表/加字段（若尚未执行 002）

1. 打开浏览器进入 [Supabase Dashboard](https://supabase.com/dashboard)，选中你的项目。
2. 左侧点 **SQL Editor** → **New query**。
3. 在本仓库打开 `supabase/migrations/002_incremental.sql`，**全选复制**到编辑器。
4. 点 **Run**（或 `Cmd/Ctrl + Enter`）。应显示 `Success`，无报错即表示对象已创建或已存在（脚本使用 `IF NOT EXISTS`）。
5. （可选 CLI）若本机已 `supabase link`：在项目根执行  
   `supabase db push`  
   效果等价于把 `supabase/migrations/` 下未应用的迁移推到远端。

### B. 收紧 `ai_usage_log` 的 INSERT（务必在上线前做）

**原因简述：** `002` 里的策略 `"Service can insert AI usage"` 对 **anon / authenticated** 等受 RLS 约束的角色等于「谁都能插一行」，只要用浏览器里的 Supabase 客户端带上 JWT，就可能恶意刷表。

**推荐做法（与仓库 `003` 迁移一致）：**

1. 仍在 **SQL Editor** → **New query**。
2. 粘贴 `supabase/migrations/003_ai_usage_log_rls_lockdown.sql` 全文，**Run**。
3. 确认写入路径：**仅**在服务端（Edge Function、自建 API、Cron）使用 **`SUPABASE_SERVICE_ROLE_KEY`** 调用 `insert`；**永远不要把 service_role 密钥放进前端或 `VITE_*`**。

**写入后如何验证：**

- 在 SQL Editor 用 **默认角色**（模拟用户）无法 `INSERT INTO ai_usage_log ...` 成功，即符合预期。
- 用你的服务端代码（持有 service_role）执行插入应仍然成功。

### C. 若你坚持用「用户 JWT 也能写日志」

不推荐。若业务坚持，应改为 **`INSERT WITH CHECK (user_id = auth.uid()::text)`** 等约束，并配合速率限制；不要保留 `WITH CHECK (true)`。
