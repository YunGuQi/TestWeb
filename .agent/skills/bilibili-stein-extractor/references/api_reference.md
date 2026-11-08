# B站互动视频（stein）接口参考

三个接口目前均可匿名 GET（请求头带常见 UA 与 `Referer: https://www.bilibili.com` 即可）。
若将来 `player/v2` 要求 wbi 签名，传登录 Cookie（SESSDATA）通常可绕过。

## 1. 视频信息 `GET https://api.bilibili.com/x/web-interface/view?bvid={bvid}`

关键字段（`data`）：
- `title`、`owner.mid/name`、`pages[].cid/part`
- `stein_guide_cid`：**存在即为互动视频**；缺失则不是，无需继续。

## 2. 互动图版本 `GET https://api.bilibili.com/x/player/v2?bvid={bvid}&cid={cid}`

关键字段（`data.interaction`）：
- `graph_version` — 遍历分支图的必需参数。UP主改图后旧版本失效（报"剧情图被修改已失效"），重新取即可。
- `msg` 可能提示"登录后才能体验全部结局"——匿名图可能不完整。

## 3. 分支节点 `GET https://api.bilibili.com/x/stein/edgeinfo_v2?bvid={bvid}&graph_version={gv}[&edge_id={id}]`

不带 `edge_id` 返回根节点；之后用每个选项的 `choice.id` 作为下一节点的 `edge_id` 做 BFS。

`data` 关键字段：
- `edge_id`、`title`（节点标题，测试类常为 "01"~"06"、"结果1" 等）、`is_leaf`
- `story_list[]`：`title/cid/start_pos/cover`。注意：**叶子节点的 cid 不可信**（常回填入口 cid）；结果视频真实 cid 取指向它的 `choice.cid`。
- `edges.questions[].choices[]`：
  - `id` — 指向的下一节点 edge_id
  - `cid` — 该选项播放的视频段 cid（**结果 cid 从这里取**）
  - `option` — 选项显示文本（含序号字母，如 "A 开始测试"）
  - `native_action` — 数值动作，常见 `$var=$var+2.00`（加分），也可能是赋值
  - `condition` — 跳转条件，形如 `$var>=5.00 && $var<=10.00`；空串为无条件
  - `is_default` — 超时未选择时的默认选项
  - `platform_action` — 形如 `JUMP {edge_id} {cid}`，与 id/cid 冗余
- `hidden_vars[]`（根节点返回全量）：`id_v2`（条件/动作中的 `$xxx`）、`name`（作者命名，如"色欲"）、`type`（1=普通数值，2=随机值）、`value`（初始值）

## 结构规律

- **节点按路径复制**：同一道题每个前置选择一份拷贝。去重键 = 排序后的 `(option, native_action, condition)` 元组。
- 变量名混淆（如 `$9vrYA_64_V4Y`），靠 `hidden_vars[].name` 还原语义。
- 未被任何 `native_action`/`condition` 引用的变量是废案，忽略。
- 多层选项页通过导航项连接（"（查看更多选项）""（返回上层）"），无动作、文本全角括号；还原成问卷时拍平为同一题。
