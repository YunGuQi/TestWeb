# 手机复制板（/copy）

从 `xhs-draft-console/public/mobile-hub` 拆出的**纯静态公开访问**多测试矩阵文案复制板。

- 地址：`https://test.mutong-xhs.top/copy/`
- 支持 5 大测试切换：
  1. `family-origin`：大女主觉醒测试
  2. `emo`：深度情绪内耗测试
  3. `destiny-lover`：命定恋人测试
  4. `city`：性格城市匹配测试
  5. `love-species`：恋爱物种分析
- 能力：服务端静态按测试索引 + 自动拉取文案 md + 服务端自动拉取切片图 → 按卡展开 → 封面/标题/正文/标签一键复制 → 切片画廊预览/大图/单张保存/批量保存全部图片
- 容错与兜底：无文案测试优雅显示「暂无文案」；切片图支持双规则（`card.slice` 与 `{cardId}_slice.png`）自动回退与占位，绝不阻断操作。
- 访问控制：公开访问，无需口令，无需后端服务，纯前端客户端解析与复制。
- **明确禁止**：自动填表、自动发帖、CDP、Chrome 用户目录、定时发布。

---

## 目录结构规范：按测试分目录隔离

所有文案与切片静态资源按测试 ID 完全隔离存储：

```text
design/mobile-copy-board/data/
├── tests.json                    # 5 大测试基础清单
├── family-origin/                # 大女主觉醒测试
│   ├── index.json                # 文案索引
│   ├── 2026-11-09_批量第1批4篇.md
│   ├── 2026-11-09_试扩4篇.md
│   ├── 2026-11-09_试点4篇.md
│   ├── 2026-11-09_发帖文案.md
│   ├── 2026-10-28_发帖文案.md
│   ├── 2026-10-10_发帖文案.md
│   └── slices/                   # 切片图 (r1_m1_slice.png ~ r6_m4_slice.png 等)
├── emo/                          # 深度情绪内耗测试
│   ├── index.json                # 暂无文案时为 []
│   └── slices/                   # 60 张切片图
├── destiny-lover/                # 命定恋人测试
│   ├── index.json                # 暂无文案时为 []
│   └── slices/                   # 96 张切片图
├── city/                         # 性格城市匹配测试
│   ├── index.json                # 暂无文案时为 []
│   └── slices/                   # 96 张切片图
└── love-species/                 # 恋爱物种分析
    ├── index.json                # 暂无文案时为 []
    └── slices/                   # 96 张切片图
```

---

## 切片图加载双规则与容错机制

为彻底杜绝卡片切片图找不到（如 r6 等卡片），解析与渲染流水线采用**双规则级联检索**：

1. **规则一（优先指定）**：读取卡片元数据中的 `切片=xxx.png`（`card.slice`）。
2. **规则二（标准兜底）**：读取标准命名 `{cardId}_slice.png`。
3. **前端自动容错**：
   - 图片发起请求时优先使用规则一；
   - 若规则一图片触发 `error`，自动无缝重定向尝试规则二；
   - 若两者均未命中，安全退化为「暂无切片」占位框并显示预期文件名，绝不抛错，保证文案复制功能 100% 正常。

---

## 切片图源头与 MD5 唯一性说明（6 张不同图 vs 24 文件架构解析）

线上及本地 `data/family-origin/slices/` 下共有 24 个切片文件名（`r1_m1_slice.png` ~ `r6_m4_slice.png`），按文件内容 MD5 实测共有 **6 张唯一切片图**。

