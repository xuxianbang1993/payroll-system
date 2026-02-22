# P2.5 Codex Prompt: payroll-store.ts + Unit Test

**Generated:** 2026-02-22
**Model:** GPT-5.3-codex xhigh
**Status:** Ready to send to Codex
**Previous prompt:** 2026-02-21-p2.4-codex-prompt.md (archived, P2.4 complete)

---

## Task Overview

Implement the **state layer** that glues P2.1 (calculator), P2.2 (aggregator), and P2.4 (IPC bridge) together.

Create **exactly 2 new files** — no modification of existing files:

1. `src/stores/payroll-store.ts`
2. `tests/unit/stores/payroll-store.test.ts`

The store is responsible for:
- Loading employees + settings from repository
- Loading / saving payroll **inputs** (monthly variable data) via P2.4 IPC bridge
- Calling `calculatePaySlip` to generate individual `PaySlip` objects
- Calling `aggregatePaySlips` to compute totals
- Persisting results via P2.4 IPC bridge
- Managing month switching with reset + reload

---

## Pre-flight Checks

Before writing any code, verify these conditions hold:

1. `src/services/calculator.ts` exports:
   ```typescript
   export function calculatePaySlip(employee: Employee, input: PayrollInput, social: SocialConfig): PaySlip
   ```

2. `src/services/aggregator.ts` exports:
   ```typescript
   export function aggregatePaySlips(slips: PaySlip[], filterCompany?: string): AggregateResult
   ```

3. `src/lib/p1-repository.ts` exports all 7 payroll-related functions:
   - `listRepositoryEmployees()` — existing P1
   - `loadRepositorySettings()` — existing P1
   - `saveRepositoryPayrollInput(employeeId, month, payload)` — P2.4
   - `listRepositoryPayrollInputs(month)` — P2.4
   - `saveRepositoryPayrollResult(employeeId, month, payload)` — P2.4
   - `listRepositoryPayrollResults(month)` — P2.4
   - `deleteRepositoryPayrollByMonth(month)` — P2.4

4. `src/types/payroll.ts` exports: `Employee`, `PayrollInput`, `PaySlip`, `SocialConfig`, `AggregateResult`, `AggregateGroup`, `EmployeeType`

If any condition is not met, stop and report.

---

## File 1: `src/stores/payroll-store.ts`

### Pattern to Follow

Match `settings-store.ts` and `employee-store.ts` exactly:
- `create<State>()` from `zustand` — **no** `persist` middleware (payroll data is month-scoped, managed by IPC, not localStorage)
- `toErrorMessage()` from `@/utils/error` for all error handling
- All `errorMessage` / `noticeMessage` values are **i18n keys** — never hard-coded Chinese
- TypeScript strict: no `any`, all types explicit

### Imports

```typescript
import { create } from "zustand";

import { aggregatePaySlips } from "@/services/aggregator";
import { calculatePaySlip } from "@/services/calculator";
import {
  deleteRepositoryPayrollByMonth,
  listRepositoryEmployees,
  listRepositoryPayrollInputs,
  listRepositoryPayrollResults,
  loadRepositorySettings,
  saveRepositoryPayrollInput,
  saveRepositoryPayrollResult,
} from "@/lib/p1-repository";
import { toErrorMessage } from "@/utils/error";
import type {
  AggregateGroup,
  AggregateResult,
  Employee,
  PayrollInput,
  PaySlip,
  SocialConfig,
} from "@/types/payroll";
```

### State Interface

```typescript
interface PayrollStoreState {
  // Data
  selectedMonth: string;
  employees: Employee[];
  social: SocialConfig | null;
  inputs: Record<number, PayrollInput>;  // employeeId → saved input
  slips: Record<number, PaySlip>;        // employeeId → generated PaySlip
  aggregate: AggregateResult | null;     // null until at least one slip exists

  // Status
  loading: boolean;
  generating: boolean;
  errorMessage: string;
  noticeMessage: string;

  // Actions
  loadForMonth: (month: string) => Promise<void>;
  setMonth: (month: string) => Promise<void>;
  updateInput: (employeeId: number, input: PayrollInput) => Promise<boolean>;
  generateSlip: (employeeId: number) => Promise<boolean>;
  generateAll: () => Promise<void>;
  clearResults: (month: string) => Promise<boolean>;
  clearMessages: () => void;
  reset: () => void;
}
```

