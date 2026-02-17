import { create } from "zustand";

import {
  addRepositoryEmployee,
  deleteRepositoryEmployee,
  listRepositoryEmployees,
  loadRepositorySettings,
  replaceRepositoryEmployees,
  updateRepositoryEmployee,
} from "@/lib/p1-repository";
import { toErrorMessage } from "@/utils/error";
import {
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

      set({ saving: true, errorMessage: "", noticeMessage: "" });
      try {
        const record = toEmployeeRecord(model, 0);
        const { id: _id, ...withoutId } = record;
        const created = await addRepositoryEmployee(withoutId);
        if (!created) {
          set({ saving: false, errorMessage: "error.employeeSaveRepositoryUnavailable" });
          return false;
        }
        set({
          employees: normalizeEmployees([...get().employees, created]),
          saving: false,
          noticeMessage: "success.employeeAdded",
        });
        return true;
      } catch (error) {
        set({ saving: false, errorMessage: `error.employeeSaveFailed|${toErrorMessage(error)}` });
        return false;
      }
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

      set({ saving: true, errorMessage: "", noticeMessage: "" });
      try {
        const record = toEmployeeRecord(model, id);
        const updated = await updateRepositoryEmployee(record);
        if (!updated) {
          set({ saving: false, errorMessage: "error.employeeSaveRepositoryUnavailable" });
          return false;
        }
        set({
          employees: normalizeEmployees(
            get().employees.map((e) => (e.id === id ? updated : e)),
          ),
          saving: false,
          noticeMessage: "success.employeeUpdated",
        });
        return true;
      } catch (error) {
        set({ saving: false, errorMessage: `error.employeeSaveFailed|${toErrorMessage(error)}` });
        return false;
      }
    },
    removeEmployee: async (id: number) => {
      const exists = get().employees.some((employee) => employee.id === id);
      if (!exists) {
        set({ errorMessage: "error.employeeNotFound" });
        return false;
      }

      set({ saving: true, errorMessage: "", noticeMessage: "" });
      try {
        const result = await deleteRepositoryEmployee(id);
        if (!result) {
          set({ saving: false, errorMessage: "error.employeeSaveRepositoryUnavailable" });
          return false;
        }
        set({
          employees: get().employees.filter((e) => e.id !== id),
          saving: false,
          noticeMessage: "success.employeeDeleted",
        });
        return true;
      } catch (error) {
        set({ saving: false, errorMessage: `error.employeeSaveFailed|${toErrorMessage(error)}` });
        return false;
      }
    },
    replaceAll: async (nextEmployees: Employee[], noticeKey = "success.employeeListUpdated") => {
      set({ saving: true, errorMessage: "", noticeMessage: "" });
      try {
        const result = await replaceRepositoryEmployees(normalizeEmployees(nextEmployees));
        if (!result) {
          set({ saving: false, errorMessage: "error.employeeSaveRepositoryUnavailable" });
          return false;
        }
        set({
          employees: normalizeEmployees(nextEmployees),
          saving: false,
          noticeMessage: noticeKey,
        });
        return true;
      } catch (error) {
        set({ saving: false, errorMessage: `error.employeeSaveFailed|${toErrorMessage(error)}` });
        return false;
      }
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
