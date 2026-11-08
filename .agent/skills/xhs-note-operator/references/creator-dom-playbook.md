# 小红书创作者平台 DOM 操作手册 (Creator DOM Playbook)

本文档整理小红书创作服务平台（`creator.xiaohongshu.com/publish/publish`）图文发布表单的核心 DOM 节点选择器、CDP 控制范式与常见异常处理。

---

## 1. 官方“文字配图”大字封面生成

1. **触发弹窗**：
   - 目标：包含“文字配图”文字或图文模式下的文字封面入口按钮。
   - 检查：点击后弹出包含 `.tiptap.ProseMirror` 的文字配图生成弹窗。
2. **文案注入（保断行）**：
   - 优先 ProseMirror API 按行设段落；禁止把多行拼成一行再靠平台自动折行：
     ```javascript
     const editor = document.querySelector('.tiptap.ProseMirror');
     const html = lines.map(l => `<p class="editor-paragraph">${l}</p>`).join('');
     if (editor.editor) editor.editor.commands.setContent(html);
     else {
       editor.innerHTML = html;
       editor.dispatchEvent(new Event('input', { bubbles: true }));
     }
     // 验收：画布可见行数/文案 === coverLines；不对则改键盘 Enter 分行后再生成
     ```
3. **渲染生成**：
   - 点击类名为 `.edit-text-button` 或文本包含「生成图片」的按钮。
4. **模板固定第一张（铁律）**：
   - 右侧「选择一个喜欢的卡片」列表中，**点击第一张「基础」**（含「换配色」的那格也算第一张）。
   - 禁止默认停在白底涂写/手写等其它样式。
5. **完成**：
   - 点「下一步」或「完成」，大字封面成为笔记首图。

---

## 2. 1/3 测评悬念图切片与上传

1. **本地切片生成**：
   - 从原结果图（如 `assets/结果测试截图/02_r5_气场全开的六边形女王.png`，通常为 1074×4296）裁切 3:4 比例悬念片段（1074×1432），保存为 `assets/结果测试截图/cards/02_r5_slice.png`。
   - **纵向随机起始点**：使用 `python scripts/crop-slice.py <原图> <切片路径>`，在 `[0, H - target_h]` 中随机抽取 `start_y`。允许并鼓励文字行、段落或评语被腰斩切断，强化报告中段泄露的真实偷跑感与蔡加尼克心理缺口。
2. **浏览器文件注入**：
   - 启动本地临时微型 HTTP 服务或使用 base64 转换：
     ```javascript
     const res = await fetch('http://127.0.0.1:8768/02_r5_top_third.png');
     const blob = await res.blob();
     const file = new File([blob], '02_r5_top_third.png', { type: 'image/png' });
     const dt = new DataTransfer();
     dt.items.add(file);
     const fileInput = document.querySelector('input[type="file"][accept*="image"]');
     fileInput.files = dt.files;
     fileInput.dispatchEvent(new Event('change', { bubbles: true }));
     fileInput.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
     ```
   - 检查：预览区图片总数达到 2 张（封面 + 测评图）。

---

## 3. 标题与正文输入

1. **标题原生 Setter**：
   - 直接修改 `value` 可能会被 React/Vue 内部状态覆盖，必须调用原生属性原型：
     ```javascript
     const titleInput = document.querySelector('input[placeholder*="填写标题"]');
     Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(titleInput, title);
     titleInput.dispatchEvent(new Event('input', { bubbles: true }));
     titleInput.dispatchEvent(new Event('change', { bubbles: true }));
     ```
   - 加权长度限制：全角字符（汉字/中文标点）算 1，半角字符算 0.5，总加权长度不超过 20。

2. **正文 ProseMirror 注入**：
   - 主编辑器容器通常带有 `contenteditable="true"` 或 `.tiptap.ProseMirror`。
   - 逐段按 `<p>...</p>` 填入展开正文。

---

## 4. 官方蓝色话题实体转化

