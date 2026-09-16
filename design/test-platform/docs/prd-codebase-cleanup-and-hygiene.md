# PRD - test-platform 冗余文件治理与僵尸代码清理

## Problem Statement

当前 `design/test-platform` 经过多轮快速迭代、测试开发与线上部署，工作区根目录及静态资源目录积累了近 1GB 的历史冗余文件（如全量打包产物、已废弃脚本、临时排查脚本、孤立样式与无用依赖包 `is-even`）。这不仅大幅增加工作区磁盘占用与部署包体积，还造成源码目录职责不分明，存在破坏工作区清洁度与误用废弃打包命令的隐患。

## Solution

遵循“外科手术式修改”与“零痕迹残留”原则，在彻底确认不影响既有 5 大业务测试（情绪内耗、性格城市、命定恋人、原生家庭、恋爱物种）及后台控制台正常运行的前提下，系统性清理历史临时排查文件、巨大打包产物、违背当前规范的旧脚本、孤立静态样式与僵尸依赖，并将混入路由目录的素材说明迁移至文档目录，最后补齐 `.gitignore` 过滤规则并全量验证构建与回归测试。

## User Stories

1. 作为开发者，我希望从工作区移除历史构建大包（`deploy_full.zip`、`deploy.zip`），以便将仓库瘦身近 1GB 并加快代码检视速度。
2. 作为开发者，我希望彻底清除排查故障后遗留的一次性脚本与截图（`scratch_*`、`update_db.js`），以遵循零残留规范。
3. 作为运维人员，我希望移除存在安全与跨平台隐患的废弃打包脚本（`pack.bat`、`pack.py` 等），以防误执行非标准打包流程。
4. 作为前端工程师，我希望剔除 `public/` 目录下未被任何组件引用的冗余 CSS 与单页，使线上部署包体积最轻量。
5. 作为全栈工程师，我希望从 `package.json` 卸载零引用的 `is-even` 依赖，保持依赖树干净纯粹。
6. 作为项目架构师，我希望将混在 `app/` 路由源码中的海报素材说明 Markdown 文档迁移至 `docs/`，确保 Next.js App Router 目录纯正无混杂。
7. 作为平台维护者，我希望构建与 API 测试 100% 畅通通过，确保所有测试业务功能与防刷机制零回归。

## Implementation Decisions

- **安全红线**：绝不触碰核心锁死版本（`next: 16.2.11`、`tailwindcss: ^3.4.19`）与核心 Prisma Schema 结构。
- **打包流水线 SSOT**：继续以 `npm run pack` 作为唯一合法打包命令，直接删除违规的 `Compress-Archive` 脚本。
- **样式隔离**：确认所有业务测试已内联 Tailwind CSS，安全剔除 `public/main.css` 与 `public/test.css`。
- **文档归位**：将 `app/destiny-lover/cover-assets.md` 与 `app/family-origin/cover-assets.md` 迁移至 `docs/` 目录。
- **环境加固**：在 `.gitignore` 补充临时大文件规则，防止垃圾文件再次入库。

## Testing Decisions

- 必须执行 `npm run build`，确保 Next.js 生产环境编译零错误。
- 必须执行 `playwright test tests/api`（即 `npm run test:api`），验证核心业务流与安全防刷校验全部 PASS。

## Out of Scope

- 不对业务测试题库、计分引擎和前后端交互逻辑进行功能性改造。
- 不升级任何生产第三方基础框架或改动数据库物理表结构。
