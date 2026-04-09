# Checkpoint: 2026-04-09 (Post-P3)

## Project State Summary

| Item | Value |
|------|-------|
| **Branch** | `main` |
| **Latest Tag** | `v2.1.2-p3-voucher` |
| **Latest Commit** | `eb40229` — feat(P3): Complete voucher module |
| **Tests** | 155/155 PASS (P1: 83 + P2: 47 + P3: 25) |
| **Build** | tsc + vite + tsc-electron all passing |
| **Release** | [v2.1.2-p3-voucher](https://github.com/xuxianbang1993/payroll-system/releases/tag/v2.1.2-p3-voucher) |

---

## Phase Progress

| Phase | Status | Description |
|-------|--------|-------------|
| P0 | Done | Framework + design system + test infra |
| P1 | Done | Settings + Employee + Data management (83 tests) |
| P2 | Done | Payroll module complete (47 tests added, 130/130 total) |
| P3 | Done | Voucher module complete (25 tests added, 155/155 total) |
| **P4** | **Next** | Packaging (.dmg/.exe) + full acceptance |

### P2 Sub-phases (All Complete)

| Sub-phase | Deliverable |
|-----------|-------------|
| P2.1 | `calculator.ts` — single payslip calculation engine (13 tests) |
| P2.2 | `aggregator.ts` — aggregate all employees (7 tests) |
| P2.3 | `sqlite-payroll.ts` — payroll CRUD repository (10 tests, 2 CRIT fixes) |
| P2.4 | IPC + Preload + Renderer bridge (5 channels, 4 files extended) |
| P2.5 | `payroll-store.ts` — Zustand state layer (17 tests, 1 CRIT fix) |
| P2.6 | `MonthPicker.tsx` + `PayCard.tsx` — UI components |
| P2.7 | `PayrollByEmpPage.tsx` — per-employee input page |
| P2.8 | `PayrollDetailPage.tsx` — 28-column detail table |
| P2.9 | `payroll-flow.spec.ts` — E2E tests (4 cases) |
| P2.10 | Full regression + 5 CRITICAL fixes |

### P3 Sub-phases (All Complete)

| Sub-phase | Deliverable |
|-----------|-------------|
| P3.1 | `voucher.ts` types + `voucherGenerator.ts` — 5 voucher pure functions (13 unit tests) |
| P3.2 | `VoucherCard.tsx` — presentational voucher card component (70 lines) |
| P3.3 | `VoucherPage.tsx` — overview page + company filter + route wiring + i18n |
| P3.4 | `voucher-csv.ts` — CSV export with UTF-8 BOM + RFC 4180 (5 tests) |
| P3.5 | `voucher-flow.spec.ts` — 4 Playwright E2E scenarios |

### P3 Acceptance Criteria (All Met)

- ✅ A-04: 5 vouchers all balanced (debit = credit)
- ✅ A-05: Filter by company entity works correctly
- ✅ A-11: After all 5 vouchers, "应付职工薪酬-人员工资" balance = 0

### P3 Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Voucher data structure | VoucherEntry → Voucher → VoucherSet | Minimal coupling, component needs Voucher, page needs VoucherSet |
| Generator returns null | All-zero voucher = null | Clearer semantics, page uses filter(Boolean) |
| Account names hardcoded | Chinese accounting terms, not i18n | Regulatory domain terms are fixed |
| No voucher-store | Real-time computed from payroll slips | YAGNI — avoid state redundancy |
| CSV without SheetJS | Simple 5-column structure | YAGNI — no heavy dependency needed |
| Company filter at page level | aggregatePaySlips(slips, filterCompany) | Reuse P2.2 capability |

---

## P4 Scope (Next Up)

Per `09-nonfunctional.md` + `10-acceptance.md`:

### Deliverables
1. electron-builder config (.dmg + .exe)
2. App icon
3. i18n completion (~200 keys)
4. `npm run test:all` full regression
5. `10-acceptance.md` A-01~A-12, B-01~B-09 full verification

### Acceptance Criteria (Remaining)
- P2: A-03 (工资计算), A-07 (PDF 工资条)
- P4: B-01~B-04 (安装包与离线验收)
- All: A-12 (测试证据一致性)

### Pending Export Features
- Payroll CSV export (P2)
- PDF payslips batch export (P2)

---

## Tech Stack (Locked)

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron 40 |
| Frontend | React 19 + TypeScript |
| Build | Vite 7 |
| UI | shadcn/ui + Tailwind CSS |
| State | Zustand |
| i18n | i18next (zh-HK / zh-CN / en) |
| DB | SQLite (better-sqlite3) + electron-store |
| Precision | decimal.js |
| Test | Vitest + Playwright |

---

## SOP Documents (Devolop files SOP/)

| File | Module | Status |
|------|--------|--------|
| 00-INDEX.md | PRD master index | Current (v1.4) |
| 01-data-model.md | Data model / interfaces | Current (v1.0) |
| 02-ui-layout.md | Layout & navigation | Current (v2.3) |
| 03-mod-settings.md | Settings module | Done (P1) |
| 04-mod-employee.md | Employee module | Done (P1) |
| 05-mod-payroll.md | Payroll module | Done (P2) |
| 06-mod-voucher.md | Voucher module | Done (P3) |
| 07-import-export.md | Import/Export | Partial (employee done, payroll/voucher CSV done, PDF pending) |
| 08-data-management.md | Backup/Restore | Done (P1) |
| 09-nonfunctional.md | NFR | Current (v1.5) |
| 10-acceptance.md | Acceptance criteria | Current (v1.5) |
| 薪酬系统-开发策略文档.md | Dev strategy (CLAUDE.md) | Current (v3.6) |

---

## Source Code Structure (payroll-app/src/)

```
src/
  services/
    calculator.ts          — payslip calculation (P2.1)
    aggregator.ts          — employee aggregation (P2.2)
    voucherGenerator.ts    — 5 voucher generation (P3.1)
  stores/
    settings-store.ts      — settings Zustand store (P1)
    employee-store.ts      — employee Zustand store (P1)
    payroll-store.ts       — payroll Zustand store (P2.5)
    app-store.ts           — app-level UI state
  pages/
    home/                  — OverviewPage
    settings/              — OrgSettings / SocialConfig / Company (P1)
    employee/              — EmployeeList / ImportExport (P1)
    payroll/               — PayrollByEmp / PayrollDetail (P2.6-P2.8)
    data/                  — Backup / Storage (P1)
    voucher/               — VoucherPage (P3.3)
  components/
    MonthPicker.tsx        — year-month selector (P2.6)
    PayCard.tsx            — collapsible employee paycard (P2.6)
    VoucherCard.tsx        — voucher display card (P3.2)
    ui/                    — shadcn/ui base components
  lib/
    decimal.ts             — decimal.js wrapper
    p1-repository.ts       — renderer repository bridge
    electron-store.ts      — electron-store wrapper
    employee-import-*.ts   — import parse + merge
  types/
    payroll.ts             — PaySlip / PayrollInput / AggregateResult types
    voucher.ts             — VoucherEntry / Voucher / VoucherSet types (P3.1)
    electron-api.d.ts      — IPC type definitions
  utils/
    format.ts              — formatAmount / formatCurrency
    voucher-csv.ts         — CSV export utility (P3.4)
    error.ts / i18n-utils.ts / type-guards.ts
  i18n/                    — zh-HK / zh-CN / en
```

---

## AI Model Tiering Rules (Enforced)

| Task | Tool / Agent |
|------|-------------|
| Code development | Codex via CCB (`/ask codex`, gpt-5.3-codex, xhigh) |
| Code review | CTO manual review (Claude Opus 4.6) |
| Architecture | `subagent_type: "architect"` (Opus) |
| Doc validation | `subagent_type: "doc-validator"` (Haiku) |
| Quality check | `subagent_type: "quality-checker"` (Haiku) |
| Claude direct | Small fixes (<=10 lines), Git, docs, i18n, config only |

---

## Remaining Work (P4)

### P4: Packaging & Acceptance
1. electron-builder config (.dmg + .exe)
2. App icon
3. i18n completion (~200 keys)
4. `npm run test:all` full regression
5. `10-acceptance.md` A-01~A-12, B-01~B-09 full verification

### Pending Export Features
- Payroll CSV export (P2)
- PDF payslips batch export (P2)
