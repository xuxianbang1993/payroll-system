import { create } from "zustand";

import {
  listRepositoryEmployees,
  loadRepositorySettings,
  saveRepositorySettings,
} from "@/lib/p1-repository";
import { toErrorMessage } from "@/utils/error";
import {
  computeOrgStats,
  DEFAULT_SETTINGS,
  DEFAULT_SOCIAL_CONFIG,
  normalizeCompanies,
  normalizeSettings,
  validateCompanyShort,
  validateOrgName,
  type OrgStats,
} from "@/utils/settings-utils";
import type { Company, Employee, Settings, SocialConfig } from "@/types/payroll";

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

export const useSettingsStore = create<SettingsStoreState>((set, get) => {
  const persist = async (next: Settings, noticeKey: string): Promise<boolean> => {
    set({ saving: true, errorMessage: "", noticeMessage: "" });

    try {
      const saved = await saveRepositorySettings(next);
      if (!saved) {
        set({ errorMessage: "error.settingsRepositoryUnavailable", saving: false });
        return false;
      }

      set((state) => ({
        settings: normalizeSettings(saved),
        orgStats: computeOrgStats(state.employees),
        saving: false,
        noticeMessage: noticeKey,
      }));
      return true;
    } catch (error) {
      set({
        saving: false,
        errorMessage: `error.settingsSaveFailed|${toErrorMessage(error)}`,
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
          errorMessage: `error.settingsLoadFailed|${toErrorMessage(error)}`,
        });
      }
    },
    saveOrgName: async (orgName: string) => {
      const validation = validateOrgName(orgName);
      if (!validation.valid) {
        set({ errorMessage: validation.errorKey ?? "" });
        return false;
      }

      const current = get().settings;
      return persist(
        {
          ...current,
          orgName: orgName.trim(),
        },
        "success.orgNameSaved",
      );
    },
    saveSocial: async (social: SocialConfig) => {
      const current = get().settings;
      return persist(
        {
          ...current,
          social,
        },
        "success.socialConfigSaved",
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
        "success.companiesSaved",
      );
    },
    upsertCompany: async (company: Company, previousShort?: string) => {
      const currentCompanies = get().settings.companies;
      const validation = validateCompanyShort(company.short, currentCompanies, previousShort);
      if (!validation.valid) {
        set({ errorMessage: validation.errorKey ?? "" });
        return false;
      }

      const short = company.short.trim();
      const full = company.full.trim();

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
