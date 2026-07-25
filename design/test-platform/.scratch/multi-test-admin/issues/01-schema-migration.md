# 01 — Schema Migration for Multi-test Support

**What to build:** Add `testId` field to the database schema so we can isolate content for different tests.
- Add `testId` (String, default `"emotional-friction"`) to `Question`, `ResultConfig`, `GlobalConfig`, and `TestRecord`.
- Run Prisma migration. This will safely update existing records without breaking the current Emotional Friction test.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Update `prisma/schema.prisma`
- [ ] Run `npx prisma migrate dev --name add_testid`
