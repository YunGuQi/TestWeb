## Problem Statement

目前共享大盘服务仅实现了基础的激活码分发和基础的设备数量拦截，但在实际的小红书虚拟赛道运营中，经常面临订单被恶意传播（白嫖）的风险。运营人员缺乏对激活码的深度管控手段，比如无法封禁特定滥用订单，无法清理超出限制的异常设备，也无法追踪单个设备的活跃度（最近使用时间、使用频次）。

## Solution

在现有的共享后端服务中引入高级卡密管理能力：
1. 提供卡密一键封禁和解禁能力，使恶意传播的卡密彻底失效。
2. 详细记录每个设备的使用生命周期（首次验证、最近一次验证、总验证次数）。
3. 支持一键清理异常传播带来的多余设备权限，仅保留该订单最先验证的前 3 个设备，其他设备记录被清空且后续拦截。
4. 后台列表展示这些详细维度的信息并支持丰富的操作和统计。

## User Stories

1. As an 运营管理员, I want to 在后台列表中看到每个激活码的绑定设备详情（首次时间、最近时间、使用次数）, so that 我可以判断该订单是否属于正常个人使用。
2. As an 运营管理员, I want to 能够一键禁用某个被大量倒卖的激活码, so that 倒卖的买家无法再用此激活码解锁内容，减少资产损失。
3. As an 运营管理员, I want to 能够一键清理某个卡密下超过3个的多余设备权限, so that 既不影响最早正常买单的真实用户（前3个设备），又能踢掉所有通过白嫖渠道后来的用户。
4. As a 真实买单用户, I want to 正常在我的手机和 iPad 上验证测试结果, so that 我的合理设备使用（不超过限制）完全不受管理员清理异常设备操作的影响。

## Implementation Decisions

- **Schema changes**: 
  - `ActivationCode` 模型增加 `isDisabled` (Boolean，默认为 false)。
  - `DeviceBind` 模型增加 `lastUsedAt` (DateTime，默认为 now) 和 `useCount` (Int，默认为 1)。
- **API Contracts**: 
  - `POST /api/verify` 需要更新行为：校验 `isDisabled` 状态；在绑定成功或已绑定放行时，执行数据库 `update` 更新该设备的 `lastUsedAt` 和 `useCount`。
  - 新增管理端接口：`/api/admin/code/[id]/disable`、`/api/admin/code/[id]/devices`、`/api/admin/code/[id]/clear-devices`。
- **UI Modifications**: 
  - 修改 `src/app/admin/page.tsx`，将现有的简单列表升级为数据密度更高的数据表格。

## Testing Decisions

- **Testing external behavior**: 
  - 验证逻辑：被 disabled 的卡密在前端触发 verify 时必须立刻返回错误信息，且前端弹窗报错。
  - 设备限制逻辑：当调用 clear-devices 保留前3个时，按 createdAt 排序的第4个设备及以后的数据库记录必须被物理删除，这些设备再次请求 verify 应当被视为新设备并因为超过 maxUses 而被阻挡。

## Out of Scope

- 范围式订单编号（如号段 1000-2000 整个放行）的实现暂不在本期考虑，后续作为一个独立的权限放行规则模块处理。
