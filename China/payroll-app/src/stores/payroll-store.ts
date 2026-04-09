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

interface PayrollStoreState {
  selectedMonth: string;
  employees: Employee[];
  social: SocialConfig | null;
  inputs: Record<number, PayrollInput>;
  slips: Record<number, PaySlip>;
  aggregate: AggregateResult | null;
  loading: boolean;
  generating: boolean;
  errorMessage: string;
  noticeMessage: string;
  loadForMonth: (month: string) => Promise<void>;
  setMonth: (month: string) => Promise<void>;
  updateInput: (employeeId: number, input: PayrollInput) => Promise<boolean>;
  generateSlip: (employeeId: number) => Promise<boolean>;
  generateAll: () => Promise<void>;
  clearResults: (month: string) => Promise<boolean>;
  clearMessages: () => void;
  reset: () => void;
}

const now = new Date();
const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

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

type PayrollSet = (
  partial:
    | Partial<PayrollStoreState>
    | ((state: PayrollStoreState) => Partial<PayrollStoreState>),
) => void;
type PayrollGet = () => PayrollStoreState;

async function _computeAndSaveSlip(
  employeeId: number,
  set: PayrollSet,
  get: PayrollGet,
): Promise<boolean> {
  const employee = get().employees.find((item) => item.id === employeeId);
  if (!employee) {
    set({ errorMessage: "error.employeeNotFound" });
    return false;
  }

  const social = get().social;
  if (!social) {
    set({ errorMessage: "error.socialConfigNotLoaded" });
    return false;
  }

  try {
    const input = get().inputs[employeeId] ?? {};
    const slip = calculatePaySlip(employee, input, social);

    const result = await saveRepositoryPayrollResult(
      employeeId,
      get().selectedMonth,
      slip as unknown as Record<string, unknown>,
    );

    if (result === null) {
      set({ errorMessage: "error.payrollResultSaveUnavailable" });
      return false;
    }

    set((state) => {
      const nextSlips = {
        ...state.slips,
        [employeeId]: slip,
      };

      return {
        slips: nextSlips,
        aggregate: aggregatePaySlips(Object.values(nextSlips)),
      };
    });
    return true;
  } catch (error) {
    set({
      errorMessage: `error.payrollGenerateFailed|${toErrorMessage(error)}`,
    });
    return false;
  }
}

export const usePayrollStore = create<PayrollStoreState>((set, get) => ({
  ...INITIAL_STATE,
  loadForMonth: async (month: string) => {
    set({ loading: true, errorMessage: "", noticeMessage: "" });

    try {
      const [employees, settings, rawInputs, rawResults] = await Promise.all([
        listRepositoryEmployees(),
        loadRepositorySettings(),
        listRepositoryPayrollInputs(month),
        listRepositoryPayrollResults(month),
      ]);

      const inputs = rawInputs.reduce<Record<number, PayrollInput>>((acc, r) => {
        acc[r.employeeId] = r.payload as PayrollInput;
        return acc;
      }, {});

      const slips = rawResults.reduce<Record<number, PaySlip>>((acc, r) => {
        acc[r.employeeId] = r.payload as unknown as PaySlip;
        return acc;
      }, {});

      const slipList = Object.values(slips);
      const aggregate = slipList.length > 0 ? aggregatePaySlips(slipList) : null;

      set({
        selectedMonth: month,
        employees,
        social: settings?.social ?? null,
        inputs,
        slips,
        aggregate,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        errorMessage: `error.payrollLoadFailed|${toErrorMessage(error)}`,
      });
    }
  },
  setMonth: async (month: string) => {
    set({ ...INITIAL_STATE, selectedMonth: month });
    await get().loadForMonth(month);
  },
  updateInput: async (employeeId: number, input: PayrollInput) => {
    set({ generating: true, errorMessage: "", noticeMessage: "" });

    try {
      const result = await saveRepositoryPayrollInput(
        employeeId,
        get().selectedMonth,
        input as unknown as Record<string, unknown>,
      );

      if (result === null) {
        set({ generating: false, errorMessage: "error.payrollInputSaveUnavailable" });
        return false;
      }

      set((state) => ({
        inputs: {
          ...state.inputs,
          [employeeId]: input,
        },
        generating: false,
        noticeMessage: "success.payrollInputSaved",
      }));
      return true;
    } catch (error) {
      set({
        generating: false,
        errorMessage: `error.payrollInputSaveFailed|${toErrorMessage(error)}`,
      });
      return false;
    }
  },
  generateSlip: async (employeeId: number) => {
    set({ generating: true, errorMessage: "", noticeMessage: "" });

    const ok = await _computeAndSaveSlip(employeeId, set, get);

    if (ok) {
      set({ generating: false, noticeMessage: "success.payrollSlipGenerated" });
    } else {
      set({ generating: false });
    }
    return ok;
  },
  generateAll: async () => {
    set({ generating: true, errorMessage: "", noticeMessage: "" });

    try {
      const failures: number[] = [];
      for (const employee of get().employees) {
        const ok = await _computeAndSaveSlip(employee.id, set, get);
        if (!ok) {
          failures.push(employee.id);
        }
      }

      if (failures.length > 0) {
        set({
          generating: false,
          errorMessage: `error.payrollGenerateAllFailed|${failures.length} employee(s) failed`,
        });
      } else {
        set({
          generating: false,
          noticeMessage: "success.payrollAllGenerated",
        });
      }
    } catch (error) {
      set({
        generating: false,
        errorMessage: `error.payrollGenerateAllFailed|${toErrorMessage(error)}`,
      });
    }
  },
  clearResults: async (month: string) => {
    set({ generating: true, errorMessage: "", noticeMessage: "" });

    try {
      const result = await deleteRepositoryPayrollByMonth(month);

      if (result === null) {
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
      set({
        generating: false,
        errorMessage: `error.payrollClearFailed|${toErrorMessage(error)}`,
      });
      return false;
    }
  },
  clearMessages: () => {
    set({ errorMessage: "", noticeMessage: "" });
  },
  reset: () => {
    set({ ...INITIAL_STATE });
  },
}));
