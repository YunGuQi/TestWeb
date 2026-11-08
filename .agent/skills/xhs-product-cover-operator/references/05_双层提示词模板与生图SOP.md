# 05_双层提示词模板与生图SOP

本规约提供小红书千帆 1:1 测试商品主图的标准化生产工作流与双层提示词脚手架模板。

---

## 1. 生产脚手架模板 (Production Scaffolds)

### A. 外部专业 AI 绘图提示词脚手架 (External AI Tools / Midjourney)
专为外部专业工具优化，注重结构化视觉语言、英文版面描述、精准规避克隆元素，并独立双引号列出中文文字：

```text
Use case: ads-marketing
Asset type: 1:1 Xiaohongshu fun-test product cover
Primary request: generate a finished single-page cover, strictly avoid duplicate elements
Input images: bundled reference-[danger|mbti|family|romance] style reference

Style/medium:
- High-density Japanese chibi anime illustration with modern editorial layout
- Warm cream background with subtle gradients, soft paper grain, playful hand-drawn doodles and stars
- Rich visual hierarchy, clean separation between text and illustration, commercial magazine poster feel

Layout & composition:
- Square 1:1 ratio
- Top 60-70%: Left side features a prominent Chinese headline occupying 35% canvas with transparent title container. Right side features a charismatic chibi anime maiden [character description], surrounded by strictly 4 distinct floating speech monologue bubbles (no repeated phrases)
- Mid-left: 3 stacked rounded dimension capsules displaying factual test metrics
- Bottom 30-40%: A horizontal status bar showcasing 6 to 8 circular avatar result badges, directly above EXACTLY ONE SINGLE centered wide pill button (strictly no side-by-side buttons, no duplicate buttons)

Color palette:
- Dominant colors: [Primary Theme Color, Secondary Color, Accent Color]
- High contrast, playful yet emotionally resonant, unified scene-palette binding

Text (verbatim):
- Top headline: "【主标题全称】"
- Subtitle hook: "【一句话痛点副标】"
- Dimension capsules (stacked):
  1. "【维度1名称】 | 【维度1解析】"
  2. "【维度2名称】 | 【维度2解析】"
  3. "【维度3名称】 | 【维度3解析】"
- Floating speech bubbles (strictly 4 unique phrases):
  1. "【扎心心声1】"
  2. "【扎心心声2】"
  3. "【扎心心声3】"
  4. "【扎心心声4】"
- Bottom result badges: "【结果1】", "【结果2】", "【结果3】", "【结果4】", "【结果5】", "【结果6】"
- Centered CTA button: "【✦ 开启深度测试 ✦】"
- Metadata note: "【N道精选题 · M分钟测完 · 专属报告】"

Avoid:
- duplicate buttons, twin buttons, repeated text bubbles, cloned elements, double CTA, side-by-side buttons, fake barcodes, distorted faces, dark horror themes
```

---

### B. 英文原生生图提示词 (Pure Image Generation Prompt)
用于 Midjourney / SDXL 等外部模型的纯英文提示词（移除易被画乱的中文，保留视觉结构与占位符）：

```text
A finished commercial 1:1 infographic poster for a viral personality test, Japanese chibi anime illustration style. On the right, a charming expressive anime girl with [character hair/clothing] showing an emotional gesture, surrounded by four floating comic dialogue bubbles with cute icons. On the upper left, bold typographic headline blocks, accompanied by three neatly stacked rounded dimension capsule tags. In the lower section, a horizontal row of 6 circular mini chibi character badges displaying different personality archetypes. At the absolute bottom center, exactly one single wide rounded CTA pill button with a click arrow icon. Clean magazine cover layout, warm pastel cream backdrop with subtle glow, masterpiece, highly detailed graphic design --ar 1:1 --no duplicate buttons, double buttons, cloned elements, split layout
```

---

## 2. 垫图资产索引 (Bundled Reference Assets)

技能内置的对标基准图位于 `assets/` 目录：
- `assets/reference-danger.jpg`：潮酷冲突型（黑紫粉绿，高反差）
- `assets/reference-mbti.jpg`：清新测试型（薄荷粉紫，高亲和）
- `assets/reference-family.jpg`：情绪叙事型（黄昏暖灰，高治愈）
- `assets/reference-romance.jpg`：治愈浪漫型（蜜桃香槟，高浪漫）
- `assets/reference-city.jfif`：城市人格/实体卡片型
- `assets/reference-destiny.jfif`：命定恋人/信件邮戳型

执行生图或提供提示词时，必须明确指定最匹配的基准图作为垫图/风格参考。

---

## 3. 产物落盘与文案关联 SOP (Output & Binding SOP)

1. **落盘路径**：
   - 生成的最终 1:1 封面图必须保存至：
     `design/product-docs/<测试中文名>/assets/`
   - **命名规范**：必须携带日期批次（如 `YYYYMMDD_v1_cover.png`），保留历史迭代版本。

2. **自动文案追记（强制关联）**：
   - 封面图落盘后，检查是否存在当日发帖文案文件：
     `design/product-docs/<测试中文名>/docs/YYYY-MM-DD_发帖文案.md`
   - 若文件存在，主动在文案尾部追记图片关联指针：
     ```markdown
     👉 **千帆商品封面主图**：../assets/YYYYMMDD_v1_cover.png
     ```
   - 若该文件尚未生成，则不进行追记（严禁凭空新建空气文档）。
