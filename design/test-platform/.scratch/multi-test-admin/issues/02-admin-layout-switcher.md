# 02 — Admin Layout Switcher

**What to build:** Add a dropdown selector in the Admin navigation bar (`app/admin/layout.tsx`) that lets the administrator choose between "深度情绪测试" (`emotional-friction`) and "性格城市测试" (`city-personality`). Selecting a test updates the URL parameter `?testId=xxx` globally across the admin routes.

**Blocked by:** None — can start immediately (though conceptually depends on 01 to be useful).

**Status:** ready-for-agent

- [ ] Create a client component `TestSwitcher.tsx`
- [ ] Embed `TestSwitcher` in `app/admin/layout.tsx`
- [ ] Ensure switching changes the URL `searchParams` gracefully
