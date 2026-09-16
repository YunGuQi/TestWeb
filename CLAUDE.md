# 小红书虚拟测试运营 · 核心研发与交互规范

## 1. 交互与计划刚性闸门 (Interaction & Gate Invariants)
- **称呼与技能汇报**：每次回复开头称呼“大哥”。仅在实际调阅了技能正文时单行汇报生效技能名，日常不复读列表；回复内容严格精简凝练、直奔重点，全力节省 Token。
- **计划与执行刚性闸门**：涉及重构、测试修改或架构变动，必须先对齐需求（调用 `/grill-me`）再生成计划；计划生成后**绝对禁止擅自向下执行代码**，必须强制停机等待大哥文字明确批准。大哥同意后，必须依次调用 `/to-spec` 和 `/to-tickets` 技能转成 PRD 和 issues 工单；文档落盘后，立即询问大哥是否调用 `/handoff` 技能生成当前任务交接提示词便于在下个新对话中执行，还是在当前对话中直接执行代码优化。

## 2. 代码操作与防毁坏红线 (Safety Invariants)
- **禁止自行 Git 回滚**：严禁私自执行 `git checkout` / `git reset` 等命令，避免覆盖未提交或已修改代码。
- **文件编码铁律**：全项目强制 UTF-8。**绝对禁止**在未指定 `-Encoding utf8` 时使用 PowerShell（如 `Get-Content`/`Set-Content`）修改含中文文件！优先使用编辑器原生修改工具（`replace_file_content`）。
- **页面直接修改**：修改测试页面必须直接编辑 HTML/CSS/JS 代码，**绝对禁止**编写 Python 脚本间接修补。单文件测试产品必须保持全内联（HTML+CSS+JS 在单个 `.html`）。

## 3. 按需加载与 Token 绝对禁令 (SSOT & Token Control)
- **按需加载技能**：运营与排坑策略按需调阅 `/xhs-ops-playbook`；端到端测试研发与发帖统筹调用 `/xhs-auto-operator-v5`。
- **扫描禁令**：**绝对禁止**全量扫描 `教程/` 下的微信对话长文本，以及 `.bmp`、`.png`、`.mp4`、`.gif`、`.docx` 原始多媒体大文件。

## 4. 业务矩阵与部署军规 (Operations & Deployment)
- **双轨发布矩阵**：老号（安安，前缀 `安安_`）优先测水温；新号（纯白号，前缀 `新号_`）承接扶持流量主攻转化。
- **域名隔离防御**：主域名挂合规静态页保备案；测试业务挂子域名（如 `test.mutong-xhs.top`），强制接入 Cloudflare Turnstile 防刷 + JWT 鉴权。
- **DLP 防泄密打包**：
  1. `next.config.js` 强制 `turbopack: false`；
  2. 打包发布必须直接执行一键聚合命令：`npm run pack`（自动流水线顺序执行 `node generate-inline-css.js` 内联样式注入 ➔ `npm run build` ➔ `node pack_dlp.js` 特权脱壳生成纯明文 `deploy.zip`，**严禁**用 PowerShell 的 `Compress-Archive`）。
