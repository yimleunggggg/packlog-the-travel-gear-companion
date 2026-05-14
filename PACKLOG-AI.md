# PACKLOG AI 集成规格

> 本文档是 PACKLOG-SPEC.md 的补充，专门覆盖 AI 相关功能的设计与实现。

---

## 一、AI 架构

### 1.1 统一 API 层
所有 AI 功能通过服务端 API Route 调用，前端不直接调用 Claude。

```
/api/ai/
├── parse-trip        — 解析自然语言行程描述
├── generate-checklist — 根据行程参数生成装备清单
├── import-screenshot  — 从截图识别装备
├── suggest-gear       — 智能装备建议（天气/社区/重量优化）
├── post-trip-review   — 行后复盘建议
└── estimate-weight    — 估算装备重量（无品牌型号时）
```

### 1.2 调用规范
```typescript
// 所有 AI route 的统一结构
export async function POST(request: Request) {
  // 1. 验证用户身份（Pro 订阅检查）
  // 2. 速率限制（每用户每分钟 10 次）
  // 3. 构造 prompt（system + user）
  // 4. 调用 Claude API
  // 5. 解析 JSON 响应
  // 6. 返回结构化数据
}

// Claude 调用配置
const config = {
  model: 'claude-sonnet-4-20250514',
  max_tokens: 2000,
  temperature: 0.3, // 低温度确保结构化输出稳定
}
```

### 1.3 免费 vs Pro
- **免费用户：** 手动输入、场景模板自动生成、浏览社区。不触发任何 AI 调用。
- **Pro 用户：** 对话式创建、截图导入、智能建议、行后复盘、重量估算。

当免费用户尝试使用 AI 功能时，显示升级提示：
"这是 Pro 功能。升级后可以用 AI 帮你自动生成清单、识别截图、优化重量。"

---

## 二、各 AI 功能详细设计

### 2.1 对话式创建行程 (`/api/ai/parse-trip`)

**用户体验：**
新建行程页面顶部增加一个输入框，placeholder："描述你的行程，如：下周去屋久岛徒步5天，有3晚露营"

用户输入自然语言 → 调用 AI → 返回结构化数据 → 自动填充表单字段

**System Prompt：**
```
你是一个出行规划解析器。用户会用自然语言描述一次出行计划。
请从中提取以下信息，以 JSON 格式返回：

{
  "destination": { "country": "日本", "city": "屋久岛", "country_en": "Japan", "city_en": "Yakushima" },
  "title": "屋久岛 · 5天",
  "start_date": "2026-06-01",  // 如果用户说了具体日期则填，否则 null
  "end_date": "2026-06-05",
  "duration_days": 5,
  "scenes": ["通用", "山地/高山", "露营"],  // 从以下选项中选择：通用、冬季/城市、夏季/海滩、越野跑、山地/高山、沙漠、滑雪/单板、潜水/浮潜、远程办公
  "climate_note": "6月 20-28°C 多雨",
  "special_notes": ["有3晚露营", "从福冈出发"]
}

只返回 JSON，不要其他文字。如果某个字段无法从用户输入中推断，设为 null。
```

**前端交互：**
1. 用户在输入框打字 → 点击"AI 解析"按钮或按回车
2. 显示 loading 状态（"正在分析你的行程..."）
3. 收到结果后自动填充表单：目的地、标题、日期、场景标签
4. 用户检查/修改后点"创建行程"
5. 如果场景被选中，继续调用 generate-checklist 生成装备清单

### 2.2 AI 生成装备清单 (`/api/ai/generate-checklist`)

**触发时机：** 用户通过 AI 解析创建行程后，自动调用。也可在行程概览页手动触发"AI 补充建议"。

**输入数据：**
```typescript
{
  trip: { destination, duration_days, scenes, climate_note },
  user_gear: [...], // 用户装备库中的物品（名称+品牌+重量）
  existing_items: [...], // 当前清单已有物品
  community_stats: { // 同目的地/场景的社区聚合数据
    most_common_items: [...],
    avg_base_weight: 7200,
    commonly_forgotten: [...]
  }
}
```

