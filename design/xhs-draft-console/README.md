# 小红书图文 · 填草稿控制台（本机）

独立 Next 应用（**不**并入 `design/test-platform`）。控制台只下发任务与展示进度；本机 **worker** 连固定 Chrome 用户目录执行 `draft-one-card` 配方。

## 口径（必读）

- **半自动 + 限频 + 失败熔断**；账号用微光小号。
- **禁止**表述为「防检测 / 可避免被监控」。
- 默认模式 `draft`（暂存离开）；`ready` 停在发布前且**绝不**自动点「发布」。
- **发布中心**：开跑前可预览/编辑封面大字、标题、正文、话题；切片与商品只读。本批覆盖仅入队 payload，**默认不写回**源 md。
- **本机 `scheduleAt`**：到点才开始填表；**已过期时刻拒绝入队**（不视为立即开跑）。这只调度本机队列，不是平台定时上线。
- **平台 `platformScheduleAt`**：自动化打开定时开关并写入时间后 **Safe Stop**——须**人点最终确认**；v1 **绝不**自动点红色「发布」或等价定时确认。不可与 `mode=draft` 同用（须 `ready`）。
- 草稿在本机 Chrome 用户目录：换目录或清数据会丢草稿。
- 登录 Cookie **不出本机**、不同步服务器；**不公网部署**。
- **仅图文**；不做视频上传/解析。

## 端口

| 服务 | 地址 |
|---|---|
| 控制台 Next | `http://127.0.0.1:3721` |
| Worker HTTP | `http://127.0.0.1:3722`（仅回环） |

队列 JSON：仓库根 `.scratch/xhs-draft-autofill/runtime/`（勿用应用 `.data/`）。

## Chrome 用户目录（Windows）

默认：`%LOCALAPPDATA%\XhsDraftConsole\chrome-profile`  
可用环境变量覆盖：`XHS_CHROME_USER_DATA_DIR`、`XHS_CHROME_PATH`、`XHS_CHROME_CDP_PORT`（默认 **19222**，避开日常 Chrome 的 9222）。

## 本地启动

**Windows 一键（推荐，仓库根目录）**

```bat
填草稿控制台.bat
```

菜单可选「开启 / 停止 / 退出」；开启后拉起 worker(3722)、UI(3721)、可选切片服务(8768)；停止只关端口监听，**保留** Chrome 登录态；操作完会回到菜单。

或手动：

```bash
cd design/xhs-draft-console
npm install
npm run worker          # 终端 1 · 3722
npm run dev             # 终端 2 · 3721
```

可选预热切片服务（技能脚本）：

```bash
node .agent/skills/xhs-note-operator/scripts/image-server.js
```

浏览器打开控制台 → 刷新登录态（未登录则扫码）→ 素材解析 → **发布中心**核对（或填草稿中心盲跑）→ 开跑。

## 机测

```bash
npm test
npm run build
```

## 机读规范

见 [`docs/机读元数据规范.md`](docs/机读元数据规范.md)。新卡必须带 `cardId/切片/商品/状态`；缺字段标红不可入队。
