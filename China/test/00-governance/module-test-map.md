# Module to Test Path Map

This file is the source of truth for requirement-to-test mapping.

## P0 Foundation

- Layout shell / top nav / menu panel
  - `02-component/p0-layout-navigation`
  - `03-e2e/p0-smoke`
- i18n initialization and language switch persistence
  - `01-unit/p0-foundation/i18n`
  - `02-component/p0-layout-navigation`
- Zustand + electron-store（UI 轻配置）+ SQLite（主数据）桥接
  - `01-unit/p0-foundation/store`
  - `01-unit/p0-foundation/electron-bridge`

## P1 Settings + Employee + Data

- Settings
  - Unit: `01-unit/p1-settings`
  - Component: `02-component/p1-settings-forms`
  - E2E: `03-e2e/p1-settings-employee-data`
- Employee
  - Unit: `01-unit/p1-employee`
  - Component: `02-component/p1-employee-crud`
  - E2E: `03-e2e/p1-settings-employee-data`
- Data management / backup restore / migration
  - Unit: `01-unit/p1-data-management`
  - E2E: `03-e2e/p1-settings-employee-data`
- Repository abstraction / source switching / backup compatibility
  - Unit: `01-unit/p1-data-management`
  - Evidence Specs:
    - `src/lib/p1.repository-switching.unit.spec.ts`
    - `src/lib/p1.repository-migration-0002.unit.spec.ts`
    - `src/lib/p1.repository-bridge.unit.spec.ts`
    - `tests/e2e/db-isolation.spec.ts`

## P2 Payroll

- Calculation engine and aggregator
  - Unit: `01-unit/p2-payroll-calculation`
  - Component: `02-component/p2-payroll-cards-table`
  - E2E: `03-e2e/p2-payroll-flow`

## P3 Voucher

- Voucher generator / balancing
  - Unit: `01-unit/p3-voucher-engine`
  - Component: `02-component/p3-voucher-cards-filters`
  - E2E: `03-e2e/p3-voucher-flow`

## P4 Release and Acceptance

- Packaging guards / release scripts
  - Unit: `01-unit/p4-packaging-guards`
- End-to-end acceptance
  - E2E: `03-e2e/p4-release-acceptance`
  - Manual: `07-manual-checklists/acceptance`
