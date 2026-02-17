# P1 Bugfix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all P1 code review issues (8 oversized files, i18n violations, replaceEmployees data safety, missing tests, duplicated code) before entering P2.

**Architecture:** Bottom-up approach — extract shared utilities first, then refactor stores/pages, then fix DB layer, then add tests. Each task is independently verifiable with existing test suite.

**Tech Stack:** React + TypeScript + Zustand + better-sqlite3 + Vitest + Playwright + i18next

**Model Tier Policy:** Each task annotates the recommended Claude Code model. Simple (Haiku 4.5), Medium (Sonnet 4.5 Thinking), Hard (Opus 4.6). User approves model before execution.

---

## Batch A: Foundation Utilities (Haiku 4.5)

### Task A1: Extract shared utility functions

**Model:** Haiku 4.5 — pure code relocation, no business logic

**Files:**
- Create: `src/utils/format.ts`
- Create: `src/utils/error.ts`
- Create: `src/utils/type-guards.ts`
- Modify: `src/stores/settings-store.ts` — remove duplicated functions, import from utils
- Modify: `src/stores/employee-store.ts` — same
- Modify: `src/pages/data/BackupPage.tsx` — same
- Modify: `src/pages/data/StoragePage.tsx` — same
- Modify: `src/pages/settings/OrgSettingsPage.tsx` — same
- Modify: `src/pages/settings/SocialConfigPage.tsx` — same
- Modify: `src/pages/employee/EmployeeListPage.tsx` — same

**Step 1:** Read all files that contain duplicated functions. Identify exact function signatures for `toErrorMessage`, `formatAmount`, `formatBytes`, `formatCurrency`, `parseNumber`, `asRecord`, `asObject`.

**Step 2:** Create `src/utils/format.ts` with `formatAmount`, `formatBytes`, `formatCurrency`, `parseNumber`.

**Step 3:** Create `src/utils/error.ts` with `toErrorMessage`.

**Step 4:** Create `src/utils/type-guards.ts` with `asRecord`, `asObject` (and any other shared type guards).

**Step 5:** Replace all duplicated definitions in consuming files with imports from the new utils.

**Step 6:** Run `npm run test` — expect 67/67 pass (no behavior change).

**Step 7:** Commit: `refactor: extract shared utility functions (format/error/type-guards)`

---

### Task A2: Extract E2E test helpers

**Model:** Haiku 4.5 — pure code relocation

**Files:**
- Create: `tests/e2e/helpers.ts`
- Modify: `tests/e2e/db-isolation.spec.ts`
- Modify: `tests/e2e/backup-restore.spec.ts`
- Modify: `tests/e2e/p1-settings-employee-data.spec.ts`

**Step 1:** Read all 3 E2E spec files. Identify shared functions: `launchElectronForDbTest`, `launchElectronForDataTest`, `launchElectronForP1Test`, `getFirstWindowOrThrow`.

**Step 2:** Create `tests/e2e/helpers.ts` with a unified `launchElectronForTest(options)` and `getFirstWindowOrThrow(electronApp)`.

**Step 3:** Update all 3 spec files to import from `helpers.ts`, remove duplicated definitions.

**Step 4:** Run E2E tests (user runs manually):
```bash
ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts tests/e2e/p1-settings-employee-data.spec.ts
```
Expected: 4/4 pass.

**Step 5:** Commit: `refactor: extract shared E2E test helpers`

---

## Batch B: i18n + Store Refactor (Sonnet 4.5 Thinking)

### Task B1: Convert settings-store to i18n keys + extract utils

**Model:** Sonnet 4.5 Thinking — single module logic refactor

**Files:**
- Create: `src/utils/settings-utils.ts`
- Modify: `src/stores/settings-store.ts`
- Modify: `src/i18n/locales/zh-CN/common.json`
- Modify: `src/i18n/locales/zh-HK/common.json`
- Modify: `src/i18n/locales/en/common.json`
- Modify: `src/pages/settings/OrgSettingsPage.tsx` — resolve i18n keys from store
- Test: `src/stores/p1.settings-store.unit.spec.ts`

**Step 1:** Read `settings-store.ts`. Identify all hardcoded Chinese strings and pure utility functions.

**Step 2:** Create `src/utils/settings-utils.ts` — extract `normalizeSettings`, `computeOrgStats`, `normalizeCompanies`, validation logic.

