import { create } from "zustand";

import {
  listRepositoryEmployees,
  loadRepositorySettings,
  saveRepositorySettings,
} from "@/lib/p1-repository";
import type { Company, Employee, Settings, SocialConfig } from "@/types/payroll";

const DEFAULT_SOCIAL_CONFIG: SocialConfig = {
  compPension: 16,
  compLocalPension: 1,
  compUnemploy: 0.8,
  compMedical: 5,
  compInjury: 0.4,
  compMaternity: 0.5,
  workerPension: 8,
  workerUnemploy: 0.2,
  workerMedical: 2,
  pensionBase: 4775,
  unemploymentBase: 3000,
  medicalBase: 6727,
  injuryBase: 3000,
  maternityBase: 6727,
};

const DEFAULT_SETTINGS: Settings = {
  orgName: "公司名称",
  social: { ...DEFAULT_SOCIAL_CONFIG },
  companies: [],
};

interface OrgStats {
  employeeCount: number;
  companyCount: number;
  monthlyBaseTotal: number;
}

interface SettingsStoreState {
  settings: Settings;
  employees: Employee[];
  orgStats: OrgStats;
  loading: boolean;
  saving: boolean;
  errorMessage: string;
  noticeMessage: string;
  load: () => Promise<void>;
  saveOrgName: (orgName: string) => Promise<boolean>;
  saveSocial: (social: SocialConfig) => Promise<boolean>;
  saveCompanies: (companies: Company[]) => Promise<boolean>;
  upsertCompany: (company: Company, previousShort?: string) => Promise<boolean>;
  removeCompany: (companyShort: string) => Promise<boolean>;
  clearMessages: () => void;
  reset: () => void;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function normalizeSettings(value: Settings | null): Settings {
  if (!value) {
    return {
      ...DEFAULT_SETTINGS,
      social: { ...DEFAULT_SOCIAL_CONFIG },
      companies: [],
    };
  }

  return {
    orgName: value.orgName,
    social: {
      ...DEFAULT_SOCIAL_CONFIG,
      ...value.social,
    },
    companies: Array.isArray(value.companies) ? value.companies : [],
  };
}

function computeOrgStats(employees: Employee[]): OrgStats {
  const companies = new Set<string>();
  let monthlyBaseTotal = 0;

  for (const employee of employees) {
    if (employee.companyShort.trim() !== "") {
      companies.add(employee.companyShort.trim());
    }
    monthlyBaseTotal += employee.baseSalary + employee.subsidy;
  }

  return {
    employeeCount: employees.length,
    companyCount: companies.size,
    monthlyBaseTotal,
  };
}

function normalizeCompanies(companies: Company[]): Company[] {
  const dedupe = new Set<string>();
  const normalized: Company[] = [];

  for (const company of companies) {
    const short = company.short.trim();
    const full = company.full.trim();
    if (short === "" || dedupe.has(short)) {
      continue;
    }

    dedupe.add(short);
    normalized.push({ short, full: full || short });
  }

  return normalized.sort((left, right) => left.short.localeCompare(right.short, "zh-Hans-CN"));
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => {
  const persist = async (next: Settings, noticeMessage: string): Promise<boolean> => {
    set({ saving: true, errorMessage: "", noticeMessage: "" });

    try {
      const saved = await saveRepositorySettings(next);
      if (!saved) {
        set({ errorMessage: "保存设置失败：仓储接口不可用", saving: false });
        return false;
      }

      set((state) => ({
        settings: normalizeSettings(saved),
        orgStats: computeOrgStats(state.employees),
        saving: false,
        noticeMessage,
      }));
      return true;
    } catch (error) {
      set({
        saving: false,
        errorMessage: `保存设置失败：${toErrorMessage(error)}`,
      });
      return false;
    }
  };

  return {
    settings: {
      ...DEFAULT_SETTINGS,
      social: { ...DEFAULT_SOCIAL_CONFIG },
      companies: [],
    },
    employees: [],
    orgStats: {
      employeeCount: 0,
      companyCount: 0,
      monthlyBaseTotal: 0,
    },
    loading: false,
    saving: false,
    errorMessage: "",
    noticeMessage: "",
    load: async () => {
      set({ loading: true, errorMessage: "", noticeMessage: "" });

      try {
        const [settings, employees] = await Promise.all([
          loadRepositorySettings(),
          listRepositoryEmployees(),
        ]);

        set({
          settings: normalizeSettings(settings),
          employees,
          orgStats: computeOrgStats(employees),
          loading: false,
        });
      } catch (error) {
        set({
          loading: false,
          errorMessage: `加载设置失败：${toErrorMessage(error)}`,
        });
      }
    },
    saveOrgName: async (orgName: string) => {
      const trimmed = orgName.trim();
      if (trimmed === "") {
        set({ errorMessage: "组织名称不能为空" });
        return false;
      }

      const current = get().settings;
      return persist(
        {
          ...current,
          orgName: trimmed,
        },
        "组织名称已保存",
      );
    },
    saveSocial: async (social: SocialConfig) => {
      const current = get().settings;
      return persist(
        {
          ...current,
          social,
        },
        "社保配置已保存",
      );
    },
    saveCompanies: async (companies: Company[]) => {
      const normalized = normalizeCompanies(companies);
      const current = get().settings;
      return persist(
        {
          ...current,
          companies: normalized,
        },
        "公司主体已保存",
      );
    },
    upsertCompany: async (company: Company, previousShort?: string) => {
      const short = company.short.trim();
      const full = company.full.trim();
      if (short === "") {
        set({ errorMessage: "公司简称不能为空" });
        return false;
      }

      const currentCompanies = get().settings.companies;
      const duplicate = currentCompanies.find(
        (item) => item.short === short && item.short !== (previousShort ?? ""),
      );
      if (duplicate) {
        set({ errorMessage: "公司简称重复，请修改后重试" });
        return false;
      }

      const nextCompanies = currentCompanies.map((item) => {
        if (item.short === previousShort || (previousShort === undefined && item.short === short)) {
          return {
            short,
            full: full || short,
          };
        }

        return item;
      });

      if (!nextCompanies.some((item) => item.short === short)) {
        nextCompanies.push({ short, full: full || short });
      }

      return get().saveCompanies(nextCompanies);
    },
    removeCompany: async (companyShort: string) => {
      const nextCompanies = get().settings.companies.filter((company) => company.short !== companyShort);
      return get().saveCompanies(nextCompanies);
    },
    clearMessages: () => {
      set({ errorMessage: "", noticeMessage: "" });
    },
    reset: () => {
      set({
        settings: {
          ...DEFAULT_SETTINGS,
          social: { ...DEFAULT_SOCIAL_CONFIG },
          companies: [],
        },
        employees: [],
        orgStats: {
          employeeCount: 0,
          companyCount: 0,
          monthlyBaseTotal: 0,
        },
        loading: false,
        saving: false,
        errorMessage: "",
        noticeMessage: "",
      });
    },
  };
});
