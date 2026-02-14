# P1 Data Closeout Sprint Plan (2026-02-14)

> Scope locked by user: P1 closeout sprint, Data module first, branch `codex/p1-sqlite-foundation`.

## Goal

Close the remaining P1 gate by delivering production-grade Data module flows (backup/restore/clear/storage), adding backup file IPC for desktop UX, and publishing updated objective evidence artifacts.

## Decisions Locked

- Keep test layout as-is:
  - Vitest specs under `src/**/*.{test,spec}.{ts,tsx}`
  - Playwright specs under `tests/e2e/*.spec.ts`
- Keep `db:reset` as **test-only** (`APP_ENV=test`) safety gate.
- Implement backup file interactions with **Electron native dialogs**.
- Keep plans files continuously updated after each milestone.

## Milestones

### M0 - Branch + Baseline
- [x] Switch to `main`
- [x] Create `codex/p1-sqlite-foundation`
- [x] Record baseline status and dirty workspace notes in progress log

### M1 - Planning Files Kickoff
- [x] Create this sprint plan file
- [x] Update `task_plan.md` to sprint-oriented phases
- [x] Append execution kickoff findings
- [x] Append session progress and checkpoints

### M2 - Backend Data Closeout APIs
- [x] Add repository clear-data contract and adapter implementations (`legacy/sqlite/dual`)
- [x] Add IPC channel `repo:data:clear`
- [x] Add backup file services in main process:
  - `file:backup:save-json`
  - `file:backup:open-json`
- [x] Expose preload bridge and renderer wrappers

### M3 - Data Pages
- [x] Add `/data/backup` page
- [x] Add `/data/storage` page
- [x] Replace placeholder routes with real pages
- [x] Add i18n keys (`zh-CN`, `zh-HK`, `en`)

### M4 - Testing
- [x] Extend unit tests for new repository/bridge behavior
- [x] Add unit tests for backup file bridge
- [x] Add `tests/e2e/backup-restore.spec.ts`
- [x] Ensure `db-isolation.spec.ts` still passes

### M5 - Evidence + Docs
- [x] Update governance case map and p1 test cases
- [x] Run test commands and export raw JSON
- [x] Regenerate case-map reconciliation + XLSX report
- [x] Update root README and app README
- [x] Finalize plans status to done

## Verification Targets

- `npm run test`
- `npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts`
- `node scripts/generate-p1-case-map.mjs`
- `node scripts/generate-p1-xlsx-report.mjs`

### Verification Snapshot

- `npm run build`: PASS
- `npm run test`: PASS (50/50)
- `ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts`: PASS (3/3)
- `node scripts/generate-p1-case-map.mjs`: PASS (`match=16`, `mismatch=0`, `noEvidence=0`)
- `node scripts/generate-p1-xlsx-report.mjs`: PASS (`p1-test-report-20260214_085752.xlsx`)

## Risks

- Electron GUI runs may be blocked in Codex/macOS without `ALLOW_ELECTRON_GUI_IN_CODEX=1`.
- Existing dirty `dist-electron` and `.DS_Store` workspace state can pollute commits if staged broadly.

---

## Extension: P1 Full Module Closeout (Settings + Employee + Import/Export)

### Scope Expansion Confirmed
- In scope added after Data closeout:
  - `settings` pages and interactions
  - `employee` list CRUD and details
  - `import-export` template/import/conflict/export flow
- Out of scope unchanged:
  - `payroll`
  - `voucher`

### Delivered Items
- Added pages:
  - `src/pages/settings/OrgSettingsPage.tsx`
  - `src/pages/settings/SocialConfigPage.tsx`
  - `src/pages/settings/CompanyPage.tsx`
  - `src/pages/employee/EmployeeListPage.tsx`
  - `src/pages/employee/ImportExportPage.tsx`
- Added state/data utilities:
  - `src/stores/settings-store.ts`
  - `src/stores/employee-store.ts`
  - `src/lib/p1-employee-import-export.ts`
- Routes updated in `src/router/app-routes.tsx` (settings + employee placeholders removed).
- Locale updates completed in all three language packs.

### Added Verification
- Unit/component tests:
  - `src/lib/p1.employee-import-export.unit.spec.ts`
  - `src/stores/p1.settings-store.unit.spec.ts`
  - `src/stores/p1.employee-store.unit.spec.ts`
  - `src/pages/settings/p1.org-settings.component.spec.tsx`
  - `src/pages/employee/p1.employee-list.component.spec.tsx`
- E2E:
  - `tests/e2e/p1-settings-employee-data.spec.ts`

### Final Verification Snapshot
- `npm run build`: PASS
- `npm run test`: PASS (64/64)
- `ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts tests/e2e/p1-settings-employee-data.spec.ts`: PASS (4/4)
- `node scripts/generate-p1-case-map.mjs`: PASS (`match=25`, `mismatch=0`, `noEvidence=0`)
- `node scripts/generate-p1-xlsx-report.mjs`: PASS (`p1-test-report-20260214_092954.xlsx`)

### Closeout Review Patch (Top 3 Risks)
- [x] Import conflict guard hardening:
  - unresolved conflicts now block the main apply button
  - explicit "resolve conflicts" action added
- [x] Employee detail usability:
  - added direct jump-to-inline-edit action in detail card
- [x] Overview readiness semantics:
  - settings/employee/data modules show `ready`
  - payroll/voucher remain `pending`
- [x] Targeted regression tests added/updated for above changes

### Latest Verification Snapshot (Post Patch)
- `npm run test -- src/pages/employee/p1.employee-list.component.spec.tsx src/pages/employee/p1.import-export.component.spec.tsx src/pages/home/p1.overview-status.component.spec.tsx`: PASS (4/4)
- `npm run build`: PASS
- `npm run test`: PASS (67/67)
- `ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts tests/e2e/p1-settings-employee-data.spec.ts`: PASS (4/4)
- `node scripts/generate-p1-case-map.mjs`: PASS (`match=25`, `mismatch=0`, `noEvidence=0`)
- `node scripts/generate-p1-xlsx-report.mjs`: PASS (`p1-test-report-20260214_100814.xlsx`)

### Release Handoff
- Release version: `2.1.2-p1-sqlite-finish`
- P1 status: closed
- Handoff target: start P2 payroll implementation plan at:
  - `plans/2026-02-14-p2-payroll-kickoff.md`
