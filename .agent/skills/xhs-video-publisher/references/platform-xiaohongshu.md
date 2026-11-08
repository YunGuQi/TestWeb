# Xiaohongshu Adapter Contract

Before changing the Xiaohongshu adapter, read `platform-common.md` and `ego-browser-workflow.md`.

## Account Defaults

```text
short title, maximum 20 codepoints
real topic entities only
no prose body unless explicitly requested
原创声明 enabled for original videos
```

## Upload And Identity

Use the confirmed video file. Reuse an uploaded editor only when the filename or expected title identifies this package. A different active draft is a blocker; Xiaohongshu has no tested automatic quarantine flow.

视频上传仍在进行时，只要 fresh inspection 同时证明标题输入框、正文话题编辑器和原生话题按钮可见，就可通过单宽 UI 队列提前填写标题和话题。原创声明、封面和最终验证仍必须等上传完成。`prefill` 不满足 video gate，之后必须继续正式 `upload` 等待。

## Topic Entities

Clear the body editor completely, then add topics one at a time through the real suggestion panel. The sticky final-publish footer can cover the visually exposed toolbar near the viewport bottom, so a pointer click may land on the footer instead of `话题`. Invoke the exact native `button.contentBtn.topic-btn` control through its page handler to make the platform editor insert `#`, explicitly refocus the editor at its end, type only the compact topic query, and select the exact suggestion row. Do not inject `#话题` as one text operation; that can create a suggestion decoration without loading candidates on a cold page.

Under sustained browser load, the decoration may appear while the candidate panel remains empty. Verify the exact trailing query, poll the exact row for a finite extended window, and if it never appears clear the entire topic editor and retry the whole requested set. Use at most three whole-set attempts; never preserve a half-built set or accept plain text after an empty candidate response.

After an Ego restart, the selected Xiaohongshu tab may report `document.visibilityState: hidden` even though its DOM is readable. Hidden-page timer throttling can delay a real topic candidate response far beyond the bounded wait. Immediately before a serialized topic rebuild, bring the page to front, set its web lifecycle to `active`, enable focus emulation, and prove `visible` plus `document.hasFocus()`. Do not add longer blind waits to compensate for a hidden lifecycle.

Spaces terminate Xiaohongshu topic input. When a readable package label contains whitespace, query the compact form (for example `AI Agent` -> `AIAgent`) and accept it only when the committed entity's `data-topic.name`, normalized without whitespace, matches the requested label. Preserve the readable package label in evidence. Never accept compact plain text as a substitute for an entity.

Xiaohongshu topic entities do not support the half-width dot `.`. Reject any dotted `xhsTopics` label during package preflight instead of opening the creator page or silently rewriting the label. Use an explicitly chosen dot-free label such as `GPT56` when that still represents the intended topic.

The verifier must prove:

- every requested topic exists as a committed entity;
- no requested topic remains as plain text;
- no malformed or duplicate entity exists;
- no stale body residue remains when the package has no prose body.

Do not insert `.tiptap-topic` HTML manually.

## Original Declaration

Open `内容设置`, enable `原创声明`, accept the agreement checkbox when a dialog appears, and click the dialog’s `声明原创` control. That dialog control is not the final publish button.

The current switch uses `.d-switch-simulator.checked` and `.d-switch-simulator.unchecked`. Read the nested checkbox first and otherwise compare class tokens exactly; substring matching is forbidden because `unchecked` contains `checked`.

After accepting the agreement, wait for Vue to enable `声明原创` before clicking it. A disabled confirmation is a blocker, not a successful toggle. Verify both the enabled switch and the closed agreement dialog from a fresh inspection.

## Custom Cover

Default to the platform cover unless the package explicitly enables an existing-cover upload. Use the user-provided `3:4` asset.

The current editor exposes a hover-only `.cover-edit-entry`. Pointer movement can remove that element before the click event completes, so this is a live-proven native-handler exception: invoke that exact entry’s page click handler before falling back to a stable preview click. Then poll for `.main-cover-editor-modal` and prefer its direct image input; the current editor may show only `上传` and `完成`, without a separate `上传封面` tab. Choose the crop ratio matching the asset when exposed and confirm the editor.

Accept the cover only when the main editor exposes the uploaded preview URL, normally on `ros-preview.xhscdn.com`, and no cover dialog blocks the page. Store that URL in the receipt and require the verify phase to find it again.

## Graphic Note Mode (图文笔记模式)

支持发布多图图文笔记（如 `01_text_cover.png` 大字封面 + `01_r1_top_third.png` 截断测试结果卡片）：
1. 切换至【上传图文】Tab 或直接向图文输入框注入文件列表。
2. 标题填写于 `input[placeholder*="填写标题"]`。
3. 长文案注入 ProseMirror 编辑器 (`div.tiptap.ProseMirror`)。
4. 正文中的 Hashtag 必须触发建议列表（`#creator-editor-topic-container .item`）并点击，转换为官方蓝色 `<a class="tiptap-topic" data-topic="...">` 话题实体，不得残留纯文本 `#`。

## Product Attachment (店内商品关联)

若内容包指定了 `goodsKeyword` 或 `goodsId`，在页面底部【店内商品】模块执行自动挂载：
1. 滚动页面使【店内商品】可见。
2. 点击【添加商品】按钮，唤起商品选择弹窗。
3. 在弹窗列表项中匹配关键词（如 `大女主觉醒自测模板`）或商品 ID（如 `6a9d3d5cef418700012da5a8`）。
4. 勾选对应商品行的复选框（`input[type="checkbox"]` / `.d-checkbox`），验证“已选择 1 项”。
5. 点击弹窗底部【保存】按钮，验证页面出现该商品的挂载卡片。

## Draft Mode (暂存离开 / 草稿箱模式)

当用户要求“存草稿”、“暂存”或配置 `draftOnly: true` 时，不点击最终发布按钮，而是触发保存至本地草稿箱：
1. 底部操作条为 Web Component `<xhs-publish-btn>`，其 Shadow DOM 采用 closed 模式。
2. 通过 CDP 的 `DOM.resolveNode` 定位到 ShadowRoot 内的 `.ce-btn.white`（“暂存离开”）按钮，调用 `.click()`；或通过精准坐标/事件分发触发。
3. 验证触发后弹出【草稿箱】弹窗（包含“草稿存储于当前使用的浏览器本地”提示及对应标题的草稿条目），确认已成功落盘。
4. 提示用户：草稿已稳妥存入当前浏览器本地草稿箱，用户可随时在浏览器中打开草稿手动点击最终发布。

## Required Gates

```text
authenticated
correct draft identity
video or images fully uploaded
exact title
exact topic entities with no plain residue
原创声明 enabled
custom 3:4 receipt when enabled, otherwise default cover state
store product attached (matching the exact test product)
all elements aligned (cover ↔ card ↔ title ↔ body ↔ tags ↔ product)
draft saved to browser Draft Box (when draftOnly enabled)
no blocking dialog
final publish not clicked
```

实测记录和待回归边界见 `acceptance-history.md`。

Cover acceptance requires the actual visible crop control to read `3:4` (including the current `button.ratio-option.active` variant), the native selected file metadata, and a loaded accepted CDN image with intrinsic 3:4 dimensions. An uploaded 3:4 thumbnail does not prove the crop selection. On restore without a verified receipt, clear the known uploaded thumbnail if necessary to expose the real upload input and re-upload the exact file.
