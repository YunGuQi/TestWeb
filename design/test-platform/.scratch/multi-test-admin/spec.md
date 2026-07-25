## Problem Statement

The admin dashboard currently only supports managing a single test (Emotional Friction Test). As we onboard more tests into the Hub (e.g., City Personality Test), the admin interface needs a way to switch contexts so administrators can manage questions, results, danmaku configurations, and view stats independently for each test. Currently, test data is mixed or completely disconnected from the database (in JSON files).

## Solution

Upgrade the database schema, API endpoints, and admin dashboard layout to support a multi-tenant (multi-test) architecture. 
Administrators will be able to select the current test from a dropdown in the admin layout navigation bar, which will persist the selection in the URL search params (`?testId=xxx`). The underlying admin pages and APIs will use this `testId` to filter the data presented and manipulated. As a result, the admin will be able to manage the Emotional Friction test, the City Personality test, and any future tests seamlessly from one dashboard.

## User Stories

1. As an admin, I want to select a specific test project from a dropdown in the admin header, so that I can focus on managing that specific test's content.
2. As an admin, I want to see the total number of test records specific to the selected test on the Overview page, so that I can track its individual performance.
3. As an admin, I want to add, edit, and delete questions (CMS) specifically for the selected test, so that questions from different tests do not get mixed up.
4. As an admin, I want to configure the result posters for the selected test, so that each test has its own unique set of outcomes.
5. As an admin, I want to manage danmaku settings and content for the selected test, so that each test has contextual danmaku.
6. As a system, I want existing data without a testId to be migrated to 'emotional-friction' by default, so that legacy functionality is preserved.
7. As a system, I want activation codes to remain a global asset without a strict testId, so that users can use their paid codes to unlock any test.

## Implementation Decisions

- **Database Multi-tenancy**: We will add a `testId` (String) field to `Question`, `ResultConfig`, `GlobalConfig`, and `TestRecord`.
- **Default fallback**: When `testId` is missing from the query params, it will default to `'emotional-friction'`.
- **State Management**: We will use URL Search Params (`?testId=...`) to track the currently selected test in the admin layout. This allows Server Components to read the state naturally and share URLs easily.
- **Activation Codes**: `ActivationCode` will remain global. It does not need a `testId` to allow "universal tickets" across the platform.
- **City Test Integration**: The City Personality test will need to be migrated from static JSON files to the database so it can be managed by this new admin dashboard.

## Testing Decisions

- A good test will verify that switching the dropdown changes the URL, and changing the URL updates the displayed data in the CMS and Overview pages without bleeding data from other tests.
- We will test the Prisma migration on local DB to ensure existing records default to `emotional-friction`.

## Out of Scope

- Building new tests from scratch.
- Refactoring the frontend logic of the actual test taking experience, beyond simply passing `testId` to submit endpoints.

## Further Notes
None.