**Step 3:** Replace all hardcoded Chinese in `settings-store.ts` with i18n key strings (e.g., `"error.settingsSaveFailed"`, `"error.orgNameEmpty"`, `"success.orgNameSaved"`).

**Step 4:** Add new i18n keys to all 3 locale files.

**Step 5:** Update `OrgSettingsPage.tsx` (and other consuming components) to use `t(store.errorMessage)` for display.

**Step 6:** Update unit test to reflect new key-based error messages.

**Step 7:** Run `npm run test` — all tests pass.

**Step 8:** Verify `settings-store.ts` ≤ 200 lines, `settings-utils.ts` ≤ 200 lines.

**Step 9:** Commit: `refactor(settings): extract utils and convert to i18n keys`

---

### Task B2: Convert employee-store to i18n keys + extract utils

**Model:** Sonnet 4.5 Thinking — single module logic refactor

**Files:**
- Create: `src/utils/employee-utils.ts`
- Modify: `src/stores/employee-store.ts`
- Modify: `src/i18n/locales/zh-CN/common.json`
- Modify: `src/i18n/locales/zh-HK/common.json`
- Modify: `src/i18n/locales/en/common.json`
- Modify: `src/pages/employee/EmployeeListPage.tsx` — resolve i18n keys
- Test: `src/stores/p1.employee-store.unit.spec.ts`

**Step 1:** Read `employee-store.ts`. Identify all hardcoded Chinese and extractable utilities.

**Step 2:** Create `src/utils/employee-utils.ts` — extract `sanitizeEmployeeInput`, `validateNumeric`, `toEmployeeRecord`, `nextEmployeeId`.

**Step 3:** Replace all hardcoded Chinese with i18n keys.

**Step 4:** Add keys to 3 locale files.

**Step 5:** Update consuming pages to resolve keys.

**Step 6:** Update unit test.

**Step 7:** Run `npm run test` — all pass.

**Step 8:** Verify both files ≤ 200 lines.

**Step 9:** Commit: `refactor(employee): extract utils and convert to i18n keys`

---

### Task B3: Fix OverviewPage i18n + employee type enum

**Model:** Sonnet 4.5 Thinking — involves data model semantic change

**Files:**
- Modify: `src/pages/home/OverviewPage.tsx`
- Modify: `src/types/payroll.ts` — define `EmployeeType` enum
- Modify: `src/stores/employee-store.ts` — use enum
- Modify: `src/i18n/locales/zh-CN/common.json`
- Modify: `src/i18n/locales/zh-HK/common.json`
- Modify: `src/i18n/locales/en/common.json`
- Test: `src/pages/home/p1.overview-status.component.spec.tsx`

**Step 1:** Add `EmployeeType = "management" | "sales"` to `src/types/payroll.ts`.

**Step 2:** Replace all hardcoded KPI labels and button text in `OverviewPage.tsx` with `t()` calls.

**Step 3:** Replace `"管理"` / `"销售"` internal values with `"management"` / `"sales"` in store and related pages.

**Step 4:** Add i18n keys for KPI labels and employee types to all 3 locale files.

**Step 5:** Update test assertions to match new i18n approach.

**Step 6:** Run `npm run test` — all pass.

**Step 7:** Commit: `refactor(i18n): convert overview and employee type to i18n keys`

---

## Batch C: Page/Component Extraction (Sonnet 4.5 Thinking)

### Task C1: Split EmployeeListPage into components

**Model:** Sonnet 4.5 Thinking — single module component extraction

**Files:**
- Create: `src/components/EmployeeForm.tsx`
- Create: `src/components/EmployeeDetail.tsx`
- Create: `src/components/EmployeeInlineRow.tsx`
- Modify: `src/pages/employee/EmployeeListPage.tsx`
- Test: existing `src/pages/employee/p1.employee-list.component.spec.tsx`

**Step 1:** Read `EmployeeListPage.tsx` fully. Identify Dialog (~120 lines), Detail card (~35 lines), InlineRow (~150 lines).

**Step 2:** Extract `EmployeeForm.tsx` — the add-employee Dialog with form fields and validation.

**Step 3:** Extract `EmployeeDetail.tsx` — the expanded employee detail Card section.

**Step 4:** Extract `EmployeeInlineRow.tsx` — the inline edit table row.

**Step 5:** Update `EmployeeListPage.tsx` to import and use the 3 new components.

**Step 6:** Verify `EmployeeListPage.tsx` ≤ 200 lines, each extracted component ≤ 200 lines.

