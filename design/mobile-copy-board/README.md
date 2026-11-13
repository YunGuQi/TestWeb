# 手机复制板（/copy）

从 `xhs-draft-console/public/mobile-hub` 拆出的**纯静态**手机复制板。

- 地址：`https://test.mutong-xhs.top/copy/`
- 能力：导入发帖文案 md → 按卡展开 → 封面/标题/正文/标签一键复制 → 切片预览与保存
- **不做**：自动填表、自动发帖、CDP、Chrome 用户目录、定时发布

## 口令配置（必做，无默认值）

口令只存在宝塔服务器，不进 GitHub、不写前端 JS。

任选其一：

1. **推荐：本地配置文件**
   - 路径：`/www/wwwroot/copy-board/auth/config.local.php`
   - 从同目录 `config.example.php` 复制后填写：
     ```php
     <?php
     $COPY_BOARD_PASSWORD = '这里换成你的新口令';
     ```

2. **环境变量**
   - 变量名：`COPY_BOARD_PASSWORD`
   - 在宝塔为 PHP / 系统环境配置该变量（优先级高于 config.local.php）

未配置时页面拒绝进入，并提示去宝塔配置。

## 部署目录

- 静态根：`/www/wwwroot/copy-board/`
- Nginx 片段：`/www/server/panel/vhost/nginx/extension/test-platform/copy.conf`