### Default Values

```typescript
const defaultMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

const DEFAULT_AGGREGATE_GROUP: AggregateGroup = {
  fullGrossPay: 0,
  cSocial: 0,
  cFund: 0,
  wSocial: 0,
  wFund: 0,
  tax: 0,
  netPay: 0,
  absentDeduct: 0,
};

export const DEFAULT_AGGREGATE: AggregateResult = {
  sale: { ...DEFAULT_AGGREGATE_GROUP },
  manage: { ...DEFAULT_AGGREGATE_GROUP },
  total: { ...DEFAULT_AGGREGATE_GROUP },
};

const INITIAL_STATE = {
  selectedMonth: defaultMonth,
  employees: [] as Employee[],
  social: null as SocialConfig | null,
  inputs: {} as Record<number, PayrollInput>,
  slips: {} as Record<number, PaySlip>,
  aggregate: null as AggregateResult | null,
  loading: false,
  generating: false,
  errorMessage: "",
  noticeMessage: "",
};
```

### Action Implementations

#### `loadForMonth(month: string)`

```typescript
loadForMonth: async (month) => {
  set({ loading: true, errorMessage: "", noticeMessage: "" });
  try {
    const [employees, settings, rawInputs, rawResults] = await Promise.all([
      listRepositoryEmployees(),
      loadRepositorySettings(),
      listRepositoryPayrollInputs(month),
      listRepositoryPayrollResults(month),
    ]);

    const inputs: Record<number, PayrollInput> = rawInputs.reduce<Record<number, PayrollInput>>(
      (acc, r) => ({ ...acc, [r.employeeId]: r.payload as PayrollInput }),
      {},
    );

    const slips: Record<number, PaySlip> = rawResults.reduce<Record<number, PaySlip>>(
      (acc, r) => ({ ...acc, [r.employeeId]: r.payload as PaySlip }),
      {},
    );

    const slipList = Object.values(slips);
    const aggregate = slipList.length > 0 ? aggregatePaySlips(slipList) : null;

    set({
      loading: false,
      selectedMonth: month,
      employees,
      social: settings?.social ?? null,
      inputs,
      slips,
      aggregate,
    });
  } catch (error) {
    set({ loading: false, errorMessage: `error.payrollLoadFailed|${toErrorMessage(error)}` });
  }
},
```

#### `setMonth(month: string)`

```typescript
setMonth: async (month) => {
  // Reset data fields immediately, then reload
  set({ ...INITIAL_STATE, selectedMonth: month });
  await get().loadForMonth(month);
},
```

#### `updateInput(employeeId: number, input: PayrollInput)`

```typescript
updateInput: async (employeeId, input) => {
  set({ generating: true, errorMessage: "", noticeMessage: "" });
  try {
    const result = await saveRepositoryPayrollInput(
      employeeId,
      get().selectedMonth,
      input as Record<string, unknown>,
    );
    if (!result) {
      set({ generating: false, errorMessage: "error.payrollInputSaveUnavailable" });
      return false;
    }
    set({
      inputs: { ...get().inputs, [employeeId]: input },
      generating: false,
      noticeMessage: "success.payrollInputSaved",
    });
    return true;
  } catch (error) {
    set({ generating: false, errorMessage: `error.payrollInputSaveFailed|${toErrorMessage(error)}` });
    return false;
  }
},
```

#### `generateSlip(employeeId: number)`

```typescript
generateSlip: async (employeeId) => {
  const employee = get().employees.find((e) => e.id === employeeId);
  if (!employee) {
    set({ errorMessage: "error.employeeNotFound" });
    return false;
  }
  const social = get().social;
  if (!social) {
    set({ errorMessage: "error.socialConfigNotLoaded" });
    return false;
  }

  set({ generating: true, errorMessage: "" });
  try {
    const input = get().inputs[employeeId] ?? {};
    const slip = calculatePaySlip(employee, input, social);

    const result = await saveRepositoryPayrollResult(
      employeeId,
      get().selectedMonth,
      slip as Record<string, unknown>,
    );
    if (!result) {
      set({ generating: false, errorMessage: "error.payrollResultSaveUnavailable" });
      return false;
    }

    const nextSlips = { ...get().slips, [employeeId]: slip };
    const slipList = Object.values(nextSlips);
    const aggregate = aggregatePaySlips(slipList);

    set({
      slips: nextSlips,
      aggregate,
      generating: false,
      noticeMessage: "success.payrollSlipGenerated",
    });
    return true;
  } catch (error) {
    set({ generating: false, errorMessage: `error.payrollGenerateFailed|${toErrorMessage(error)}` });
    return false;
  }
},
```

