import { create } from "zustand";

import {
  listRepositoryEmployees,
  loadRepositorySettings,
  replaceRepositoryEmployees,
} from "@/lib/p1-repository";
import { toErrorMessage } from "@/utils/error";
import {
  nextEmployeeId,
  normalizeEmployeeType,
  sanitizeEmployeeInput,
  toEmployeeRecord,
} from "@/utils/employee-utils";
import type { Company, Employee, EmployeeFormModel } from "@/types/payroll";

interface EmployeeStoreState {
  employees: Employee[];
  companyOptions: Company[];
  loading: boolean;
  saving: boolean;
  errorMessage: string;
  noticeMessage: string;
  load: () => Promise<void>;
  addEmployee: (input: EmployeeFormModel) => Promise<boolean>;
  updateEmployee: (id: number, input: EmployeeFormModel) => Promise<boolean>;
  removeEmployee: (id: number) => Promise<boolean>;
  replaceAll: (nextEmployees: Employee[], noticeMessage?: string) => Promise<boolean>;
  clearMessages: () => void;
  reset: () => void;
}

function normalizeEmployees(employees: Employee[]): Employee[] {
  return [...employees]
    .map((employee) => ({
      ...employee,
      type: normalizeEmployeeType(employee.type),
    }))
    .sort((left, right) => left.id - right.id);
}

export const useEmployeeStore = create<EmployeeStoreState>((set, get) => {
  const persistEmployees = async (
    nextEmployees: Employee[],
    noticeKey: string,
  ): Promise<boolean> => {
    set({ saving: true, errorMessage: "", noticeMessage: "" });

    try {
      const result = await replaceRepositoryEmployees(nextEmployees);
      if (!result) {
        set({
          saving: false,
          errorMessage: "error.employeeSaveRepositoryUnavailable",
        });
        return false;
      }

      set({
        employees: normalizeEmployees(nextEmployees),
        saving: false,
        noticeMessage: noticeKey,
      });
      return true;
    } catch (error) {
      set({
        saving: false,
        errorMessage: `error.employeeSaveFailed|${toErrorMessage(error)}`,
      });
      return false;
    }
  };

  return {
    employees: [],
    companyOptions: [],
    loading: false,
    saving: false,
    errorMessage: "",
    noticeMessage: "",
    load: async () => {
      set({ loading: true, errorMessage: "", noticeMessage: "" });

      try {
        const [employees, settings] = await Promise.all([
          listRepositoryEmployees(),
          loadRepositorySettings(),
        ]);

        set({
          employees: normalizeEmployees(employees),
          companyOptions: settings?.companies ?? [],
          loading: false,
        });
      } catch (error) {
        set({
          loading: false,
          errorMessage: `error.employeeLoadFailed|${toErrorMessage(error)}`,
        });
      }
    },
    addEmployee: async (input: EmployeeFormModel) => {
      const normalized = sanitizeEmployeeInput(input);
      const model = normalized.employee;
      if (!model) {
        set({ errorMessage: normalized.errorKey });
        return false;
      }

      const nextId = nextEmployeeId(get().employees);
      const nextEmployees = [...get().employees, toEmployeeRecord(model, nextId)];
      return persistEmployees(nextEmployees, "success.employeeAdded");
    },
    updateEmployee: async (id: number, input: EmployeeFormModel) => {
      const normalized = sanitizeEmployeeInput(input);
      const model = normalized.employee;
      if (!model) {
        set({ errorMessage: normalized.errorKey });
        return false;
      }

      const exists = get().employees.some((employee) => employee.id === id);
      if (!exists) {
        set({ errorMessage: "error.employeeNotFound" });
        return false;
      }

      const nextEmployees = get().employees.map((employee) =>
        employee.id === id ? toEmployeeRecord(model, id) : employee,
      );

      return persistEmployees(nextEmployees, "success.employeeUpdated");
    },
    removeEmployee: async (id: number) => {
      const nextEmployees = get().employees.filter((employee) => employee.id !== id);
      if (nextEmployees.length === get().employees.length) {
        set({ errorMessage: "error.employeeNotFound" });
        return false;
      }

      return persistEmployees(nextEmployees, "success.employeeDeleted");
    },
    replaceAll: async (nextEmployees: Employee[], noticeKey = "success.employeeListUpdated") => {
      return persistEmployees(normalizeEmployees(nextEmployees), noticeKey);
    },
    clearMessages: () => {
      set({ errorMessage: "", noticeMessage: "" });
    },
    reset: () => {
      set({
        employees: [],
        companyOptions: [],
        loading: false,
        saving: false,
        errorMessage: "",
        noticeMessage: "",
      });
    },
  };
});
