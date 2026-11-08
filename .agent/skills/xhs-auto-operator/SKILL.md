---
name: xhs-auto-operator
description: Master orchestrator for Xiaohongshu (小红书) psychological quiz projects. Use when executing the full end-to-end quiz lifecycle across account setup, data benchmarking, test development, note assets, product covers, and deployment.
---

# Xiaohongshu Quiz Maker (小红书趣味心理测试操盘手)

This skill guides the AI to end-to-end execute a "Psychological Quiz" traffic & monetization project on Xiaohongshu.

## Quick start

When triggered (e.g., via `/xhs-auto-operator`), **ALWAYS check the conversation context first to determine the current Phase.** Reply to the user:
> "Detected current progress: [Phase X]. Reading SOP and continuing execution."

## Core Execution Principles (核心操盘原则)
1. **Cinematic Polish (降维视效)**: 超越普通表单 UI，在微动效、氛围渐变与排版层级上建立高维质感。
2. **Gate-Locked Stepping (门禁步进)**: 一步一确认，单次仅抛一个核心拍板项；严禁未获授权一口气跨阶段推进。
3. **Emotional Resonance (高情绪价值)**: 无论逻辑多简单，文案必须提供极致情绪价值，直击痛点与身份认同。
4. **Adaptive Viewport (全端自适应)**: 布局严密适配移动端高/矮屏及桌面端，杜绝遮挡与重叠。
5. **Zero-Mutation Baseline (零变更基线)**: 严格复用现有前端依赖与 Prisma 既有表结构；新增测试逻辑闭环在 `design/test-platform/app/<test_name>/` 独立目录内，杜绝生产环境污染。

## Workflows (执行节奏控制)

This is a 6-phase pipeline (Phase 0 ~ Phase 5).

**GATE (Mandatory Pause)**: After completing any Phase, you MUST report the output to the user. **CRITICAL: PAUSE EXECUTION.** Do NOT proceed to the next Phase (including spawning subagents or reading the next SOP) until the user explicitly authorizes it. Proceed ONLY when given explicit "continue/approve" instructions.

### Phase 0: Account Setup
1. Read silently: `references/00_账号基建篇.md`.
2. Generate account setup proposals (Name, Avatar, Bio) based on the specified archetype.
3. **Completion criterion**: 交付 3 组完整账号方案（命名 + 头像生图 Prompt + 简介钩子 + 变现路径）。PAUSE and wait for explicit user confirmation at GATE.

### Phase 1: Data Discovery (爆款对标)
1. After GATE approval, read silently: `references/01_爆款对标篇.md`.
2. **MUST ask first**: "Is this topic benchmarking against Xiaohongshu viral hits, or extracting from a Bilibili video?"
3. Generate and output standard benchmarking report:
   - 若为 B 站互动视频：调用 `uv run python .agent/skills/xhs-auto-operator/scripts/bilibili_ripper.py <BVID> -o "design/product-docs/<测试名称>/docs/benchmark_bilibili/"` 提取题库与结局分支，并结合多模态补全分析。
   - 若为小红书：依灰豚数据筛选低粉高赞爆款进行逆向拆解。
4. **【强制自动落盘规范】**：无论通过 B 站互动视频逆向还是小红书对标拆解，必须自动将【题目、答案、权重分值、结果判定矩阵、深度心理分析】整理为标准 Markdown 方案，保存至：
   `design/product-docs/<测试名称>/docs/product_plan.md`
   作为后续 Phase 2 研发与 Phase 3 发帖的唯一可信源（SSOT）。
5. **Completion criterion**: 对标拆解报告生成且 `product_plan.md` 完整落盘。PAUSE and wait for user approval at GATE.

### Phase 2: Test Development (测试架构与研发门禁)
> [!IMPORTANT]
> 严格对齐项目主规约 `CLAUDE.md`：**研发三阶段刚性推进，主对话零代码、只审不改**。淘汰单 HTML 路线，所有业务全量收敛至全栈平台 `design/test-platform/app/<new_test_name>/`。

1. **Step 1: 策划与精算建模 (Plan)**
   - 调阅 `references/02_测试设计_1_策划与方案篇.md`，基于 `product_plan.md` 输出轻量测试方案。
   - 遵循 `references/02_测试设计_2_题库模型与结果分析精算规范.md` 设计等权题库、常模分位精算与 Golden 6-Pack 结果池。
   - **心理学模型注入**：必须调用 `marketing-psychology` 技能（利用损失厌恶、沉没成本、身份认同）打磨痛点与高情绪价值文案。
   - **门禁点**：经大哥拍板确认后方可进入下一步。
2. **Step 2: 规约与工单拆解 (Spec & Tickets)**
   - 调阅 `references/02_测试设计_4_全栈研发大盘篇.md` 与 `references/02_测试设计_3_通用UI与排版规范.md`。
   - **须先询问大哥指定执行体**，再发指令（PRD 走 `/to-spec`、工单走 `/to-tickets`）委派子代理落盘 `.scratch/<feature-slug>/issues/NN-*.md`（含 CodeGraph 锚点与 AC）。只出文档不改代码、只回摘要。
3. **Step 3: 执行体施工与全链路审查 (Execute & Review)**
   - **工单全量落盘后，须先询问大哥指定执行体**（严禁越级碰码）。
   - 实现体严格在子代理/新对话中实施，UI 遵循设计工程规范建立视觉层级与微交互。
   - 实现体验收前严格对照 `references/02_测试设计_6_自检清单.md`（Layer 0 核心红线、Layer 1 商业闭环、Layer 2 算法仿真）逐条机器闸门自检通过。
   - **主对话只审不改**，按 AC 验收。
