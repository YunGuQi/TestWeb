## Problem Statement

目前博主运营多个趣味心理测试项目（如《命定恋人》、《深度情绪内耗》等），每次开发新测试都需要重新编写防刷验证、大盘计数等相同的后端逻辑。而且目前缺乏对第三方发货平台卡密的安全验证，极易被用户使用随意编造的假订单号白嫖测试资源。我们需要一个统一的、高内聚的后台服务来集中管理多个测试的前端验证和数据统计。

## Solution

开发一个名为 `shared-backend` 的独立微服务（平台级后端）。该后端不再处理具体的测试算法和业务逻辑，而是专注于：
1. **统一发卡与验证**：管理后台生成或导入卡密，前端请求时验证该卡密对特定的 `testId` 是否有效，并在本地存储唯一设备标识限制最多三设备白嫖。
2. **统一大盘计数器**：根据前端传来的 `testId` 提供各测试的总人数以及提交完成后的名次序号。
所有独立开发的纯前端或 Next.js 测试项目只需以 API 的形式跨域调用该服务即可。

## User Stories

1. As a 管理员, I want to 在后台批量生成或导入随机激活码 (卡密), so that 我可以将这些码交给小红书自动发货机器人售卖。
2. As a 管理员, I want to 为卡密指定它适用的测试项目 (或通用码), so that 我可以区分不同价格产品的权限。
3. As a 管理员, I want to 在后台查看每个测试项目的总访问量和今日新增量, so that 我能掌握哪些测试是爆款。
4. As a 消费者, I want to 在购买后输入我收到的激活码解锁页面, so that 我可以开始做题并得到准确的结果。
5. As a 消费者, I want to 在测试结束后看到“我是第 XXX 个完成测试的人”, so that 我有更强的虚荣心和真实感去截图分享。
6. As a 消费者, I want to 能够将我的激活码分享给我的两位闺蜜, so that 我们三个人能在各自的手机上做测试。
7. As a 系统防刷机制, I want to 识别并记录验证接口传来的唯一 `deviceId`, so that 超过 3 台设备的卡密将被强制拒绝访问。

## Implementation Decisions

- **框架选型**：Next.js App Router (主要使用 Route Handlers 做 API)。
- **数据库选型**：SQLite + Prisma ORM (快速开发，极简部署)。
- **Schema 定义**：
  - `TestStats`: `id`, `testId` (String, unique), `baseCount` (Int), `realCount` (Int)
  - `ActivationCode`: `id`, `code` (String, unique), `testId` (String, nullable), `maxUses` (Int, default 3)
  - `DeviceBind`: `id`, `codeId` (Relation), `deviceId` (String) - 联合唯一键 `[codeId, deviceId]`
- **跨域调用 (CORS)**：所有的 API 接口必须显式在 `headers` 中返回 `Access-Control-Allow-Origin: *`。
- **设备号生成**：设备号不在后端生成，而是由接入的前端在 `localStorage` 中执行 `crypto.randomUUID()` 并在所有请求的 `Header` 中携带 `X-Device-Id`，降低后端对 Cookie 的依赖。

## Testing Decisions

- **核心验证**：重点测试 `/api/verify` 接口。
  - 测试用例1：无效卡密被拒绝。
  - 测试用例2：卡密有效且绑定第一台设备，放行。
  - 测试用例3：相同的 `deviceId` 多次调用 `verify`，放行且不增加绑定数。
  - 测试用例4：连续使用 4 个不同的 `deviceId` 验证同一个只允许使用 3 次的卡密，第 4 次必须被拒绝。
- **统计验证**：`/api/submit` 后检查返回的名次与 `realCount` 是否准确递增。

## Out of Scope

- 用户付费系统的直接对接（不包含微信支付或支付宝接入，由小红书完成收款和发卡）。
- 具体的性格测试业务逻辑运算（算法依然留在前端或各自独立项目中）。
- 复杂的鉴权系统（管理后台仅使用基础的密码 Token 保护即可，不需要复杂的 RBAC）。

## Further Notes
- 若要在同一个 Vercel 实例上部署，可将此后端做为独立 API 层，前端通过 `rewrites` 代理避免跨域。若不在一个实例上，严格配置跨域头即可。
