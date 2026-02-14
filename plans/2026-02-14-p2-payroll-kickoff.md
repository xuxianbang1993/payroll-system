# P2 Payroll Kickoff Plan (Post P1 Closeout)

## Goal

Deliver payroll module baseline on top of completed P1 data foundation:
- payroll calculator core
- payroll by-employee page
- payroll detail table page
- payroll flow E2E

## Scope

### In Scope
- `calculator.ts` and unit coverage for formula rules
- `/payroll/employee` page and monthly input persistence
- `/payroll/detail` page and grouped summary rendering
- payroll export entry points required by P2 PRD
- governance mapping and evidence refresh

### Out of Scope
- voucher generation and voucher exports (P3)
- installer/release packaging (P4)

## Proposed Implementation Steps

1. Read baseline documents:
   - `China/Devolop files SOP/01-data-model.md`
   - `China/Devolop files SOP/05-mod-payroll.md`
   - `China/Devolop files SOP/07-import-export.md`
2. Implement calculator core:
   - add `src/lib/calculator.ts`
   - add `src/lib/calculator.unit.spec.ts`
3. Implement payroll store and forms:
   - add/update store under `src/stores/`
   - wire monthly input models and validation
4. Implement pages:
   - `src/pages/payroll/PayrollByEmployeePage.tsx`
   - `src/pages/payroll/PayrollDetailPage.tsx`
   - update `src/router/app-routes.tsx`
5. Add E2E:
   - `tests/e2e/payroll-flow.spec.ts`
6. Refresh evidence:
   - run Vitest + targeted E2E
   - regenerate case map and XLSX report
7. Update docs:
   - SOP status lines
   - README done/pending section
   - plans progress/findings/task_plan

## Verification Targets

- `npm run build`
- `npm run test`
- `ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/payroll-flow.spec.ts`
- `node scripts/generate-p1-case-map.mjs` (or P2 map script once split)
- `node scripts/generate-p1-xlsx-report.mjs` (or P2 report script once split)

## Exit Criteria

- calculator unit tests pass
- payroll flow E2E passes
- existing P1 E2E (`db-isolation`, `backup-restore`, `p1-settings-employee-data`) remain green
- case map has no `mismatch` / `noEvidence`