#### `generateAll()`

Use **sequential** loop (not `Promise.all`) to avoid Zustand `set()` race conditions:

```typescript
generateAll: async () => {
  set({ generating: true, errorMessage: "", noticeMessage: "" });
  try {
    for (const employee of get().employees) {
      await get().generateSlip(employee.id);
    }
    set({ generating: false, noticeMessage: "success.payrollAllGenerated" });
  } catch (error) {
    set({ generating: false, errorMessage: `error.payrollGenerateAllFailed|${toErrorMessage(error)}` });
  }
},
```

#### `clearResults(month: string)`

```typescript
clearResults: async (month) => {
  set({ generating: true, errorMessage: "", noticeMessage: "" });
  try {
    const result = await deleteRepositoryPayrollByMonth(month);
    if (!result) {
      set({ generating: false, errorMessage: "error.payrollClearUnavailable" });
      return false;
    }
    set({
      slips: {},
      aggregate: null,
      generating: false,
      noticeMessage: "success.payrollResultsCleared",
    });
    return true;
  } catch (error) {
    set({ generating: false, errorMessage: `error.payrollClearFailed|${toErrorMessage(error)}` });
    return false;
  }
},
```

#### `clearMessages()` and `reset()`

```typescript
clearMessages: () => {
  set({ errorMessage: "", noticeMessage: "" });
},

reset: () => {
  set({ ...INITIAL_STATE });
},
```

### Export

```typescript
export const usePayrollStore = create<PayrollStoreState>((set, get) => ({
  ...INITIAL_STATE,
  loadForMonth: async (month) => { /* ... */ },
  setMonth: async (month) => { /* ... */ },
  updateInput: async (employeeId, input) => { /* ... */ },
  generateSlip: async (employeeId) => { /* ... */ },
  generateAll: async () => { /* ... */ },
  clearResults: async (month) => { /* ... */ },
  clearMessages: () => { /* ... */ },
  reset: () => { /* ... */ },
}));
```

---

## File 2: `tests/unit/stores/payroll-store.test.ts`

### Test File Location

`tests/unit/stores/payroll-store.test.ts` — matches the locked test layout (`tests/unit/**/*.{test,spec}.{ts,tsx}`).

### Mock Setup

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/p1-repository", () => ({
  listRepositoryEmployees: vi.fn(),
  loadRepositorySettings: vi.fn(),
  listRepositoryPayrollInputs: vi.fn(),
  listRepositoryPayrollResults: vi.fn(),
  saveRepositoryPayrollInput: vi.fn(),
  saveRepositoryPayrollResult: vi.fn(),
  deleteRepositoryPayrollByMonth: vi.fn(),
}));

vi.mock("@/services/calculator", () => ({
  calculatePaySlip: vi.fn(),
}));

vi.mock("@/services/aggregator", () => ({
  aggregatePaySlips: vi.fn(),
}));

import * as repo from "@/lib/p1-repository";
import { calculatePaySlip } from "@/services/calculator";
import { aggregatePaySlips } from "@/services/aggregator";
import { usePayrollStore } from "@/stores/payroll-store";
```

### Fixtures (4-employee, per SOP 4.10)

```typescript
import type { Employee, SocialConfig, PayrollInput, PaySlip } from "@/types/payroll";

