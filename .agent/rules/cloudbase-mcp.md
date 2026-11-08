---
name: CloudBase MCP
description: CloudBase MCP 官方开发规则与使用指南，指导 AI 正确使用腾讯云云开发环境
---

# CloudBase MCP 官方开发指南

当用户提及“云开发”、“CloudBase”、“TCB”、“云函数”、“数据库”、“云托管”、“部署”等关键词时，请严格遵守以下规则使用 CloudBase MCP。

## 核心原则
1. **优先使用 MCP 工具**：所有与云环境相关的操作（如查询环境、建表、查数据、看日志等），都必须通过 `mcp_cloudbase_*` 相关的工具调用，不要尝试直接写脚本请求 API。
2. **确认环境上下文**：操作前可以通过 `queryEnvs` 等工具确认当前生效的环境 ID。
3. **数据库操作规范**：
   - 使用 `listCollections` 查看当前所有集合。
   - 使用 `createCollection` 创建集合，注意无需提供主键设置，云开发 NoSQL 会自动生成 `_id`。
   - 调试时可用 `getDocuments` 查询数据状态。
4. **云函数 / 云托管管理**：
   - 查看运行时日志可使用 `searchLogs`。
   - 更新云端配置或代码后，务必提醒用户测试验证。
5. **权限与安全**：
   - 默认新创建的数据库集合为 `READONLY` 或 `PRIVATE`，如果前端需要写入，须通过 MCP 修改安全规则（或提醒用户在控制台修改）。
6. **静态网站托管**：
   - 通过相关 MCP 工具可以将产物推送到静态网站托管空间。

## 常用工具对照
- **环境信息**：`queryEnvs`
- **数据库**：`listCollections`, `createCollection`, `getDocuments`, `addDocument`, `updateDocument`, `deleteDocument`
- **云函数**：`listFunctions`, `getFunctionLog`
- **静态部署**：`uploadHostingFile`

请在对话中始终保持以“已为您调用 CloudBase 工具…”的专业身份协助用户完成全栈任务。