### 1. 源文件夹实测与真源确认
- **原始业务母本真源**：`design/product-docs/大女主觉醒测试/assets/结果测试截图/cards/`
  * 文件总数：**6 个**，唯一 MD5 总数：**6 个**。
  * `01_r1_内核超稳的满级大女主.png` -> `76f3743ce9f4a83436b5880c188d205d`
  * `02_r5_气场全开的六边形女王.png` -> `16338bf934d95ab6b369dd004448215c`
  * `03_r2_带刺盛开的傲骨黑莲花.png` -> `30daad7fb9707775f3df28959291cfb7`
  * `04_r3_清冷清醒的结界女王.png` -> `2fba727a8e2ba86dca5308dad647bfdb`
  * `05_r6_不被驯化的破茧大女主.png` -> `eae91cc2404061bf25c0bd2e80e8b82a`
  * `06_r4_优雅自渡的暗夜蔷薇.png` -> `a93fc9b0631a8d9efd5d4308812fc157`
- **控制台打包产物源**：`design/xhs-draft-console/dist/mobile-hub/slices/dnvzhu_real/`
  * 文件总数：**48 个**（24 个 `_p1.png` + 24 个 `_slice.png`）。
  * 24 个 `_p1.png` 中唯一 MD5 总数：**6 个**（与母本真源 6 张原图 100% 完全匹配）。
  * 24 个 `_slice.png` 中唯一 MD5 总数：**6 个**（由 6 张母本原图经由切图算法按中段 1/3 高度裁剪生成）。

### 2. 设计与业务逻辑说明
- **每轮 4 张共用一张切片图是原本的业务设计，并非同步或复制出错**。
- **业务依据**：大女主觉醒测试在业务产品逻辑上共定义了 6 种人格结果（r1 ~ r6）。发帖矩阵为了多角度获客切入，针对每种结果设计了 4 种文案模式（m1 纯享/通报、m2 反差/反转、m3 扎心/痛点、m4 爽文/金句）。因为 r1 的 4 篇文案测试出的均为同一个结果画像（「内核超稳的满级大女主」），其在小红书展示的结果证明切片图必须与该结果保持一致，故 r1_m1 ~ r1_m4 必然共用 r1 对应的测试结果切片。
- **纪律红线**：禁止为了凑 24 个不同 MD5 去凭空合成或复制假图；`data/family-origin/slices/` 保持原样，无需重同步。

---

## 刚性工作流：新增/更新测试文案与切片图标准流水线

电脑上每为某个测试生成新文案 Markdown 或切片图，严格遵循以下流程：

1. **归档原文档与原始图片**：
   - 将新文案 `.md` 放入对应测试的文档目录（如 `design/product-docs/大女主觉醒测试/docs/`）；
   - 将生成的切片图放入产品 assets 目录；
2. **同步至复制板并刷新多测试索引**：
   - 将新文案 `.md` 放入 `design/mobile-copy-board/data/<测试id>/`；
   - 将对应切片图放入 `design/mobile-copy-board/data/<测试id>/slices/`（或直接让脚本自动拉取）；
   - 执行同步脚本：
     ```bash
     node design/mobile-copy-board/sync-data.js
     ```
     该脚本会自动扫描所有 5 个测试目录，验证每张卡片的规则一/规则二切片就绪情况，从候选池自动同步补齐图片，并刷新各自的 `index.json` 与顶层 `tests.json`。
3. **提交并推送到 GitHub**：
   ```bash
   git add design/mobile-copy-board/
   git commit -m "feat(copy-board): 更新测试文案与切片"
   git push origin deploy/aws
   ```
4. **同步部署到宝塔服务器**：
   ```bash
   scp -r design/mobile-copy-board/* root@114.132.183.186:/www/wwwroot/copy-board/
   ```

**手机端效果**：团队成员无需在手机端导入任何文件，刷新 `https://test.mutong-xhs.top/copy/` 即可通过顶部「测试」选择器自由切换 5 大测试，查看对应文案、卡片与切片。

---

## 宝塔部署路径参考

- 静态页面根目录：`/www/wwwroot/copy-board/`
- 数据总目录：`/www/wwwroot/copy-board/data/`
- 各测试数据目录：`/www/wwwroot/copy-board/data/<testId>/`
- 各测试切片目录：`/www/wwwroot/copy-board/data/<testId>/slices/`
