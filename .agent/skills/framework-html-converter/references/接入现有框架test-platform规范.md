# 接入现有框架 (test-platform) 统一大盘开发规范

当用户选择将单文件 HTML **“融入当前的框架版 (test-platform 统一大盘)”**时，AI 助手在执行注水升级 (Hydrate) 前，必须遵循本规范进行目录组织、数据库建模、API 设计与页面整合。

---

## 1. 核心架构认知：什么是“统一大盘”？

- **平台统一性**：`design/test-platform/` 已经是具有完整后台管理 (`/admin`)、数据库体系 (PostgreSQL / SQLite + Prisma) 和后端 API 的超级大本营项目。
- **无需新建工程**：严禁为每一个新增心理测试去 `npx create-next-app` 创建独立的工程目录或新部署网站；所有的心理测试应当成为大楼里的一间新房间，共享同一个域名及后厨处理能力。

---

## 2. 目录结构与物理规范

1. **前端主路由**：
   - 页面代码统一存放在 `design/test-platform/app/<测试标志 ID>/` 目录下（例如 `app/emo/page.tsx`、`app/city/page.tsx`）。
   - 可复用的前端子组件放在 `design/test-platform/components/<测试标志 ID>/` 目录下。
2. **后端 API 路由**：
   - 如果是可以高度抽象通用的核心接口（如 `/api/questions`、`/api/submit`、`/api/history`），通过查询参数 `?testId=<测试标志 ID>` 区分数据。
   - 如果测试具有特殊业务计算（例如 `city` 的 5 维雷达距离计算），可新建专属后端路由 `design/test-platform/app/api/<测试标志 ID>/`。
3. **样式管理**：
   - 全局共用项目基础样式表（如 `app/globals.css` 或 Brutalist/Tailwind 主题类）；如需测试独有视觉样式，可在页面内联或补充基础类名，严禁破坏既有的样式系统。

---

## 3. 数据库与表结构隔离规范 (`schema.prisma`)

所有的心理测试数据共用同一个 Prisma Schema。核心模型通过 **`testId`** 字段实现严格的水平租户隔离：

```prisma
model Question {
  id      Int      @id @default(autoincrement())
  testId  String   @default("emotional-friction") // 必须带上测试标识 ID
  order   Int
  text    String
  options Option[]
}

model ResultConfig {
  id        Int     @id @default(autoincrement())
  testId    String  @default("emotional-friction") // 区分具体是哪个测试的性格卡片
  title     String
  desc      String
  quote     String
  imageUrl  String
  condition String
}

model TestRecord {
  id        String   @id @default(cuid())
  testId    String   @default("emotional-friction")
  deviceId  String?
  answers   String   // JSON 字符串形式的答案 ID 映射
  resultId  Int?     // 指向 ResultConfig
  createdAt DateTime @default(now())
}
```

- **强制要求**：任何新增和修改的操作，查询条件 `where` 语句中**必须带上 `testId: '<项目 slug>'`**，严禁未设过滤器读取全表导致多个测试题库错位窜数据。
- **数据库连接与数据上传**：测试大盘的 Prisma Postgres 云端数据库环境**已经准备就绪**（环境变量已配置好）。如果遇到连接失败，优先排查网络连通性。在开发新测试时，无需再询问用户是否需要部署数据库，而是应当直接在后续研发步骤中，**自动执行**结构推送和数据播种（如 `npx prisma db push` / `npx prisma db seed`）将数据上传至云端数据库。

---

## 4. API 安全与后厨计算标准

在转换和接入时，必须强制落实以下安全性及服务能力：
1. **题目脱敏 (`GET /api/questions`)**：
   - 返回的数据报文只保留 `id` 和 `text`，**严格剔除选项中的计分权重 (`scores`) 字段**，杜绝从浏览器 F12 控制台预读权重规律。
2. **服务端闭环算分 (`POST /api/submit`)**：
   - 接口接收参数：`{ deviceId, answers: { [questionId]: optionId }, testId }`。
   - **核心算分转移**：根据数据库读取对应该 `testId` 的答案权重，在服务端算出各项得分、总消费摩擦值 (`totalFriction`) 或多维雷达坐标，匹配对应的 `ResultConfig` 结论条目。
   - 组装带 `billItems` (消费账单明细) 或特性分析列表的小票账单对象。
   - 持久化写入 `TestRecord` 表。