**Step 7:** Run `npm run test` — all pass.

**Step 8:** Commit: `refactor(employee): extract Form, Detail, InlineRow components`

---

### Task C2: Split ImportExportPage

**Model:** Sonnet 4.5 Thinking — single module

**Files:**
- Create: `src/components/ImportPreview.tsx`
- Create: `src/components/ExportPanel.tsx`
- Modify: `src/pages/employee/ImportExportPage.tsx`
- Modify: `src/lib/p1-employee-import-export.ts` → split into:
  - Create: `src/lib/employee-import-parse.ts`
  - Create: `src/lib/employee-import-merge.ts`
- Test: `src/pages/employee/p1.import-export.component.spec.tsx`
- Test: `src/lib/p1.employee-import-export.unit.spec.ts`

**Step 1:** Read both files fully.

**Step 2:** Split `p1-employee-import-export.ts` into `employee-import-parse.ts` (template + parse) and `employee-import-merge.ts` (conflict detection + merge).

**Step 3:** Extract `ImportPreview.tsx` and `ExportPanel.tsx` from `ImportExportPage.tsx`.

**Step 4:** Update imports in page and tests.

**Step 5:** Verify all files ≤ 200 lines.

**Step 6:** Run `npm run test` — all pass.

**Step 7:** Commit: `refactor(import-export): split page and utility into focused modules`

---

### Task C3: Split BackupPage + sqlite-backup

**Model:** Sonnet 4.5 Thinking — single module

**Files:**
- Create: `src/components/BackupActions.tsx`
- Create: `src/components/RestoreActions.tsx`
- Modify: `src/pages/data/BackupPage.tsx`
- Create: `electron/db/repository/sqlite-import.ts`
- Modify: `electron/db/repository/sqlite-backup.ts`

**Step 1:** Read both files.

**Step 2:** Extract `BackupActions.tsx` and `RestoreActions.tsx` from `BackupPage.tsx`.

**Step 3:** Extract `sqlite-import.ts` (importBackup logic) from `sqlite-backup.ts`.

**Step 4:** Verify all files ≤ 200 lines.

**Step 5:** Run `npm run test` — all pass.

**Step 6:** Commit: `refactor(data): split backup page and sqlite-backup module`

---

## Batch D: DB Layer — Incremental CRUD (Opus 4.6)

### Task D1: Add incremental employee CRUD to repository layer

**Model:** Opus 4.6 — cross-layer DB/IPC/preload/store refactor

**Files:**
- Modify: `electron/db/repository/contracts.ts` — add `addEmployee`, `updateEmployee`, `deleteEmployee`
- Modify: `electron/db/repository/sqlite-employees.ts` — implement SQLite CRUD
- Modify: `electron/db/repository/legacy-adapter.ts` — implement legacy CRUD
- Modify: `electron/db/repository/switching-repository.ts` — route new methods
- Modify: `electron/main.ts` (or split IPC file) — add IPC handlers
- Modify: `electron/preload.cts` — expose new channels
- Modify: `src/types/electron-api.d.ts` — type declarations
- Modify: `src/lib/p1-repository.ts` — renderer bridge wrappers
- Modify: `src/stores/employee-store.ts` — use incremental methods
- Test: `src/lib/p1.repository-switching.unit.spec.ts` — extend
- Test: `src/stores/p1.employee-store.unit.spec.ts` — extend

**Step 1:** Read `contracts.ts` and `sqlite-employees.ts` fully.

**Step 2:** Extend `RepositoryAdapter` interface with `addEmployee`, `updateEmployee`, `deleteEmployee`.

**Step 3:** Implement in `sqlite-employees.ts`:
- `addEmployee`: INSERT single row, return with generated ID
- `updateEmployee`: UPDATE by ID, do NOT touch payroll tables
- `deleteEmployee`: DELETE employee + CASCADE only that employee's payroll data

**Step 4:** Implement in `legacy-adapter.ts` (array manipulation).

**Step 5:** Wire through `switching-repository.ts`.

**Step 6:** Add IPC handlers, preload, types, renderer bridge.

**Step 7:** Update `employee-store.ts` to call incremental methods.

**Step 8:** Mark `replaceEmployees` as `@deprecated` in contracts.

**Step 9:** Extend unit tests for new methods.

**Step 10:** Run `npm run test` — all pass.

**Step 11:** Commit: `feat(employee): add incremental CRUD, deprecate bulk replace`

---

