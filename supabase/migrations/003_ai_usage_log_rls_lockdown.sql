-- 收紧 ai_usage_log：禁止 anon / authenticated 通过 RLS 随意 INSERT
-- 背景：002 中的策略名 "Service can insert AI usage" 使用 FOR INSERT WITH CHECK (true)，
-- 对受 RLS 约束的角色会放行任意插入，与「仅服务端写入」不符。
--
-- Supabase 的 service_role 密钥在请求时会绕过 RLS，因此删除该 INSERT 策略后：
--   - 浏览器里用 anon / authenticated 客户端仍无法插入（无匹配策略即拒绝）
--   - Edge Function / 自建后端使用 SUPABASE_SERVICE_ROLE_KEY 仍可插入
--
-- 在已执行过 002 的项目上，本文件单独再执行一次即可。

DROP POLICY IF EXISTS "Service can insert AI usage" ON public.ai_usage_log;

-- 不为 authenticated / anon 添加新的 INSERT policy = 默认拒绝 INSERT（对受 RLS 角色）
-- 如需「仅允许服务端调用某 RPC 写入」，可另建 SECURITY DEFINER 函数并单独授权。