小红书正文中的 `#话题` 必须转为系统认可的 `<a>` 实体卡片（带有 `data-topic-id` / `a.tiptap-topic`），不可保留纯文本 `#`。

1. **先换行再输入（铁律）**：
   - 正文段落全部写完后，在主编辑器末尾先插入一个空段落（Enter），再开始话题循环。
   - 禁止把多个 `#话题` 一次性塞进同一段纯文本。
2. **逐个唤起联想**：
   - 对每个标签：聚焦末尾 → 输入 `#标签名` → 等浮层：
     ```javascript
     const container = document.querySelector('#creator-editor-topic-container');
     ```
3. **拾取与点击**：
     ```javascript
     const item = document.querySelector('#creator-editor-topic-container .item.is-selected') ||
                  document.querySelector('#creator-editor-topic-container .item');
     if (item) item.click();
     ```
4. **验证**：
   - 每个标签均为蓝色链接，且带 `data-topic-id`；编辑器内无残留裸 `#标签` 文本。

---

## 5. 原创声明开启

1. **勾选开关**：
   - 查找包含“原创声明”的行内控件或 `.d-switch` / `[role="switch"]`。
   - 若未勾选，点击开启。
2. **协议弹窗确认**：
   - 若弹出原创协议弹窗，查找并点击“同意并声明”或确认按钮。

---

## 6. 店内商品挂载

1. **进入弹窗**：
   - 滚动到底部【店内商品】模块，点击「添加商品」按钮。
2. **搜索与勾选（铁律：必须选中）**：
   - 在搜索框填入关键词（如 `大女主觉醒自测模板`），回车或点搜索。
   - **必须勾选**匹配行的 checkbox / 行点击选中。
3. **确认与落盘**：
   - 硬验收：弹窗文案出现 `已选择 1 项`（或 `已选择 1`）；未出现则禁止点保存。
   - 点「保存」后，主表单【店内商品】区域须可见已挂商品卡；否则重开弹窗重选。

---

## 7. 穿透 Closed Shadow DOM 暂存草稿

小红书底部的发布与暂存按钮组件 `<xhs-publish-btn>` 使用了 **Closed Shadow DOM**，常规 `document.querySelector` 无法穿透访问其内部按钮。

必须通过 CDP 穿透机制定位并点击：
1. **穿透拉取 DOM 树**：
   - 调用 CDP `DOM.getDocument({ pierce: true })` 获取穿透树。
2. **检索按钮节点**：
   - 在树中检索 `localName === "button"` 且包含类名 `ce-btn white`、文本值为 `暂存离开` 的节点，获取其 `nodeId`（或其宿主 `<xhs-publish-btn>` 下的对应子节点）。
3. **解析与触发**：
   - 调用 CDP `DOM.resolveNode({ nodeId })`，获得 Remote Object 的 `objectId`。
   - 调用 CDP `Runtime.callFunctionOn`：
     ```javascript
     Runtime.callFunctionOn({
       objectId: targetObjectId,
       functionDeclaration: "function() { this.click(); }"
     })
     ```
4. **草稿箱落地验收**：
   - 等待 1.5 秒页面跳转或弹出草稿箱。
   - 截图验证弹窗中【图文笔记】列表第一项为刚才填写的标题。
5. **备选穿透（已验证可用）**：
   ```javascript
   const host = document.querySelector('xhs-publish-btn');
   const btn = host && host._sr && host._sr.querySelector('button.ce-btn.white');
   if (btn) btn.click(); // 「暂存离开」
   ```

---

## 8. 单卡配方脚本

批次执行前用 Node 生成可复用 `Runtime.evaluate` 步骤串，避免每卡重新探 DOM：

```bash
node ".agent/skills/xhs-note-operator/scripts/draft-one-card.js" --id r2_m2
# 或
node ".agent/skills/xhs-note-operator/scripts/draft-one-card.js" --file path/to/card.json
```

输出默认写到 `.scratch/draft-pipeline/last-card-steps.json`（含 cover / slice / titleBody / topics / goods / saveDraft 各步 `expression` 与 `accept`）。