## Batch E: IPC Architecture (Opus 4.6)

### Task E1: Split electron/main.ts into IPC modules

**Model:** Opus 4.6 — cross-module architecture

**Files:**
- Create: `electron/ipc/store-ipc.ts`
- Create: `electron/ipc/db-ipc.ts`
- Create: `electron/ipc/repository-ipc.ts`
- Create: `electron/ipc/file-ipc.ts`
- Create: `electron/ipc/index.ts`
- Modify: `electron/main.ts`

**Step 1:** Read `electron/main.ts` fully. Identify 4 IPC handler groups.

**Step 2:** Create 4 IPC modules, each exporting a `registerXxxIpc(ipcMain, deps)` function.

**Step 3:** Create `electron/ipc/index.ts` barrel export.

**Step 4:** Slim `electron/main.ts` to app lifecycle + registration calls only.

**Step 5:** Add lightweight input validation (zod or hand-written guards) at IPC boundary in each module.

**Step 6:** Verify `electron/main.ts` ≤ 200 lines, each IPC module ≤ 200 lines.

**Step 7:** Run `npm run build` + `npm run test` — all pass.

**Step 8:** Commit: `refactor(electron): split IPC handlers into focused modules with validation`

---

## Batch F: Tests + Polish (Sonnet 4.5 Thinking)

### Task F1: Add missing component tests

**Model:** Sonnet 4.5 Thinking — single module test writing

**Files:**
- Create: `src/pages/settings/p1.social-config.component.spec.tsx`
- Create: `src/pages/settings/p1.company.component.spec.tsx`
- Create: `src/components/p1.employee-form.component.spec.tsx`

**Step 1:** Write `p1.social-config.component.spec.tsx` — test real-time example update on config change.

**Step 2:** Write `p1.company.component.spec.tsx` — test company CRUD.

**Step 3:** Write `p1.employee-form.component.spec.tsx` — test required field validation, submit data, defaults.

**Step 4:** Run `npm run test` — all existing + new tests pass.

**Step 5:** Commit: `test: add component tests for SocialConfig, Company, EmployeeForm`

---

### Task F2: SocialConfigPage decimal.js

**Model:** Haiku 4.5 — single file, simple change

**Files:**
- Modify: `src/pages/settings/SocialConfigPage.tsx`

**Step 1:** Read relevant lines (example calculation). Import `Decimal` from `decimal.js`.

**Step 2:** Replace native arithmetic with `new Decimal(...)` operations.

**Step 3:** Run `npm run test` — all pass.

**Step 4:** Commit: `fix(settings): use decimal.js for example calculation`

---

## Batch G: Verification (Sonnet 4.5 Thinking)

### Task G1: Full regression + file size audit + evidence refresh

**Model:** Sonnet 4.5 Thinking — test execution and validation

**Step 1:** Run file size audit:
```bash
find src/ electron/ -name '*.ts' -o -name '*.tsx' | xargs wc -l | sort -rn | head -20
```
Expect: no file > 200 lines.

**Step 2:** Run i18n audit:
```bash
grep -rn '[\u4e00-\u9fff]' src/stores/ src/pages/ --include='*.ts' --include='*.tsx'
```
Expect: zero matches (excluding imports/comments).

**Step 3:** Run `npm run build` — PASS.

**Step 4:** Run `npm run test` — all pass (67 + new tests).

**Step 5:** User runs E2E:
```bash
ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts tests/e2e/p1-settings-employee-data.spec.ts
```
Expect: 4/4 pass.

**Step 6:** Regenerate evidence:
```bash
node scripts/generate-p1-case-map.mjs
node scripts/generate-p1-xlsx-report.mjs
```

**Step 7:** Commit all evidence updates.

**Step 8:** Update `plans/progress.md` and READMEs.

**Step 9:** Final commit: `chore: P1 bugfix complete, evidence refreshed`

---

## Execution Order Summary

| Batch | Tasks | Model | Dependencies |
|-------|-------|-------|-------------|
| A | A1, A2 | Haiku 4.5 | None |
| B | B1, B2, B3 | Sonnet 4.5 Thinking | A1 |
| C | C1, C2, C3 | Sonnet 4.5 Thinking | B1, B2 |
| D | D1 | Opus 4.6 | B2 |
| E | E1 | Opus 4.6 | D1 |
| F | F1, F2 | Sonnet/Haiku | C1, E1 |
| G | G1 | Sonnet 4.5 Thinking | All |
