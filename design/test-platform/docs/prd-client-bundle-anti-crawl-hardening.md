# PRD: 前端客户端资产防爬脱壳安全加固规范 (Client Bundle Anti-Crawl Hardening)

## Problem Statement

当前 `test-platform` 平台在服务端 API 层面已实施真脱敏机制（`/api/submit` 不暴露后 70% 深度分析字段），但在前端客户端组件中：
- `app/family-origin/components/ResultReceipt.tsx` 直接导入了本地权威数据 `familyOriginResults`；
- `app/love-species/components/ResultView.tsx` 直接导入了本地权威数据 `loveSpeciesResults`；
- `app/emo/components/ResultReceipt.tsx` 导入了未使用的 `results`。

在 Next.js 执行构建时，Webpack 会将包含 6 大剧本和 16 种动物物种全部 70% 深度分析内容（包含破防场景、原生烙印、解药处方、毒性场景、避难指南）原封不动全量编译打包进前端公共静态 JS 文件（`.next/static/chunks/*.js`）。攻击者与竞品爬虫无需答题或购买卡密，只需抓取公共静态 JS 并通过关键词检索，即可秒级 Dump 泄露全量独家商业分析资产。

## Solution

对齐 `destiny-lover` 与 `city` 的安全标杆范式，进行外科手术式架构解耦：
1. 彻底斩断客户端组件（`'use client'`）对本地深度资产数据（`family-origin-data.ts`、`love-species-data.ts`、`data.ts`）的前端引用；
2. 客户端在卡密未解锁前，严格仅使用服务端 `/api/submit` 下发的前 30% 身份定调脱敏数据渲染；
3. 用户在前端弹窗输入有效卡密核销成功后，统一通过 `/api/verify` 服务端动态下发完整的后 70% 深度内容，并在前端受控状态中更新呈现；
4. 重新构建前端静态资源，确保公共 `.js` chunk 中 0 处泄露后 70% 商业文案。

## User Stories

1. As a 平台操盘手，我希望后 70% 深度测评分析文案不会被编译打包进前端公开的静态 JavaScript 文件中，so that 竞品爬虫无法通过静态反编译一键脱壳窃取全部商业资产。
2. As a 平台操盘手，我希望用户必须在弹窗中验证合法激活码后，才能通过受保护的 `/api/verify` 接口获取后 70% 深度处方与名场面，so that 核心商业转化闭环不被绕过。
3. As a 正常答题用户，我希望在未输入卡密前能顺畅查看前 30% 的身份定调、反差标签与量化雷达图，so that 我能获得足够的情绪价值诱饵并愿意前往店铺购买卡密。
4. As a 正常答题用户，我希望在输入正确卡密后，页面能平滑解锁展开后 70% 的深度分析与避难所指南，so that 获得连贯无损的测评体验。
5. As a 运维工程师，我希望全平台 5 大测试统一遵循相同的防爬与卡密下发规范，so that 未来维护与新增测试时有清晰且一致的安全范式。

## Implementation Decisions

1. **客户端组件剥离本地数据导入**：
   - 修改 `app/family-origin/components/ResultReceipt.tsx`，移除 `familyOriginResults` 导入与依赖；
   - 修改 `app/love-species/components/ResultView.tsx`，移除 `loveSpeciesResults` 导入与依赖，仅保留纯工具函数接口（如类型声明）；
   - 修改 `app/emo/components/ResultReceipt.tsx`，移除无用的 `results` 导入。

2. **服务端验证接口履约一致性保障**：
   - 核验 `/api/verify/route.ts` 中针对 `family-origin` 与 `love-species` 的后 70% 履约下发逻辑，确保包含全部必要展示字段；
   - 保障前端解锁成功后的状态映射能够无缝衔接，不因缺少本地变量兜底而导致界面报错。

3. **依赖与表结构冻结保证**：
   - 严格遵循《CLAUDE.md》红线，不升级 `next` 或 `tailwindcss` 版本，不修改 `schema.prisma`。

## Testing Decisions

1. **静态包防脱壳扫描测试**：
   - 执行构建后，在 `.next/static/` 目录下执行全量关键词正则扫描（如“满级大女主”、“破茧大女主”、“噬元橘猫”、“剧毒水母”），验证匹配结果必须为 0。
2. **前后端联调测试**：
   - 在未解锁状态下，核验结果页仅展示 30% 内容且模糊蒙层生效；
   - 在模拟输入有效卡密后，验证 `/api/verify` 成功回传 70% 字段，且页面平滑渲染。

## Out of Scope

1. 数据库 `schema.prisma` 表结构修改。
2. 题库题目与选项文字改动。
3. 前端视觉主题色彩与 CSS 基础样式调整。

## Further Notes

此加固方案完全承袭 `destiny-lover` 已验证成功的极佳防爬实践，属于纯逻辑层解耦，改动面小、精度极高、风险可控。
