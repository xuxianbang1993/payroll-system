# Checkpoint: 2026-04-09

## Project State Summary

| Item | Value |
|------|-------|
| **Branch** | `main` |
| **Latest Tag** | `P2.1.2-P2` |
| **Latest Commit** | `8a1169d` — docs: Enforce AI model tiering rules in CLAUDE.md |
| **Tests** | 130/130 PASS (P1: 83 + P2.1: 13 + P2.2: 7 + P2.3: 10 + P2.5: 17) |
| **Build** | tsc + vite + tsc-electron all passing |

---

## Phase Progress

| Phase | Status | Description |
|-------|--------|-------------|
| P0 | Done | Framework + design system + test infra |
| P1 | Done | Settings + Employee + Data management (83 tests) |
| P2 | Done | Payroll module complete (47 tests added, 130/130 total) |
| **P3** | **Next** | Voucher module (voucherGenerator + VoucherPage + E2E) |
| P4 | Pending | Packaging (.dmg/.exe) + full acceptance |

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

---

## P3 Scope (Next Up)

Per `06-mod-voucher.md`, deliverables:

### Core Files
- `src/services/voucherGenerator.ts` — 5 accounting vouchers generation
- `tests/unit/services/voucherGenerator.test.ts`
- `src/pages/voucher/VoucherPage.tsx`
- `src/components/VoucherCard.tsx`
- `tests/e2e/voucher-flow.spec.ts`

### 5 Vouchers
1. Voucher 1: Accrue monthly wages (计提月工资)
2. Voucher 2: Pay social insurance (缴纳社保)
3. Voucher 3: Pay housing fund (支付公积金)
4. Voucher 4: Pay income tax (缴纳个税)
5. Voucher 5: Disburse wages (发放工资)

### Acceptance Criteria (from 10-acceptance.md)
- A-04: 5 vouchers all balanced (debit = credit)
- A-05: Filter by company entity works correctly
- A-11: After all 5 vouchers, "应付职工薪酬-人员工资" balance = 0

### Dependencies
- `aggregator.ts` already completed in P2.2 (can be reused directly)
- Payroll store and data layer stable

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
| 06-mod-voucher.md | Voucher module | Next (P3) |
| 07-import-export.md | Import/Export | Partial (employee done, payroll/voucher pending) |
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
    voucher/               — VoucherPage (P3 — placeholder)
  components/
    MonthPicker.tsx        — year-month selector (P2.6)
    PayCard.tsx            — collapsible employee paycard (P2.6)
    ui/                    — shadcn/ui base components
  lib/
    decimal.ts             — decimal.js wrapper
    p1-repository.ts       — renderer repository bridge
    electron-store.ts      — electron-store wrapper
    employee-import-*.ts   — import parse + merge
  types/
    payroll.ts             — PaySlip / PayrollInput types
    electron-api.d.ts      — IPC type definitions
  i18n/                    — zh-HK / zh-CN / en
  utils/                   — format, error, type-guards, etc.
```

---

## AI Model Tiering Rules (Enforced)

| Task | Tool / Agent |
|------|-------------|
| Code development | Codex (`mcp__codex-cli__codex`, gpt-5.3-codex, xhigh) |
| Code review | `subagent_type: "code-reviewer"` (Sonnet) |
| Architecture | `subagent_type: "architect"` (Opus) |
| Doc validation | `subagent_type: "doc-validator"` (Haiku) |
| Quality check | `subagent_type: "quality-checker"` (Haiku) |
| Claude direct | Small fixes (<=10 lines), Git, docs, i18n, config only |

---

## Environment Changes (This Session)

### Installed: Claude Code Bridge (ccb) v5.2.9
- **Global install**: `~/.local/share/codex-dual/` + `~/.local/bin/`
- **tmux 3.6a** installed via brew (ccb dependency)
- **Skills added**: `/ask`, `/pend`, `/cping`, `/all-plan`, `/mounted`, `/review`, etc.
- **CLAUDE.md modified**: ccb appended AI collaboration rules (Async Guardrail, Role Assignment, Peer Review Framework)
- **Note**: ccb installer removed `codex-cli` MCP config from project `.mcp.json` — may need manual restore if Codex MCP workflow is required

### CCB Role Assignments (from CLAUDE.md)
| Role | Provider | Description |
|------|----------|-------------|
| designer | claude | Primary planner and architect |
| inspiration | gemini | Creative brainstorming (unreliable, reference only) |
| reviewer | codex | Scored quality gate |
| executor | claude | Code implementation |

---

## Remaining Work (P3 → P4)

### P3: Voucher Module
1. `voucherGenerator.ts` + unit tests
2. `VoucherCard.tsx` component
3. `VoucherPage.tsx` + company filter
4. Voucher CSV export
5. `voucher-flow.spec.ts` E2E
6. Balance verification (应付职工薪酬 = 0)
7. Milestone evidence (raw JSON + case map + XLSX)

### P4: Packaging & Acceptance
1. electron-builder config (.dmg + .exe)
2. App icon
3. i18n completion (~200 keys)
4. `npm run test:all` full regression
5. `10-acceptance.md` A-01~A-12, B-01~B-09 full verification

### Pending Export Features (across P2-P3)
- Payroll CSV export (P2)
- PDF payslips batch export (P2)
- Voucher CSV export (P3)
