-- trip_items：可选系统分组（与前端 `Item.systemGroup` / `packSystemGroupSchema` 枚举字符串一致）
ALTER TABLE trip_items ADD COLUMN IF NOT EXISTS system_group text;

COMMENT ON COLUMN trip_items.system_group IS
  'Optional PACKLOG system bucket: shelter | sleep_system | cooking | nav_safety | movement | main_pack | resupply | apparel_layer | uncategorized';