const EMPLOYEES: Employee[] = [
  { id: 1, name: "张三", idCard: "110101199001011001", companyShort: "AC", company: "AC公司",
    dept: "销售部", position: "销售员", type: "sales", baseSalary: 5000, subsidy: 500,
    hasSocial: true, hasLocalPension: false, fundAmount: 1000 },
  { id: 2, name: "李四", idCard: "110101199002022002", companyShort: "AC", company: "AC公司",
    dept: "销售部", position: "销售主管", type: "sales", baseSalary: 6000, subsidy: 0,
    hasSocial: false, hasLocalPension: false, fundAmount: 0 },
  { id: 3, name: "王五", idCard: "110101199003033003", companyShort: "BC", company: "BC公司",
    dept: "管理部", position: "经理", type: "management", baseSalary: 8000, subsidy: 1000,
    hasSocial: true, hasLocalPension: true, fundAmount: 2000 },
  { id: 4, name: "赵六", idCard: "110101199004044004", companyShort: "BC", company: "BC公司",
    dept: "管理部", position: "助理", type: "management", baseSalary: 4000, subsidy: 0,
    hasSocial: true, hasLocalPension: false, fundAmount: 500 },
];

const SOCIAL: SocialConfig = {
  compPension: 16, compLocalPension: 1, compUnemploy: 0.5, compMedical: 8,
  compInjury: 0.3, compMaternity: 0.8, workerPension: 8, workerUnemploy: 0.5,
  workerMedical: 2, pensionBase: 5000, unemploymentBase: 5000,
  medicalBase: 5000, injuryBase: 5000, maternityBase: 5000,
};

const MONTH = "2026-02";

