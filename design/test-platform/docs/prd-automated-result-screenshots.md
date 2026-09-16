# PRD: 测试平台全量结果自动化截图工具规范

## Problem Statement
作为小红书虚拟测试矩阵的运营与研发人员，当需要对 `test-platform` 下各个心理测试（如命定恋人、城市性格、情绪内耗、原生家庭剧本、恋爱物种等）的所有结果画像进行视觉验收、发帖素材制作或文案排版核对时，目前必须在浏览器中手动答题数十次甚至上百次，不仅效率低下、极易遗漏冷门分支画像，而且无法快速将全量结果卡片和长图高清保存到本地文件夹。

## Solution
提供一套一键式、跨测试通用的自动化截图套件：
1. **Windows 批处理入口 (`run-screenshots.bat`)**：支持无脑双击交互式菜单点选，也支持命令行直接传参修改测试名称；默认针对线上环境，同时支持本地/线上环境快捷切换。
2. **底层自动化脚本 (`scripts/capture-results.ts`)**：基于 Playwright 驱动高精度移动端视口（390×844 @2x Retina），提供“全量画像数据穷举”与“端到端真人答题模拟”双重运行模式。
3. **双重规格自动归档**：每个测试结果自动生成“核心卡片图 (`cards/`)”与“移动端全页长图 (`fullpages/`)”，截图完成后自动唤起本地资源管理器定位成果。

## User Stories
1. As an operator, I want to double-click a `.bat` script on Windows and see an interactive numbered menu of all tests, so that I don't need to remember command-line arguments.
2. As a developer, I want to pass a test name directly via command line (e.g., `run-screenshots.bat destiny-lover`), so that I can script or quickly trigger screenshots for a specific test.
3. As an operator, I want all profile results (such as all 16 profiles of destiny-lover or all cities in city-personality) to be enumerated and captured automatically, so that 100% of the outcome cards are archived without missing any rare combination.
4. As a QA engineer, I want an optional end-to-end simulation mode that answers questions step-by-step with real transitions and finishes at the result page, so that I can verify the full interactive user journey and animations.
5. As an operator preparing Xiaohongshu notes, I want both cropped result poster cards and full-page screenshots saved into organized directories, so that I can directly use the posters for social cards and review the whole report on full pages.
6. As a user, I want the output folder to open automatically in Windows File Explorer upon completion, so that I can immediately view the generated images.
7. As a developer, I want to easily toggle between the live domain (`https://test.mutong-xhs.top`) and local dev server (`http://localhost:3000`), so that I can preview newly developed tests locally before deployment.

## Implementation Decisions
- **执行宿主与工具栈**：
  - Windows 批处理（`.bat`）作为交互壳层，自动定位 node 与 npx 环境。
  - 核心执行逻辑使用 TypeScript 编写并通过 `npx tsx` 运行，复用现有的 Playwright 驱动。
- **目标测试识别体系**：
  - 统一映射字典，支持标准标识：`destiny-lover`、`city`（或 `city-personality`）、`emo`（或 `emotional-friction`）、`family-origin`、`love-species`。
  - 针对每个测试，封装画像获取逻辑：
    - 已有独立预览页面的测试（如 `city`、`emo`），直接格式化请求 URL 快速渲染并截取。
    - 针对无独立外部预览参数的测试（如 `destiny-lover`、`love-species`），通过轻量注入或自动化点击到达最终结果页面进行渲染。
- **截图视口与质量控制**：
  - 强制设定视口宽度为 390px、高度 844px、设备像素比（deviceScaleFactor）为 2，保证高清导出。
  - 截图前必须挂钩 `document.fonts.ready` 并附带 500ms 动效冷却，杜绝字体闪烁或未渲染完白屏。
  - 自动创建输出目录结构：`screenshots/<test-name>/cards/` 与 `screenshots/<test-name>/fullpages/`。

## Testing Decisions
- **验证原则**：黑盒验证自动化脚本的执行退出码、生成图片的非空与尺寸有效性，以及控制台的进度展示。
- **测试用例**：
  1. 执行 `npx tsx scripts/capture-results.ts --test city --limit 2`，验证能够正常生成两组卡片及长图。
  2. 执行 `run-screenshots.bat --help` 验证参数帮助与默认双击流程。
  3. 验证端到端真人答题模拟模式是否顺畅走完全程并落盘截图。

## Out of Scope
- 批量上传图片至小红书商户后台或图床（仅负责本地截图落盘）。
- 修改线上服务器数据库配置（纯前端/客户端自动化流程）。

## Further Notes
- 截图生成在本地测试平台根目录的 `screenshots/` 文件夹下，该目录已加入或应加入 `.gitignore` 以免大批量媒体文件污染代码仓库。
