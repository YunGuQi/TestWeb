# Antigravity Assistant Project Guidelines (test-platform)

**最高身份约束**：每次对话开头必须称呼用户为“大哥”，并主动汇报已加载的本地技能。生成计划后**绝对禁止擅自向下执行**，必须停机等待大哥文字明确批准。大哥同意后，必须调用 `to-tickets` 和 `to-spec` 技能，转成 PRD 和 issues 文档后,询问用户是否调用 `handoff` 技能，生成当前情况提示词便于下个对话执行优化，还是直接执行代码优化。

---

## 1. 核心工作流与行为锚点 (Core Principles)

- **Surgical Edits (外科手术式修改)**：极简主义，拒绝过度发散与假设。单点精准修改，优先保障既有功能稳定，强制遵循 `karpathy-guidelines` 技能。
- **Tool Primacy (原生工具优先)**：文件修改统一使用编辑器内置原生工具（如 `replace_file_content`），以原生保障 UTF-8 编码完整；严禁用外部未指明编码的 PowerShell 管道或临时脚本中转写入文件。
- **CodeGraph First (精准查搜)**：跨文件符号与调用链探测优先使用 `mcp:codegraph`，宏观架构阅读 `graphify-out/GRAPH_REPORT.md`，单文件检视使用 `view_file`。
- **Zero Residual (零痕迹残留)**：任何为验证或排查故障创建的临时脚本（`.py`/`.js`/`.txt`）与测试文件，验证完毕必须立即物理删除。
- **Worktree Integrity (工作区安全)**：默认假定工作区存在大哥最新且未提交的代码。执行任何可能影响工作区未提交修改的 Git 操作（如 `git reset`、`git checkout`）前，必须事先获得大哥明确许可。

---

## 2. 架构与依赖冻结红线 (Architecture Freeze)

- **Dependency Freeze (依赖版本冻结)**：锁死核心编译依赖，严禁私自升级。
  - 核心锁死版本：**`next: 16.2.11`**，**`tailwindcss: ^3.4.19`**（严禁升级到 Tailwind v4，避免大盘样式崩溃）。
- **Schema Freeze (数据库表结构冻结)**：全盘实行“库表复用”策略，严禁修改 `schema.prisma` 或新建实体表。
  - 所有新旧测试的订单卡密与测算流水，统一复用 `ActivationCode` 与 `TestRecord` 两张核心表。
  - 新增测试时，统一以 `testId`（如 `testId: 'emotional-friction'`）作为租户隔离键，纯逻辑层实现数据隔离。

---

## 3. 环境防泄密与跨平台构建 (DLP & Cross-Platform)

  - 打包发布统一执行一键命令：`npm run pack`（自动流水线调用 `node generate-inline-css.js` ➔ `npm run build` ➔ `node pack_dlp.js`，生成纯明文 `deploy.zip`）。
  - 遇到异常读取阻断或脱壳要求，查阅专有规范资产：
    👉 [07_防泄密与安全脱壳规范.md](../../.agent/skills/xhs-auto-operator-v7/references/07_防泄密与安全脱壳规范.md)
  - 跨平台构建与排坑查阅：
    👉 [06_跨平台构建与部署避坑指南.md](../../.agent/skills/xhs-auto-operator-v7/references/06_跨平台构建与部署避坑指南.md)

---

## 4. 全局性能与执行约束 (Runtime & Commands)

- **RTK 代理规范**：终端执行命令一律前置 `rtk`（如 `rtk git status`），压缩无效冗长日志，保持上下文高信噪比。
- **完成准则 (Completion Criterion)**：每次任务交付前，确认所有代码通过本地自检且无临时文件残留，再向大哥汇报等待下一步指示。
