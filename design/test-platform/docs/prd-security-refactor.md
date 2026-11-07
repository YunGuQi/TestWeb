# PRD: Test Platform Security & Scoring Engine Refactor

## Problem Statement

目前测试平台（test-platform）的 C 端接口面临着明显的架构缺陷和安全隐患：
1. **安全性缺失**：C 端核心接口 `/api/submit` 仅依赖容易被逆向的前端哈希签名（`x-sign`）以及前端集成的 Turnstile。一旦 Turnstile 绕过或禁用，没有任何后端速率限制（Rate Limit），面临并发刷库和验证码资源消耗的攻击风险。
2. **测试隔离失效**：目前依赖前端明文传递的 `deviceId` 区分测试用户。这导致同一局域网、同一设备多开、或者清除缓存时，极易发生“串号”及历史答题数据污染。
3. **极端的 Shallow Module**：`/api/submit/route.ts` 超过 500 行，将所有不同的业务（情感摩擦、恋爱物种、命运恋人等）的算分逻辑以扁平的 `if-else` 全部堆砌在一起。完全缺乏隔离性 (Locality) 和杠杆率 (Leverage)，新增或修改某个测试极易引发连锁 Bug。

## Solution

1. **引入安全边界与可靠存储**：在服务器部署环境中引入 Redis，建立基于 Redis 的分布式 Rate Limiter，并将安全中间件（签名校验、Turnstile 校验、频控）集中化。
2. **服务端权威会话 (Session Carrier)**：废弃不可靠的 `deviceId`。新增 `/api/init-test` 接口，在测试开始时由服务端下发基于 HttpOnly Cookie 的匿名 Token，实现每个会话级别的安全隔离，防伪造防串号。
3. **引擎插件化重构 (Scoring Engine Seam)**：在 `lib/engines/` 目录下引入 `IScoringEngine` 抽象。将原先几百行的算分逻辑拆解为独立的策略实现（纯函数/面向对象），主路由只需进行依赖注入与参数透传。

## User Stories

1. As a 测试用户, I want a 稳定的答题体验, so that 我的测试过程不会因为恶意爬虫攻击服务器而中断或缓慢。
2. As a 测试用户, I want a 完全独立的状态保存, so that 我可以在同一台手机上和我的另一半分别进行测试，且结果不会互相覆盖。
3. As a 开发者, I want a 安全集中的拦截层, so that 我无需在每个业务接口里重复书写鉴权和防刷代码。
4. As a 业务开发者, I want a 独立的算分引擎架构, so that 我能一目了然地开发或修改单个心理测试的算分规则，无需担心改挂其他测试。
5. As a 测试编写者, I want a 纯净的打分模块, so that 我可以不用通过发送 HTTP 请求就能直接对算分公式编写自动化单元测试。

## Implementation Decisions

- **限流与存储介质**：引入 `ioredis`，连接宝塔服务器上的 Redis 实例，维护频控状态。
- **凭证载体**：采用 HttpOnly Cookie。在 `middleware.ts` 层面或者专门的安全网关 Adapter 层面读取 Cookie，保证免受 XSS 威胁。
- **隔离机制演进**：数据库 `TestRecord` 中的 `deviceId` 将兼容替换或映射为基于 Cookie 内 Token 解析出的真实 `participant_id` 或 `sessionId`。
- **模块结构**：
  - 新增 `lib/engines/engine.interface.ts`
  - 新增 `lib/engines/love-species.engine.ts`
  - 新增 `lib/engines/emo.engine.ts` 等等。
  - API 路由中通过 `const engine = EngineFactory.getEngine(testId)` 来触发 `engine.calculate(answers)`。

## Testing Decisions

- **安全层测试**：Rate Limiter 的窗口滑动逻辑应单独拉出为模块，并对超出并发上限的请求测试是否返回 429 Too Many Requests。
- **会话测试**：通过构造带 Token 的 Http 请求（模拟不同的 Cookie），验证服务端能否正确隔离开两个用户的 `TestRecord`。
- **算分引擎测试 (Prior Art)**：新的 Engine 模块由于脱离了 Next.js API Request 生命周期，只需提供 `(optionIds, ...args) => FinalResult` 的纯函数，应该在 `tests/engines/` 目录下轻松编写独立的用例（不再需要使用 Playwright 去启动整个服务器）。

## Out of Scope

- 前端页面的大规模 UI 重构不在本次计划内。本次仅需前端在启动时调用 `/api/init-test`，其余逻辑只需确保 Cookie 透传。
- 不修改原有的管理员后台（`/ops-dashboard`）逻辑。

## Further Notes

- 注意向后兼容：如果线上有存量的正在测试的用户，可能他们在请求中并未携带 Cookie。在过渡期，针对没有 Cookie 但有 `deviceId` 的请求，可以执行 fallback 策略或强制提示其刷新重开测试。