**System Prompt：**
```
你是一个专业的出行装备顾问。根据以下行程信息和用户已有装备，生成推荐装备清单。

规则：
1. 优先使用用户装备库中已有的物品（标记 source: "library"）
2. 用户装备库没有的，推荐通用名称（标记 source: "suggested"）
3. 参考社区数据中该目的地最常携带的物品
4. 根据气候条件调整（如雨季增加防水装备，寒冷增加保暖层）
5. 按容器分组：checked（托运）、carry（背包）、personal（随身）、worn（穿着）
6. 标注优先级：must（必带）、should（建议）、nice_to_have（可选）
7. 附简短理由（为什么建议带这个）

返回 JSON 格式：
{
  "items": [
    {
      "name": "Gore-Tex 硬壳",
      "category": "apparel",
      "container": "checked",
      "priority": "must",
      "weight_g": 540,
      "reason": "屋久岛6月降雨概率75%，硬壳是必带装备",
      "source": "library",
      "gear_id": "g-xxx"
    },
    ...
  ],
  "warnings": ["屋久岛山区有熊出没，建议携带熊铃"],
  "summary": "共推荐32件装备，预计基础重量8.2kg"
}
```

### 2.3 截图导入 (`/api/ai/import-screenshot`)

**用户体验：**
- 入口：行程打包页面和装备库页面的"从截图导入"按钮
- 点击 → 打开上传界面（支持相册选取、拍照、粘贴）
- 上传后显示 loading（"正在识别装备..."）
- 识别完成 → 展示预览列表，每行可编辑/删除
- 用户确认 → 批量添加到清单或装备库

**实现：**
```typescript
// /api/ai/import-screenshot
// 接收 base64 图片，发送给 Claude Vision
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: imageType, data: base64Data }
        },
        {
          type: 'text',
          text: `识别这张图片中的装备/物品清单。提取每件物品的信息，返回 JSON 数组：
[
  {
    "name": "物品名称（中文优先）",
    "brand": "品牌（如有）",
    "model": "型号（如有）",
    "weight_g": 重量克数（如有，否则null）,
    "quantity": 数量（默认1）,
    "category": "分类", // apparel/footwear/tech/optic/health/doc/misc
    "note": "图片中关于这个物品的其他信息"
  }
]
只返回 JSON 数组，不要其他文字。如果图片不是装备清单，返回空数组 []。`
        }
      ]
    }]
  })
})
```

### 2.4 智能装备建议 (`/api/ai/suggest-gear`)

**触发时机：** 行程概览页的侧边栏或底部区域，不在打包视图中显示（不打断打包流程）

**三种建议类型：**

1. **天气感知**
   - 接入 Open-Meteo API 获取目的地天气预报
   - "你的行程期间预计有3天降雨，你的清单已包含硬壳，建议额外带防水袋保护电子设备"

2. **社区驱动**
   - 查询同目的地/场景的社区清单数据
   - "去屋久岛的用户中 87% 带了熊铃，你还没添加"
   - "同类行程平均基础重量 7.2kg，你当前 9.8kg，偏重"

3. **重量优化**
   - 分析用户清单，找出最重的非必需品
   - "你的 Big 3 占基础重量 62%。睡垫从 R5 Pro(680g) 换成 R4(420g) 可减重 260g"

**前端展示：**
在行程概览页"开始打包"按钮下方，以卡片形式展示 1-3 条建议。每条建议有：
- 图标（🌧️天气 / 👥社区 / ⚖️重量）
- 一句话建议
- [采纳] [忽略] 按钮
- 采纳后自动添加物品或标记变更

### 2.5 重量估算 (`/api/ai/estimate-weight`)

**触发时机：** 用户添加物品时只填了名称/品类，没填重量