4. **Completion criterion**: 全量工单实施完毕，本地运行测试绿灯，自检清单全绿无违规。PAUSE and wait for user approval at GATE.

### Phase 3: Posting Assets & Note Pipeline (发帖物料与图文生产线)
1. After GATE approval, **载入并遵循独立技能 `xhs-note-operator`**（`../xhs-note-operator/SKILL.md`）——按其【阶段 1：文案编排与源头自检】逐步执行。**画像 / 档位闸门（A/B/C）/ 取材七型 / 四大模式 / 10个医疗禁词与4个0词表 / 自检清单 / 5大物理硬规格，全部以该技能为唯一真源，本文件不复述任何一条。**
2. **形态刚性**：Phase 3 **唯一**交付形态 = 纯色大字封面 + 零编辑一键复制文本卡片（正文切图为可选加分项）。已作废的「答题图文实装流」及其 `生成排版图.html` **不再产出、不再引用**。封面视觉规范与多图口径的**唯一真源是 `xhs-note-operator`**，本文件不复述。
3. **Completion criterion**: 阶段 1 完成判据全部满足（结果日例文档独立落盘、`refine-notes.js` 核验 0 违规、10 个医疗词全部 Clean）。PAUSE and wait for user approval at GATE.
4. **草稿落地 (可选/进阶)**：文案经大哥确认后，若需批量或单条灌入小红书创作者后台存入草稿箱，无缝切入【阶段 2：创作者后台自动化录入与草稿管理】（`../xhs-note-operator/references/06_草稿发布与操作手册.md`），自动完成防重判重、官方文字配图生成、1/3测评切片上传、官方蓝色话题实体转换、商品挂车、Closed Shadow DOM 穿透暂存与源文档进度回写。

### Phase 4: Store Listing Assets (千帆商品图与主图海报)
> [!NOTE]
> 本阶段专职负责**千帆店铺内展示与挂车售卖的商品封面/海报**（Q 版萌娘+四角高密爆梗），与 Phase 3 的发帖轮播切图完全隔离。
1. After GATE approval, **载入并遵循独立技能 `xhs-product-cover-operator`**（`../xhs-product-cover-operator/SKILL.md`）。
2. **单一真源**：5 要素黄金转化排版、去重防克隆门禁、生图提示词模板与尺寸规范**全部以 `xhs-product-cover-operator` 为唯一真源，本文件不作冗余复述**。
3. 依子技能交付 1:1 封面落盘至 `design/product-docs/<测试名称>/assets/`。
4. **Completion criterion**: 千帆 1:1 黄金商图交付并通过质量清单验收。PAUSE and wait for user approval at GATE.

### Phase 5: Build, DLP Bypass & Deployment (构建脱壳与发布运维)
1. After GATE approval, read silently: `references/03_部署与运维篇.md`, `references/04_跨平台构建与部署避坑指南.md`, `references/05_防泄密与安全脱壳规范.md`.
2. **一键特权脱壳打包 (DLP Pipeline)**：
   - 切换至 `design/test-platform` 根目录执行：
     ```bash
     npm run pack
     ```
   - 自动化流程自动完成：内联防加密 CSS 提炼 ➔ 生产构建 ➔ Node.js 特权脱壳排除本地库并生成明文 `deploy.zip`。
   - 严禁使用 PowerShell 原生压缩命令。
3. **部署执行与环境同步**：
   - 国内稳定节点：将 `deploy.zip` 上传宝塔服务器并解压至 `/www/wwwroot/`。
   - 海外/北京 Vercel 节点：代码推至 GitHub，若涉及新环境变量，登录 Vercel 控制台同步并触发 Redeploy。
4. **线上终审真机验活**：
   - 访问子域名测试入口（如 `https://test.mutong-xhs.top/<test_name>`）。
   - 校验 Cloudflare Turnstile 人机验证、JWT 签名鉴权、激活码核销流与最终出票闭环。
5. **Completion criterion**: 生产环境部署绿灯、真机链路跑通、临时日志与脱壳脚本文档已随手彻底清理。Task fully completed!

## Reference Assets (私有资产)
- [阶段0 账号基建 SOP](references/00_账号基建篇.md)
- [阶段1 挖掘寻宝 SOP](references/01_爆款对标篇.md)
- [阶段2 测试设计 (策划与方案篇)](references/02_测试设计_1_策划与方案篇.md)
- [阶段2 测试设计 (题库模型与结果分析精算规范)](references/02_测试设计_2_题库模型与结果分析精算规范.md)
- [阶段2 测试设计 (通用UI与排版规范)](references/02_测试设计_3_通用UI与排版规范.md)
- [阶段2 测试设计 (全栈研发大盘篇)](references/02_测试设计_4_全栈研发大盘篇.md)
- [阶段2 测试设计 (全链路自检清单)](references/02_测试设计_6_自检清单.md)
- [阶段3 图文笔记全生命周期 · 独立技能](../xhs-note-operator/SKILL.md)
- [阶段4 千帆店铺商图与主图海报 · 独立技能](../xhs-product-cover-operator/SKILL.md)
- [阶段5 部署与运维 SOP](references/03_部署与运维篇.md)
- [跨平台构建与部署避坑指南](references/04_跨平台构建与部署避坑指南.md)
- [防泄密与安全脱壳规范](references/05_防泄密与安全脱壳规范.md)

