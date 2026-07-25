# 05 — City Test DB Migration

**What to build:** Move the "City Personality Test" from static JSON configuration into the newly multi-tenant database. Write an initialization script or manually insert the data via the newly functioning admin panel. Update the City Test's frontend API routes to query the database using `testId = "city-personality"` instead of parsing JSON files.

**Blocked by:** 01 — Schema Migration, 04 — Admin Pages Adaptation

**Status:** ready-for-agent

- [ ] Convert `city-personality.json` into DB records
- [ ] Refactor `app/api/city/questions/route.ts` to fetch from Prisma where `testId: 'city-personality'`
- [ ] Refactor `app/api/city/submit-test/route.ts` to verify against Prisma ResultConfig