**System Prompt：**
```
用户正在记录一件户外装备的重量。根据物品名称和品类，给出一个合理的重量估算。

物品：{name}
品类：{category}
品牌/型号：{brand} {model}（如有）

返回 JSON：
{
  "estimated_weight_g": 540,
  "confidence": "medium",  // high/medium/low
  "range_min_g": 450,
  "range_max_g": 650,
  "note": "Gore-Tex 硬壳通常在450-650g之间，具体取决于品牌和面料层数"
}
```

**前端展示：**
- 重量输入框旁边显示灰色斜体估算值："~540g (450-650g)"
- 标注"AI 估算"标签
- 用户可随时覆盖为实测值

### 2.6 行后复盘 (`/api/ai/post-trip-review`)

**触发时机：** 用户将行程状态改为"已完成"后，显示复盘入口

**输入数据：** 完整的行程清单 + 每个物品的 is_checked 状态 + 用户的 gear_reviews

**输出：**
```json
{
  "unused_items": [
    { "name": "商务衬衫", "weight_g": 960, "reason": "3件×320g，户外行程中未穿着" }
  ],
  "mvp_items": [
    { "name": "Gore-Tex 硬壳", "reason": "多雨环境下使用频率最高" }
  ],
  "optimization_suggestions": [
    "下次类似行程可减掉商务衬衫，减重960g",
    "考虑用速干T恤替代棉质T恤，单件减重约80g"
  ],
  "weight_comparison": {
    "this_trip_base": 9800,
    "community_avg_base": 7200,
    "potential_base_after_optimization": 8100
  }
}
```

---

## 三、AI 功能的前端入口位置

| 功能 | 入口位置 | 触发方式 |
|------|---------|---------|
| 对话式创建 | 新建行程弹窗顶部 | 输入框 + "AI 解析"按钮 |
| AI 生成清单 | 创建行程后自动 + 概览页"AI 补充" | 自动 / 按钮 |
| 截图导入 | 打包页"+"菜单 + 装备库页 | 按钮 → 上传界面 |
| 智能建议 | 行程概览页"开始打包"下方 | 自动加载，卡片展示 |
| 重量估算 | 添加/编辑物品弹窗的重量输入旁 | 自动（未填重量时） |
| 行后复盘 | 行程状态改为"已完成"后 | 按钮"查看 AI 复盘" |

---

## 四、数据流：AI 如何利用社区数据

```
用户创建行程（目的地=屋久岛，场景=徒步+露营）
  ↓
查询社区数据：
  SELECT items, weights FROM community_lists 
  WHERE tags && ['屋久岛', '徒步', '露营']
  ↓
聚合统计：
  - 最常携带的物品 TOP 20
  - 平均基础重量
  - 最容易忘带的物品（出现率<30% 但 post-trip 标记为"应该带"的）
  ↓
作为 context 传给 Claude：
  "社区数据显示，去屋久岛徒步的23位用户中，87%带了熊铃，平均基础重量7.2kg..."
  ↓
Claude 结合用户个人装备库 + 社区数据 → 生成个性化清单
```

---

## 五、成本控制

### Claude API 调用成本估算
- 对话式创建：~500 input + 500 output tokens = ~$0.003/次
- 清单生成：~2000 input + 1500 output tokens = ~$0.01/次
- 截图导入：~1000 input (含图片) + 800 output = ~$0.008/次
- 建议：~1500 input + 500 output = ~$0.005/次
- 复盘：~2000 input + 800 output = ~$0.008/次

**每用户每月估算：** 创建2个行程 + 3次截图 + 5次建议 + 1次复盘 ≈ $0.08/月
**Pro 订阅 $8/月，AI 成本占比 1%——利润空间充足。**

### 速率限制
- 免费用户：0 次 AI 调用
- Pro 用户：每分钟 10 次，每天 100 次，每月 500 次
- 超出限制：提示"今日 AI 额度已用完，明天再试"
