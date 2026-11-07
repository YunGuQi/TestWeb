# Issues: 移动端手机视口适配与文本排版防折行加固任务工单

## 概述
本任务集将移动端适配与防折行加固工程划分为 3 个垂直切片工单，严格遵循依赖顺序执行。

---

### Issue 01: 修复 City 测试封存遮罩卡片（OrderOverlay）文本与按钮换行缺陷
- **Parent**: PRD 移动端手机视口适配与文本排版防折行加固规范
- **Target File**: `app/city/components/OrderOverlay.tsx`
- **Blocked by**: None — can start immediately
- **Status**: ready-for-agent
- **What to build**:
  1. 重构封存卡片标题：将 `🎫 列车长查验 · 专属单程车票已封存` 优化为 `🎫 专属车票深度避难指南已封存`，增加自适应字号与 `whitespace-nowrap`，彻底消除 375px 下“已封存”落单折行的现象；
  2. 修复解锁按钮内文字折行：优化按钮宽度容器，设定 `w-full max-w-[290px] px-3.5`，添加 `whitespace-nowrap`，使得 `🔓 【列车长验票】立即检票解锁 ➔` 在 375px/360px 宽度下单行完整居中展示；
  3. 调整副标题文字与说明段落的最大宽度约束，保持卡片整体视觉紧凑居中。
- **Acceptance Criteria**:
  - [ ] 375px 宽度下，OrderOverlay 标题 100% 单行展示，无任何折断；
  - [ ] 375px 宽度下，OrderOverlay 主解锁按钮内部文字 100% 单行展示；
  - [ ] 点击解锁唤起弹窗逻辑 100% 保持正常。

---

### Issue 02: 优化 City 测试车票头部安全区与标签防折断排版
- **Parent**: PRD 移动端手机视口适配与文本排版防折行加固规范
- **Target File**: `app/city/components/ResultView.tsx`
- **Blocked by**: Issue 01
- **Status**: ready-for-agent
- **What to build**:
  1. 移除 811 行和 828 行不必要的全局 `pr-20`（80px 挤压），为避难所取景地地标与车票标签腾出横向可用空间；
  2. 在城市称号、副标题与避难所胶囊上添加 `whitespace-nowrap` 和合理的弹性换行保护；
  3. 遍历城市 tags 标签列表，为每一个 tag 挂载 `whitespace-nowrap`，杜绝词内断裂；
  4. 为常模自尊高光 Badge 中的排名文案补充 `shrink-0 whitespace-nowrap`，防止“同行旅人”折断。
- **Acceptance Criteria**:
  - [ ] 375px 视口下，车票头部避难所地标连贯易读；
  - [ ] 16 大城市所有标签 tag 绝不出现单字折行；
  - [ ] 右上角钢印戳与周围文字无视觉穿模重叠。

---

### Issue 03: 强化其余四大测试（emo, destiny-lover, family-origin, love-species）移动端排版护栏
- **Parent**: PRD 移动端手机视口适配与文本排版防折行加固规范
- **Target Files**:
  - `app/emo/components/ResultReceipt.tsx`
  - `app/destiny-lover/components/ResultReceipt.tsx`
  - `app/family-origin/components/ResultReceipt.tsx`
  - `app/love-species/components/ResultView.tsx`
- **Blocked by**: Issue 02
- **Status**: ready-for-agent
- **What to build**:
  1. `emo`：为标签胶囊与出纳账单关键栏目添加 `whitespace-nowrap`；
  2. `destiny-lover`：为初遇画卷标题与契合度人数卡片增加窄屏自适应容错；
  3. `family-origin`：为大女主切片编号与小标题增加 `whitespace-nowrap`；
  4. `love-species`：为 6 维雷达图容器在 360px~375px 下增加紧凑内边距容错，标签加防溢出保护。
- **Acceptance Criteria**:
  - [ ] 5 大测试在 360px ~ 430px 全区间移动端视口下无异常换行；
  - [ ] 页面横向零溢出，无左右晃动；
  - [ ] 运行 `npx tsc --noEmit` 100% 编译通过零报错。
