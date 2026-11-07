# Next.js 项目宝塔面板部署 SOP 与避坑指南

本文档总结了在将本项目部署至腾讯云服务器（Linux + 宝塔面板 + Node.js 项目管理器）时遇到的核心痛点及对应的解决方案，可作为后续更新维护的操作手册。

---

## 1. 核心踩坑与解决方案记录

### 1.1 Prisma 数据库引擎报错 (OpenSSL 版本不匹配)
- **现象**：服务器启动报错 `PrismaClientInitializationError: Prisma Client could not locate the Query Engine for runtime "debian-openssl-1.0.x"`。
- **原因**：本地是 Windows 环境，生成的 Prisma 引擎文件默认为 Windows。而腾讯云较老的 Debian/CentOS 环境需要对应的 `debian-openssl-1.0.x` 引擎文件。
- **解决方案**：在 `prisma/schema.prisma` 中显式指定 `binaryTargets`：
  ```prisma
  generator client {
    provider      = "prisma-client-js"
    binaryTargets = ["native", "debian-openssl-1.0.x"]
  }
  ```
- **注意**：每次修改 schema 后，必须在本地执行 `npx prisma generate` 重新生成客户端，然后再将 `node_modules/@prisma` 等文件打包上传。

### 1.2 部署后启动提示 "Permission Denied" (权限被拒)
- **现象**：宝塔面板启动 Node 项目失败，日志显示 `sh: 1: next: Permission denied`。
- **原因**：在 Windows 本地打包 ZIP 上传到 Linux 时，会丢失文件的可执行权限，导致 `node_modules/.bin/next` 无法执行。
- **永久解决方案**：在 `package.json` 中的 `scripts` 里，在启动命令前强行注入提权操作：
  ```json
  "scripts": {
    "dev": "chmod -R 755 ./node_modules/.bin/ 2>/dev/null; next dev",
    "start": "chmod -R 755 ./node_modules/.bin/ 2>/dev/null; next start -p 3000"
  }
  ```
  这样无论如何覆盖上传，只要宝塔点击“启动”，就会自动赋予执行权限。

---

## 2. 部署与更新策略 (必读)

为了避免每次都上传 800MB 包含海量依赖的 `node_modules`，我们将更新策略分为**全量更新**和**部分更新（热更）**。

### 2.1 全量更新 (针对：新增依赖库、修改 Prisma 数据库结构)
当你在本地运行了 `npm install` 安装了新包，或者修改了数据库并执行了 `prisma generate` 时，必须全量更新。

**操作步骤**：
1. 确保本地执行过 `npm run build`。
2. 运行根目录的打包脚本：`python pack_full.py`。
3. 得到 `deploy_full.zip` 后，上传至宝塔面板对应的网站根目录。
4. **【核心危险警告】解压覆盖前，务必确认是否要保留线上的 `prisma/dev.db`！**
   - 如果线上已经积累了真实用户的答题数据/订单记录，**请勿**用本地的 `dev.db` 覆盖线上数据库。解压前可以先备份线上的 `dev.db`。
5. 在宝塔解压并覆盖，最后进入【Node项目】点击重启。

### 2.2 增量更新 (针对：仅修改了 React 页面UI、组件、文本或接口逻辑)
只修改了业务代码（如 `.tsx`、`.css` 或 `api` 路由），不需要重新上传 `node_modules`。

**操作步骤**：
1. **【血泪踩坑警告】本地必须先执行 `npm run build`**，让 Next.js 将最新的改动编译到 `.next` 文件夹中。
   - **坑点**：Vercel 是从 GitHub 拉取代码并在云端自动 `build`，因此 Vercel 上看到的永远是对的。但在宝塔，打包脚本（如 Python 脚本）只是单纯地打包 `.next` 文件夹。如果你修改完代码**忘记执行 build 就直接打包**，宝塔那边上传解压重启后依然是旧代码！
2. 运行增量打包脚本 `python pack_update.py`，生成极轻量级的 `update.zip`。
   - 这比单独压缩 `.next` 更严谨，因为它会顺带把可能更新过的 `public` 和 `package.json` 也打包进去。
3. 上传 `update.zip` 到宝塔网站根目录。
4. 在宝塔中将旧的 `.next` 文件夹删除或改名备份。
5. 解压 `update_next.zip`。
6. 在宝塔【Node项目】中点击重启，整个过程只需几秒钟。

---

## 3. 线上数据与激活码维护

- 目前项目使用的是本地 SQLite 数据库 (`dev.db`)。
- 当你需要批量更新题库或者导入新的激活码时：
  1. 如果要直接在服务器上操作，请谨慎编辑线上的 `.db` 文件。
  2. 更安全的做法是：在本地准备好最新的数据脚本，通过访问线上暴露的 `api/seed` (如果有权限控制) 进行更新。
  3. 或者在本地更新好 `dev.db`，然后单独将 `dev.db` 上传覆盖线上（前提是线上没有新增的需要保留的用户流水记录）。

## 4. 总结与建议

- **跨平台开发的鸿沟**：Windows 到 Linux 的核心差异就是“路径分隔符”、“文件权限”以及“编译型二进制依赖（如 Prisma 引擎、图片处理库等）”。
- 遇到任何线上 500 错误，第一时间去宝塔项目管理器中查看**项目日志**，绝大多数问题都会有明确的堆栈报错。
