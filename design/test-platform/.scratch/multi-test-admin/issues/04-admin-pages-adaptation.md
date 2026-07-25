# 04 — Admin Pages Multi-tenant Adaptation

**What to build:** Update all server/client page components within the admin area to extract `testId` from `searchParams` and pass it to Prisma queries or API calls.

**Blocked by:** 02 — Admin Layout Switcher, 03 — API Multi-tenant Adaptation

**Status:** ready-for-agent

- [ ] Update `app/admin/page.tsx` (Overview) to filter PV and record counts by `testId`
- [ ] Update `app/admin/questions/page.tsx` (CMS)
- [ ] Update `app/admin/results/page.tsx` (Posters)
- [ ] Update `app/admin/danmaku/page.tsx` (Danmaku)
