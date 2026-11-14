# 手机复制板（/copy）

从 `xhs-draft-console/public/mobile-hub` 拆出的**纯静态公开访问**手机复制板。

- 地址：`https://test.mutong-xhs.top/copy/`
- 能力：服务端静态索引 + 自动拉取文案 md → 按卡展开 → 封面/标题/正文/标签一键复制 → 切片预览与保存
- 访问控制：公开访问，无需口令，无需 PHP 后端，纯前端客户端解析与复制
- **不做**：自动填表、自动发帖、CDP、Chrome 用户目录、定时发布

---

## 核心机制：服务器端拉数据（免各设备本地导入）

1. **自动加载最新文案**：手机/电脑打开 `/copy/` 时，页面自动从 `./data/index.json` 拉取文案索引，默认直接展示最新一份文案（排在首位的文件），无需任何手动操作。
2. **文案切换下拉框**：顶部选择器按「日期 + 文件名 + 卡片数」列出服务器上所有可用文案文件，选中即可秒级无缝切换。
3. **本地导入兜底**：右上角保留「导入文案」与「导入切片」按钮，仅供本地临时测试未打包的临时文件。正常使用流程完全走服务器拉取。
4. **数据存储目录**：
   - 本地源码：`design/mobile-copy-board/data/`
   - 服务器路径：`/www/wwwroot/copy-board/data/`
   - 不依赖任何 Windows 本地磁盘路径，纯相对路径直读静态文件。

---

## 刚性工作流：以后生成新文案的写死操作规范

电脑上每生成一份新日期的文案 Markdown（例如 `2026-11-15_发帖文案.md`），必须严格遵循以下四步标准流水线：

1. **归档原文档**：将该份 `.md` 放入产品文档目录 `design/product-docs/大女主觉醒测试/docs/`；
2. **同步至复制板并刷新索引**：
   - 复制一份该 `.md` 到 `design/mobile-copy-board/data/`；
   - 运行索引脚本更新 `index.json`：
     ```bash
     node design/mobile-copy-board/sync-data.js
     ```
     （或直接编辑 `design/mobile-copy-board/data/index.json`，把新文案追加到顶部，注明 `filename`、`date`、`title` 与 `totalCards`）。
3. **提交并推送到 GitHub**：
   ```bash
   git add design/product-docs/ design/mobile-copy-board/
   git commit -m "feat(copy-board): 发布 2026-11-15 新文案"
   git push origin deploy/aws
   ```
4. **同步部署到宝塔服务器**：
   ```bash
   scp -r design/mobile-copy-board/data root@114.132.183.186:/www/wwwroot/copy-board/
   ```

**效果**：完成上述步骤后，所有团队成员及手机设备**无需做任何导入**，只需在手机浏览器中刷新 `https://test.mutong-xhs.top/copy/`，即可直接默认展示最新文案，或在顶部下拉框中直接选用。

---

## 部署目录与配置

- 静态文件根目录：`/www/wwwroot/copy-board/`
- 数据文件根目录：`/www/wwwroot/copy-board/data/`
- Nginx 扩展配置：`/www/server/panel/vhost/nginx/extension/test-platform/copy.conf`
