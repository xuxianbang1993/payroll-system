import { create } from "zustand";

import {
  listRepositoryEmployees,
  loadRepositorySettings,
  replaceRepositoryEmployees,
} from "@/lib/p1-repository";
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

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function normalizeEmployees(employees: Employee[]): Employee[] {
  return [...employees].sort((left, right) => left.id - right.id);
}

function nextEmployeeId(employees: Employee[]): number {
  if (employees.length === 0) {
    return 1;
  }

  const maxId = employees.reduce((max, employee) => Math.max(max, employee.id), 0);
  return maxId + 1;
}

function toCompanyFullName(companyShort: string, company: string): string {
  const full = company.trim();
  if (full !== "") {
    return full;
  }

  return companyShort.trim();
}

function validateNumeric(value: number, label: string): string | null {
  if (!Number.isFinite(value) || value < 0) {
    return `${label} 必须是大于等于 0 的数字`;
  }

  return null;
}

function sanitizeEmployeeInput(input: EmployeeFormModel): { employee: EmployeeFormModel | null; errorMessage: string } {
  const name = input.name.trim();
  if (name === "") {
    return {
      employee: null,
      errorMessage: "姓名不能为空",
    };
  }

  const baseError = validateNumeric(input.baseSalary, "基本工资");
  if (baseError) {
    return {
      employee: null,
      errorMessage: baseError,
    };
  }

  const subsidyError = validateNumeric(input.subsidy, "补助");
  if (subsidyError) {
    return {
      employee: null,
      errorMessage: subsidyError,
    };
  }

  const fundAmountError = validateNumeric(input.fundAmount, "公积金金额");
  if (fundAmountError) {
    return {
      employee: null,
      errorMessage: fundAmountError,
    };
  }

  return {
    employee: {
      ...input,
      name,
      idCard: input.idCard.trim(),
      companyShort: input.companyShort.trim(),
      company: toCompanyFullName(input.companyShort, input.company),
      dept: input.dept.trim(),
      position: input.position.trim(),
      type: input.type === "销售" ? "销售" : "管理",
      hasLocalPension: input.hasSocial ? input.hasLocalPension : false,
    },
    errorMessage: "",
  };
}

function toEmployeeRecord(model: EmployeeFormModel, id: number): Employee {
  return {
    id,
    name: model.name,
    idCard: model.idCard,
    companyShort: model.companyShort,
    company: model.company,
    dept: model.dept,
    position: model.position,
    type: model.type,
    baseSalary: model.baseSalary,
    subsidy: model.subsidy,
    hasSocial: model.hasSocial,
    hasLocalPension: model.hasLocalPension,
    fundAmount: model.fundAmount,
  };
}

export const useEmployeeStore = create<EmployeeStoreState>((set, get) => {
  const persistEmployees = async (
    nextEmployees: Employee[],
    noticeMessage: string,
  ): Promise<boolean> => {
    set({ saving: true, errorMessage: "", noticeMessage: "" });

    try {
      const result = await replaceRepositoryEmployees(nextEmployees);
      if (!result) {
        set({
          saving: false,
          errorMessage: "保存员工失败：仓储接口不可用",
        });
        return false;
      }

      set({
        employees: normalizeEmployees(nextEmployees),
        saving: false,
        noticeMessage,
      });
      return true;
    } catch (error) {
      set({
        saving: false,
        errorMessage: `保存员工失败：${toErrorMessage(error)}`,
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
          errorMessage: `加载员工失败：${toErrorMessage(error)}`,
        });
      }
    },
    addEmployee: async (input: EmployeeFormModel) => {
      const normalized = sanitizeEmployeeInput(input);
      const model = normalized.employee;
      if (!model) {
        set({ errorMessage: normalized.errorMessage });
        return false;
      }

      const nextId = nextEmployeeId(get().employees);
      const nextEmployees = [...get().employees, toEmployeeRecord(model, nextId)];
      return persistEmployees(nextEmployees, "员工已新增");
    },
    updateEmployee: async (id: number, input: EmployeeFormModel) => {
      const normalized = sanitizeEmployeeInput(input);
      const model = normalized.employee;
      if (!model) {
        set({ errorMessage: normalized.errorMessage });
        return false;
      }

      const exists = get().employees.some((employee) => employee.id === id);
      if (!exists) {
        set({ errorMessage: "未找到要编辑的员工" });
        return false;
      }

      const nextEmployees = get().employees.map((employee) =>
        employee.id === id ? toEmployeeRecord(model, id) : employee,
      );

      return persistEmployees(nextEmployees, "员工已更新");
    },
    removeEmployee: async (id: number) => {
      const nextEmployees = get().employees.filter((employee) => employee.id !== id);
      if (nextEmployees.length === get().employees.length) {
        set({ errorMessage: "未找到要删除的员工" });
        return false;
      }

      return persistEmployees(nextEmployees, "员工已删除");
    },
    replaceAll: async (nextEmployees: Employee[], noticeMessage = "员工列表已更新") => {
      return persistEmployees(normalizeEmployees(nextEmployees), noticeMessage);
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
