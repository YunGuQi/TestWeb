# Nginx 与 Cloudflare 安全部署配置规范

本文档用于指导运维人员或系统架构师在上线本测试平台时，如何在 Nginx 和 Cloudflare 层配置反爬和防恶意攻击的策略。

## 1. Nginx 频率限制 (Rate Limiting)

为了防止恶意用户或脚本暴力破解后台或高频刷取测试接口，需要在 Nginx 中配置 `limit_req` 模块。

### 1.1 定义限流区域
在 Nginx 的 `http` 块（宝塔面板中通常是全局 `nginx.conf`）中添加以下配置：

```nginx
# 定义一个 10MB 内存的区域，用于存储客户端真实 IP（如果使用 CDN 需取 $http_x_forwarded_for）
# 限制单 IP 请求频率为每秒 5 个请求
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=5r/s;

# 如果网站经过 Cloudflare 等 CDN，需要使用真实 IP 变量：
# limit_req_zone $http_x_forwarded_for zone=api_limit:10m rate=5r/s;
```

### 1.2 在 Server/Location 块中应用限流
在宝塔的具体站点配置文件中，对核心 API 应用限流：

```nginx
# 对提测等核心 API 接口开启限流
location /api/ {
    # 允许突发 10 个请求，超出部分不延迟直接返回 503
    limit_req zone=api_limit burst=10 nodelay;
    
    # 也可以自定义被拒绝时的状态码，默认为 503
    limit_req_status 429;

    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

## 2. Cloudflare WAF 配置

如果平台域名托管在 Cloudflare，强烈建议开启以下免费功能：

### 2.1 Bot Fight Mode (防机器人模式)
- **路径**：Security (安全性) -> Bots (机器人) -> Bot Fight Mode
- **操作**：将其切换为 `On`。Cloudflare 会自动向可疑的爬虫或脚本请求返回 JS 验证码 (Turnstile) 进行质询，有效抵御初级脚本。

### 2.2 WAF Rate Limiting (速率限制规则)
- **路径**：Security (安全性) -> WAF -> Rate limiting rules
- **操作**：创建一条规则：
  - **Field**: `URI Path` -> `contains` -> `/api/`
  - **Rate Limit**: e.g., 100 requests per 1 minute per IP.
  - **Action**: `Block` (封禁 1 小时) 或 `Managed Challenge` (弹出无感验证)。推荐 `Managed Challenge` 以防止误伤真实校园网/办公网用户。

### 2.3 隐藏源站 IP
确保域名的 DNS 记录处于橙色小云（Proxied）状态。为了防止攻击者直接绕过 Cloudflare 攻击 Nginx 源站：
- 在宝塔面板 Nginx 中配置防火墙，仅允许 Cloudflare 的 IP 段访问 80/443 端口。
- Cloudflare IP 段列表可在此获取：https://www.cloudflare.com/ips/
