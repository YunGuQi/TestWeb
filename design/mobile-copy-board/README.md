# 手机复制板（/copy）

从 `xhs-draft-console/public/mobile-hub` 拆出的**纯静态公开访问**手机复制板。

- 地址：`https://test.mutong-xhs.top/copy/`
- 能力：导入发帖文案 md → 按卡展开 → 封面/标题/正文/标签一键复制 → 切片预览与保存
- 访问控制：公开访问，无需口令，无需 PHP 后端，纯前端客户端解析与复制
- **不做**：自动填表、自动发帖、CDP、Chrome 用户目录、定时发布

## 部署目录

- 静态根：`/www/wwwroot/copy-board/`
- Nginx 片段：`/www/server/panel/vhost/nginx/extension/test-platform/copy.conf`
