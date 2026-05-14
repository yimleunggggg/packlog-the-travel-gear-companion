-- PACKLOG 增量迁移 — 在 Supabase SQL Editor 中执行
-- 此文件不会影响现有数据，只添加新字段和新表

-- ============================================
-- 1. gear_library 增加字段
-- ============================================

-- 装备套装标记
ALTER TABLE gear_library ADD COLUMN IF NOT EXISTS kits text[] DEFAULT '{}';

-- 重量来源标记
ALTER TABLE gear_library ADD COLUMN IF NOT EXISTS weight_source text DEFAULT 'user_measured';
-- 可选值: 'user_measured' | 'ai_estimate' | 'community_median'

-- 装备照片
ALTER TABLE gear_library ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';

-- 未来产品目录关联（先预留，暂不使用）
ALTER TABLE gear_library ADD COLUMN IF NOT EXISTS catalog_product_id text;

-- ============================================
-- 2. trip_items 增加字段
-- ============================================

-- 消耗品标记（食物/水/气罐等会用完的）
ALTER TABLE trip_items ADD COLUMN IF NOT EXISTS is_consumable boolean DEFAULT false;

-- 确保 container 字段包含 'worn' 选项
-- 如果 container 是 CHECK 约束，需要更新
-- ALTER TABLE trip_items DROP CONSTRAINT IF EXISTS trip_items_container_check;
-- ALTER TABLE trip_items ADD CONSTRAINT trip_items_container_check 
--   CHECK (container IN ('checked', 'carry', 'personal', 'worn', 'consumable', 'undecided'));

-- ============================================
-- 3. 装备套装表（新建）
-- ============================================

CREATE TABLE IF NOT EXISTS gear_kits (
  id text PRIMARY KEY DEFAULT ('kit-' || substr(gen_random_uuid()::text, 1, 8)),
  user_id text NOT NULL,
  name text NOT NULL,
  description text,
  gear_ids text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE gear_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own kits" ON gear_kits
  FOR ALL USING (user_id = auth.uid()::text);

-- Index
CREATE INDEX IF NOT EXISTS idx_gear_kits_user_id ON gear_kits(user_id);

-- ============================================
-- 4. 社区清单增加经验等级字段
-- ============================================

-- 如果 community_lists 表存在
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'community_lists') THEN
    ALTER TABLE community_lists ADD COLUMN IF NOT EXISTS experience_level text DEFAULT 'casual';
    -- 'casual' | 'lightweight' | 'ultralight'
    ALTER TABLE community_lists ADD COLUMN IF NOT EXISTS base_weight_g integer;
  END IF;
END $$;

-- ============================================
-- 5. AI 调用日志表（用于速率限制和成本追踪）
-- ============================================

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id text PRIMARY KEY DEFAULT ('ai-' || substr(gen_random_uuid()::text, 1, 8)),
  user_id text NOT NULL,
  action text NOT NULL, -- 'parse_trip' | 'generate_checklist' | 'import_screenshot' | 'suggest_gear' | 'post_trip_review' | 'estimate_weight'
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric(10, 6),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own AI usage" ON ai_usage_log
  FOR SELECT USING (user_id = auth.uid()::text);

-- 只有服务端可以写入（通过 service_role key）
CREATE POLICY "Service can insert AI usage" ON ai_usage_log
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage_log(user_id, created_at);

-- ============================================
-- 6. 用户订阅状态字段
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';
    -- 'free' | 'pro'
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;
  END IF;
END $$;
