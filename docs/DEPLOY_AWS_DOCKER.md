# AWS Lightsail Docker 部署与运维手册 (SOP)

本文档适用于在 AWS Lightsail（Ubuntu 24.04 LTS，2 vCPU 2GB RAM 规格）上通过 Docker Compose 部署与运维测试平台全套服务。

---

## 一、架构拓扑与资源限额

整个服务体系采用全容器化拓扑，宿主机零额外依赖，通过内部 Docker 网桥互联：

| 容器服务名 | 镜像版本 | 宿主机端口映射 | 内存限制上限 | 说明 |
|---|---|---|---|---|
| `xhs-nginx` | `nginx:1.27-alpine` | `80:80`, `443:443` | 128MB | 统一入口网关，HTTPS 终结，静态合规页原生托管，反代 Next.js |
| `xhs-app` | 自建 `Dockerfile` (Node 20) | 仅内部暴露 `3000` | 768MB | Next.js 16 交互平台，NODE_OPTIONS 限制 512MB |
| `xhs-mysql` | `mysql:8.0` | 无公网暴露 | 768MB | 关系数据库，InnoDB 缓冲池锁定 256MB，连接数限 50 |
| `xhs-redis` | `redis:7-alpine` | 无公网暴露 | 128MB | 频控与缓存，内存锁定 96MB + LRU 淘汰 |

> **内存安全底线**：所有容器硬限额总和约 1.66GB，为 Ubuntu 24.04 系统内核与文件缓存保留 300MB+ 安全余量，杜绝内存耗尽触发 Linux OOM Killer。

---

## 二、部署目录与文件规范

在服务器 `/home/ubuntu/test-platform` 目录下保持如下结构：

```text
/home/ubuntu/test-platform/
├── design/
│   ├── common/                  # 静态合规站与独立测试原型
│   │   └── compliance_site/
│   └── test-platform/
│       ├── .env                 # 生产环境变量（由管理员在服务器现配，权限 600）
│       ├── docker-compose.yml   # 容器编排文件
│       ├── Dockerfile           # App 构建文件
│       └── nginx/
│           ├── nginx.conf       # Nginx 配置文件
│           └── certs/           # 证书目录（权限 600）
│               ├── cert.pem     # Cloudflare Origin CA 公钥
│               └── key.pem      # Cloudflare Origin CA 私钥
```

---

## 三、部署实施步骤

### 1. 证书放入
在 Cloudflare 控制台针对 `test.linxj.com` 申请 Origin CA Certificate（证书有效期可设为 15 年），并将内容保存至：
- `design/test-platform/nginx/certs/cert.pem`
- `design/test-platform/nginx/certs/key.pem`
- 设置只读权限：`chmod 600 design/test-platform/nginx/certs/*.pem`
- 确认 Cloudflare 控制台 SSL 模式设置为 **Full (Strict)**。

### 2. 环境变量配置
```bash
cd /home/ubuntu/test-platform/design/test-platform
cp .env.example .env
chmod 600 .env
```
使用 `openssl rand -hex 24` 生成强随机密码，逐一替换 `.env` 中的各占位符：
- `MYSQL_ROOT_PASSWORD` 与 `MYSQL_PASSWORD`
- `JWT_SECRET`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 与 `TURNSTILE_SECRET_KEY`（在 Cloudflare 后台为 test.linxj.com 单独新建）
- `ADMIN_LOGIN_PASSWORD` / `ADMIN_PREVIEW_SECRET` 等后台凭据

### 3. 数据恢复（必须在首次拉起 App 前完成）
为防止 Next.js 首次启动对空白库产生不一致状态，按以下顺序导入线上备份：

```bash
# 1. 启动数据库与缓存服务
docker compose up -d db redis

# 2. 等待 MySQL 就绪（状态变为 healthy）
docker compose ps

# 3. 导入备份的 mysqldump 压缩包
gunzip < /path/to/backup_test_platform.sql.gz | docker exec -i xhs-mysql mysql -u$MYSQL_USER -p$MYSQL_PASSWORD test_platform

# 4. 核对核心表条数
docker exec -i xhs-mysql mysql -u$MYSQL_USER -p$MYSQL_PASSWORD test_platform -e "
SELECT 'ActivationCode' tbl, count(*) cnt FROM ActivationCode
UNION ALL
SELECT 'TestRecord', count(*) FROM TestRecord;
"
```

### 4. 启动完整服务
确认数据库条数完全一致后，构建并启动全量服务：
```bash
docker compose up -d --build
```

---

## 四、验证与冒烟测试检查单

1. **容器状态**：
   `docker compose ps` 确保 `xhs-nginx`, `xhs-app`, `xhs-mysql`, `xhs-redis` 均处于 `Up` 状态。
2. **合规站静态路由**：
   浏览器访问 `https://test.linxj.com/common/compliance_site/index.html`，确认直出合规页面。
3. **HTTP 强制跳转**：
   `curl -I http://test.linxj.com`，确认返回 `301 Moved Permanently` 且 `Location` 指向 `https://`。
4. **主应用首页与答题流**：
   访问 `https://test.linxj.com`，各测试项目加载正常，无控制台报错。
5. **Turnstile 与提交流程**：
   完成一套测试答题，验证 Turnstile 质询通过，能够正常核销激活码或获取结果。

---

## 五、常用运维排查命令

```bash
# 查看所有容器实时资源占用（重点关注 MEM USAGE 与 MEM LIMIT）
docker stats --no-stream

# 查看 Next.js 业务日志
docker compose logs -f app

# 查看 Nginx 访问与错误日志
docker compose logs -f nginx

# 查看 MySQL 运行日志
docker compose logs -f db

# 平滑重启 App（更新代码后）
docker compose up -d --build app
```
