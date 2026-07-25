# 03 — API Multi-tenant Adaptation

**What to build:** Update the backend admin endpoints (`/api/admin/questions`, `/api/admin/results`, `/api/admin/config`) to accept and filter by `testId` during CRUD operations.

**Blocked by:** 01 — Schema Migration

**Status:** ready-for-agent

- [ ] Modify `app/api/admin/questions/route.ts` to filter by and insert `testId`
- [ ] Modify `app/api/admin/results/route.ts` to filter by and insert `testId`
- [ ] Modify `app/api/admin/config/route.ts` to fetch and upsert config using `testId`