3. **云端历史收据 (`GET /api/history`)**：
   - 根据入参 `deviceId` 与 `testId` 读取 `TestRecord` 历史记录表。
   - 服务端返回封装完整小票概览和结论属性的信息，免除前端使用 `localStorage` 缓存结果及单机数据流失。

---

## 5. 后台管理系统 (`/admin`) 兼容集成

`test-platform` 自带后台运营面板（`/admin`）。为了让管理员能从同一个面板管理各分站项目：
- 确保新增测试的 `testId` 在顶部项目切换下拉菜单中可选。
- 保证 `/admin/questions`（题目管理）、`/admin/results`（结论卡管理）及 Overview（大盘统计）支持依 `testId` 进行对应项目的独立增删改查。

---

## 6. 交互与细节体验强制规范

在进行具体测试的开发与融入时，必须遵守以下 6 条强体验规范：
1. **答题页选项印章常驻**：答案被点击后显示的“盖章”或选中动效，不要在短暂 Timeout 后清除，必须**常驻保留**在当前被点击的选项上，除非用户切换了选项。
2. **历史记录模块**：测试完成后必须有历史结果的存档功能。不仅要在后端记录，前端同时也需强制将结果摘要存入 `localStorage`（防止数据库宕机时无记录）。并在**首页**提供「查看历史档案」的明确弹窗或入口。
3. **私域激活码拦截**：所有测试的【结果页核心解析区】和【保存图片/账单】功能，默认必须被**模糊遮罩**覆盖。用户必须通过弹出的验证框输入从小红书引流获取的**激活码（验证码）**，通过 `/api/verify` 接口校验后，方可解锁全部解析文本并允许点击保存长图。
4. **首页在线人数**：首页展示的“已有 XX 人解密”等氛围数据，基数不宜过分夸张，随机范围建议控制在 `0-100` 之间。
5. **探索大厅引流**：在首页及结果页底部的明显位置，必须提供“探索其他测试”的直接入口，且必须统一超链接回系统大厅（`href="/"` 或 `/design/common/lobby.html`）。
6. **维度条防同质化**：结果页中若有雷达图或各个维度的条形比例展示，数值必须精确到**小数点后两位**，并利用 `Math.random()` 产生微小扰动避免所有人的截图数据完全一样。维度条的进度颜色需使用**双拼渐变色**（从左到右：左边深色，右边浅色，如 `bg-gradient-to-r from-[深色] to-[浅色]`）。
7. **运营大盘（/ops-dashboard）兼容与专属卡密前缀**：在上线或新增测试时，必须将该测试添加到后台运营大盘（`/ops-dashboard`）顶部空间导航栏（如 `AdminNav.tsx`）的工作区下拉菜单 `TESTS` 列表中，确保运营管理员可随时在大盘后台切换至该项目，进行卡密（激活码）的独立生成/管理/导出，以及对应题目与结果海报的统计和查阅。同时，**必须为每个测试在后台生成卡密接口（如 `/api/admin/generate`）中配置其专属的卡密前缀（如情绪内耗为 `EMO-`，城市匹配为 `CITY-`，命定恋人为 `DESTINY-`），禁止所有项目统一混用 `CODE-` 前缀**。
8. **数据库优先（DB-First）与本地全权常数兜底（Local Fallback）双向高可用**：每一个接入当前框架的测评项目，必须分别准备云端数据库表（`Question`、`Option`、`ResultConfig`，通过 `testId` 分散）与完整的本地静态数据文件（如 `lib/<testId>-data.ts` 包含题库与匹配结果）。任何题库查询 API（如 `/api/questions`、`/api/city/questions`）和答题算分 API（如 `/api/submit`、`/api/city/submit-test`），必须采取**“优先通过数据库动态查询；当遇到断网、云端超时、数据库异常或查询结果为空时，自动向本地常数题库和结果库降级兜底”**的机制，确保系统无论是生产在线运维、运营改动，还是本地断网调试，用户均能够 100% 完成从答题、分数判定到精美小票打印渲染的整个交互流程，永不白屏报错。

