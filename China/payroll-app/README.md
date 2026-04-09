# Payroll App (Electron + React)

本目录是薪酬系统桌面端应用代码（Electron 主进程 + React 渲染进程）。

## Release Status

- Current release: `v2.1.2-p3-voucher`
- Milestone: P3 (Voucher Module) **COMPLETE** — 5 accounting vouchers, UI, CSV export, 155/155 PASS
- Previous: P2 (Payroll Module) complete — 130/130 PASS

## Tech Stack

- Electron 40
- React 19 + TypeScript
- Vite 7
- Zustand
- i18next
- SQLite (`better-sqlite3`) + `electron-store`
- decimal.js (monetary precision)
- Vitest + Playwright

## Development

工作目录：

```bash
cd "/Users/xuxianbang/Documents/payroll system/China/payroll-app"
```

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Test Commands

```bash
npm run test
npm run test:e2e
npm run test:all
```

说明：

- `npm run test` 会先执行 `abi:node`，再跑 Vitest。
- `npm run test:e2e` 会先执行 `abi:electron`，再跑 Playwright。
- 若在 Codex/macOS 环境执行 GUI Electron 测试，需设置：
  - `ALLOW_ELECTRON_GUI_IN_CODEX=1`

## Test File Layout (Locked)

- Vitest unit/component：`tests/unit/**/*.{test,spec}.{ts,tsx}`
- Playwright E2E：`tests/e2e/*.spec.ts`
- E2E fixtures：`tests/fixtures/*`

## Module Completion Status

| Module | Phase | Status | Tests |
|--------|-------|--------|-------|
| Settings | P1 | ✅ Complete | Unit + Component |
| Employee | P1 | ✅ Complete | Unit + Component + E2E |
| Data Management | P1 | ✅ Complete | Unit + E2E |
| Payroll Calculator | P2.1 | ✅ Complete | 13 unit |
| Payroll Aggregator | P2.2 | ✅ Complete | 7 unit |
| Payroll Repository | P2.3 | ✅ Complete | 10 unit |
| Payroll IPC Bridge | P2.4 | ✅ Complete | Build verified |
| Payroll Store | P2.5 | ✅ Complete | 17 unit |
| Payroll UI | P2.6-P2.8 | ✅ Complete | Component |
| Payroll E2E | P2.9-P2.10 | ✅ Complete | 4 E2E + 5 CRIT fixes |
| **Voucher Generator** | **P3.1** | **✅ Complete** | **13 unit** |
| **Voucher UI** | **P3.2-P3.3** | **✅ Complete** | **Component + Route** |
| **Voucher CSV Export** | **P3.4** | **✅ Complete** | **5 unit** |
| **Voucher E2E** | **P3.5** | **✅ Complete** | **4 E2E scenarios** |
| Packaging | P4 | Pending | — |

## P3 Voucher Module (Complete — 2026-04-09)

### Architecture
```
types/voucher.ts → services/voucherGenerator.ts → components/VoucherCard.tsx → pages/voucher/VoucherPage.tsx
```

Four-layer brick architecture — each layer depends only on the layer below, no reverse coupling.

### New Files
- `src/types/voucher.ts` — VoucherEntry, Voucher, VoucherSet, SalaryPayableBalance
- `src/services/voucherGenerator.ts` — 5 pure voucher generation functions (139 lines)
- `src/utils/voucher-csv.ts` — CSV export with UTF-8 BOM + RFC 4180 (43 lines)
- `src/components/VoucherCard.tsx` — Presentational voucher card (70 lines)
- `src/pages/voucher/VoucherPage.tsx` — Overview page with company filter (182 lines)
- `tests/unit/services/voucherGenerator.test.ts` — 13 core tests
- `tests/unit/utils/voucher-csv.test.ts` — 5 CSV tests
- `tests/unit/components/p3.voucher-card.component.spec.tsx`
- `tests/unit/pages/voucher/p3.voucher-page.component.spec.tsx`
- `tests/unit/router/p3.voucher-route.unit.spec.tsx`
- `tests/e2e/voucher-flow.spec.ts` — 4 Playwright scenarios

### 5 Accounting Vouchers
1. 计提月工资 — Accrue monthly wages (13 entries, sale/manage split)
2. 缴纳社保 — Pay social insurance
3. 支付公积金 — Pay housing fund
4. 缴纳个税 — Pay income tax
5. 发放工资 — Disburse wages (with optional absence deduction)

### Acceptance Criteria Met
- ✅ A-04: 5 vouchers all balanced (|debit - credit| < 0.01)
- ✅ A-05: Company filter works correctly
- ✅ A-11: 应付职工薪酬-人员工资 balance = 0

## P1-P2 Summary (Complete)

- P1: Settings + Employee + Data management (83 tests, 4 E2E)
- P2: Payroll calculation + UI + detail table (47 tests, 4 E2E, 5 CRIT fixes)
- Code review fixes: 131 files changed, +5348/-2357

## Remaining Work

- **P4 Packaging & Acceptance:**
  - electron-builder config (.dmg + .exe)
  - App icon
  - i18n completion (~200 keys)
  - `npm run test:all` full regression
  - `10-acceptance.md` A-01~A-12, B-01~B-09 verification
- **Pending exports:** Payroll CSV, PDF payslips batch

## Evidence Artifacts

治理和报告目录：

- `../test/00-governance/`
- `../test/06-reports/raw/`
- `../test/06-reports/`

## Current Status Snapshot (2026-04-09)

- Branch: `main`
- Tag: `v2.1.2-p3-voucher`
- Tests: 155 unit PASS (P1: 83 + P2: 47 + P3: 25) + E2E ready
- Build: tsc + vite + tsc-electron all passing
- P3 voucher module COMPLETE
