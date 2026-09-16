# Issues: EMO 情绪内耗测试结果个性化主题与滤镜系统工单

## 概述
本工单集将 PRD `prd-emo-result-themes-and-filters.md` 拆解为 3 个垂直切片任务，采用垂直贯穿（Tracer Bullet）原则推进。

---

### Issue #1: 构建 10 大画像专属主题定义与解析引擎 (emo-themes.ts)

#### What to build
在 `app/emo/utils/emo-themes.ts` 中建立完整的数据字典与提取方法。为 10 大画像（`low`, `bnd`, `high`, `rum`, `sen`, `pls`, `sen_pls`, `rum_low_bnd`, `burnout`, `isolated`）分别配置：
- `paperBg`: 纸张底色与背景纹理 class
- `text`: 主文字颜色与强调字色
- `cardBorder`: 卡片外边框样式、粗细与轮廓
- `cardShadow`: 专属复古阴影或霓虹阴影
- `tearStyle`: 顶部/底部撕裂线与齿孔风格
- `stamp`: 专属财务防伪出纳钢印样式（印泥边框色、背景色、印文标题、副标）
- `titleBadge` / `tagBadge`: 鉴定结果标题徽章与标签胶囊背景
- `barGradient`: 6 维常模进度条填充色
- `quoteBox`: 心理侧写与金句框专属边框及底色
- 导出 `getEmoTheme(key?: string): EmoThemeConfig` 安全获取函数，包含稳健默认兜底。

#### Acceptance criteria
- [ ] 导出强类型接口 `EmoThemeConfig` 与字典 `EMO_THEMES`
- [ ] 涵盖全部 10 大核心画像，每套配色均有鲜明性格反差与情绪隐喻
- [ ] 提供无异常的默认 fallback 主题，面对未知 key 零报错

#### Blocked by
- None - can start immediately

---

### Issue #2: 改造主结果页 ResultReceipt 与截屏保存链路

#### What to build
改造 `app/emo/components/ResultReceipt.tsx`：
1. 根据当前测试结果画像（`result.key`）动态调用 `getEmoTheme(result.key)`。
2. 将原本死板的静态白底黑框全面解耦，接入动态主题。
3. 防伪钢印（Stamp）改为动态渲染对应画像的专属印章（如【绝缘认证】、【赤字爆表】、【止损入库】等）。
4. 优化 `handleSave` 截屏保存：将 `htmlToImage.toPng` 的 `backgroundColor` 设为对应主题底色，杜绝移动端截屏白边。
5. 确保骨架屏、锁定提示浮层与解锁后内容无缝融入主题视觉。

#### Acceptance criteria
- [ ] 访问 `/emo/preview?id=low`、`?id=high`、`?id=rum` 等可肉眼观察到底色、边框、印戳与进度条的动态切换
- [ ] 点击保存截屏，生成的图片无白边错位，钢印与各色块渲染正常
- [ ] 保证解锁鉴权机制（卡密输入、一码全通逻辑）完全不受任何负面影响

#### Blocked by
- Issue #1

---

### Issue #3: 好友共享档案卡片 SharedReceiptCard 视觉联动与端到端回归

#### What to build
改造 `app/emo/components/SharedReceiptCard.tsx` 与分享链接载荷解析：
1. 确保分享 URL 中携带画像 key（`k` 字段）。
2. `SharedReceiptCard` 接收到 `shareData.k` 后，动态应用对应的 `EMO_THEMES` 样式，使受邀好友一进入就能看到专属的滤镜色彩与印章。
3. 端到端回归测试：从答题 -> 结果页展示 -> 点击保存截屏 -> 复制分享链接 -> 模拟好友打开，确保全闭环一致性。

#### Acceptance criteria
- [ ] 好友共享副本卡片呈现对应画像的主题配色与印戳
- [ ] 10 大画像全流程测试通过，UI 视觉无崩溃或样式错乱

#### Blocked by
- Issue #2