const MOCK_SLIP: PaySlip = {
  base: 5500, perfSalary: 0, commission: 0, bonus: 0, totalPerf: 0, otherAdj: 0,
  fullGrossPay: 5500, absentH: 0, absentDeduct: 0, grossPay: 5500,
  cPension: 800, cLocalPension: 0, cUnemploy: 25, cMedical: 400, cInjury: 15,
  cMaternity: 40, cSocial: 1280, cFund: 1000, cTotal: 2280,
  wPension: 400, wUnemploy: 25, wMedical: 100, wSocial: 525, wFund: 1000,
  tax: 0, totalDeduct: 1525, netPay: 3975, hourlyRate: 31.61,
  perfGrade: "", type: "sales", companyShort: "AC",
};
```

### Test Cases (minimum 10 cases)

```typescript
describe("usePayrollStore", () => {
  beforeEach(() => {
    usePayrollStore.setState(/* reset to initial state */);
    vi.clearAllMocks();
  });

  describe("loadForMonth", () => {
    it("loads employees, social, inputs, and results for the given month", async () => {
      // Mock all 4 Promise.all calls
      // Verify state after loadForMonth(MONTH)
      // Check: employees, social, inputs keyed by employeeId, slips keyed by employeeId
    });

    it("sets aggregate to null when no results exist for the month", async () => {
      // rawResults = []
      // aggregate should be null after load
    });

    it("computes aggregate when results are present", async () => {
      // rawResults has 1 result, aggregatePaySlips should be called
    });

    it("sets errorMessage with toErrorMessage pattern when repository throws", async () => {
      // listRepositoryEmployees throws new Error("DB error")
      // errorMessage should be "error.payrollLoadFailed|DB error"
    });
  });

  describe("setMonth", () => {
    it("resets state and reloads for the new month", async () => {
      // Pre-populate state with old month data
      // Call setMonth("2026-03")
      // Verify loadForMonth called with "2026-03"
      // Verify old data cleared
    });
  });

  describe("updateInput", () => {
    it("saves input via IPC and updates inputs state", async () => {
      // Mock saveRepositoryPayrollInput to return a RepositoryPayrollPayload
      // Call updateInput(1, { perfSalary: 1000 })
      // Verify inputs[1] updated, noticeMessage set
    });

    it("sets error when repository returns null", async () => {
      // saveRepositoryPayrollInput returns null
      // errorMessage should be "error.payrollInputSaveUnavailable"
    });
  });

  describe("generateSlip", () => {
    it("calls calculatePaySlip with employee, input, and social; saves and updates state", async () => {
      // Load employees + social into state
      // Mock calculatePaySlip to return MOCK_SLIP
      // Mock saveRepositoryPayrollResult to return payload
      // Call generateSlip(1)
      // Verify: slips[1] === MOCK_SLIP, aggregatePaySlips called, noticeMessage set
    });

    it("returns false and sets error when employee not found", async () => {
      // Call generateSlip(999) with empty employees state
      // errorMessage should be "error.employeeNotFound"
    });

    it("returns false and sets error when social config not loaded", async () => {
      // employees present, social === null
      // errorMessage should be "error.socialConfigNotLoaded"
    });
  });

  describe("generateAll", () => {
    it("calls generateSlip for each employee sequentially", async () => {
      // employees = [emp1, emp2]
      // Spy on generateSlip
      // Call generateAll()
      // Verify generateSlip called twice, noticeMessage "success.payrollAllGenerated"
    });
  });

  describe("clearResults", () => {
    it("calls deleteRepositoryPayrollByMonth and resets slips and aggregate", async () => {
      // Pre-populate slips state
      // Mock deleteRepositoryPayrollByMonth to return { deletedInputs: 4, deletedResults: 4 }
      // Call clearResults(MONTH)
      // Verify slips = {}, aggregate = null, noticeMessage set
    });
  });
});
```

---

## TypeScript Requirements

- **No `any` type.** Use explicit casts at IPC boundaries only:
  - `r.payload as PayrollInput` (input deserialization from `Record<string, unknown>`)
  - `r.payload as PaySlip` (result deserialization from `Record<string, unknown>`)
  - `slip as Record<string, unknown>` (serialization before IPC save)
  - `input as Record<string, unknown>` (serialization before IPC save)
- Use `get().social!` only after null-guard check
- All function parameters and return types must be explicit
- `Record<number, PayrollInput>` and `Record<number, PaySlip>` for indexed state (not arrays)

## i18n Key Conventions

**Error keys** (follow `error.payroll*` namespace):
- `"error.payrollLoadFailed|<detail>"` — load failure with detail
- `"error.payrollInputSaveUnavailable"` — repository null return on input save
- `"error.payrollInputSaveFailed|<detail>"` — input save exception
- `"error.payrollResultSaveUnavailable"` — repository null return on result save
- `"error.payrollGenerateFailed|<detail>"` — generateSlip exception
- `"error.payrollGenerateAllFailed|<detail>"` — generateAll exception
- `"error.payrollClearUnavailable"` — repository null return on delete
- `"error.payrollClearFailed|<detail>"` — clearResults exception
- `"error.socialConfigNotLoaded"` — social is null when generateSlip called
- `"error.employeeNotFound"` — employeeId not in state

**Notice keys:**
- `"success.payrollInputSaved"` — updateInput succeeded
- `"success.payrollSlipGenerated"` — single generateSlip succeeded
- `"success.payrollAllGenerated"` — generateAll completed
- `"success.payrollResultsCleared"` — clearResults succeeded

> You do **NOT** need to add these keys to i18n locale JSON files. That is out of scope for P2.5.

---

## Verification

```bash
npm run test -- tests/unit/stores/payroll-store.test.ts
```

Then run full regression:

```bash
npm run test
```

**Success criteria:**
1. All payroll-store tests pass
2. Full test suite passes (113+ tests, no regressions)

---

## Delivery Checklist

- [ ] `src/stores/payroll-store.ts` — all 8 actions implemented, no `any`, i18n keys, no hard-coded Chinese
- [ ] `src/stores/payroll-store.ts` — `usePayrollStore` exported, `DEFAULT_AGGREGATE` exported (needed by P2.7)
- [ ] `tests/unit/stores/payroll-store.test.ts` — min 10 test cases, all mocks correct, 4-employee fixtures
- [ ] No existing files modified
- [ ] `npm run test -- tests/unit/stores/payroll-store.test.ts` passes
- [ ] `npm run test` full regression passes

---

## Next Steps After P2.5 Completion

1. Claude Code CLI reviews (Sonnet 4.6 / Opus 4.6 depending on complexity found)
2. Merge to main, tag `v2.1.2-p2-p2.5`
3. Start P2.6: `MonthPicker.tsx` + `PayCard.tsx` (UI components)

**Reference docs:**
- `plans/P2阶段开发总纲.md` — P2 overall architecture and P2.5 definition
- `China/Devolop files SOP/05-mod-payroll.md` — Payroll UI + calculation rules
- `China/Devolop files SOP/薪酬系统-开发策略文档.md` — Development standards v3.6
