import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Settings } from "@/types/payroll";
import { useSettingsStore } from "@/stores/settings-store";
import {
  listRepositoryEmployees,
  loadRepositorySettings,
  saveRepositorySettings,
} from "@/lib/p1-repository";

vi.mock("@/lib/p1-repository", () => ({
  loadRepositorySettings: vi.fn(),
  saveRepositorySettings: vi.fn(),
  listRepositoryEmployees: vi.fn(),
}));

const social = {
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

const mockSettings: Settings = {
  orgName: "Acme",
  social,
  companies: [
    { short: "AC", full: "Acme Co" },
    { short: "BC", full: "Beta Co" },
  ],
};

const mockEmployees = [
  {
    id: 1,
    name: "Alice",
    idCard: "110101199001010011",
    companyShort: "AC",
    company: "Acme Co",
    dept: "HR",
    position: "Manager",
    type: "管理" as const,
    baseSalary: 10000,
    subsidy: 500,
    hasSocial: true,
    hasLocalPension: true,
    fundAmount: 300,
  },
  {
    id: 2,
    name: "Bob",
    idCard: "110101199001010022",
    companyShort: "BC",
    company: "Beta Co",
    dept: "Sales",
    position: "Sales",
    type: "销售" as const,
    baseSalary: 9000,
    subsidy: 600,
    hasSocial: true,
    hasLocalPension: false,
    fundAmount: 200,
  },
];

describe("P1 settings store", () => {
  const mockedLoadSettings = vi.mocked(loadRepositorySettings);
  const mockedSaveSettings = vi.mocked(saveRepositorySettings);
  const mockedListEmployees = vi.mocked(listRepositoryEmployees);

  beforeEach(() => {
    useSettingsStore.getState().reset();
    mockedLoadSettings.mockReset();
    mockedSaveSettings.mockReset();
    mockedListEmployees.mockReset();
  });

  it("loads settings and computes org statistics", async () => {
    mockedLoadSettings.mockResolvedValue(mockSettings);
    mockedListEmployees.mockResolvedValue(mockEmployees);

    await useSettingsStore.getState().load();

    const state = useSettingsStore.getState();
    expect(state.settings.orgName).toBe("Acme");
    expect(state.orgStats.employeeCount).toBe(2);
    expect(state.orgStats.companyCount).toBe(2);
    expect(state.orgStats.monthlyBaseTotal).toBe(20100);
  });

  it("rejects empty org name before save", async () => {
    mockedLoadSettings.mockResolvedValue(mockSettings);
    mockedListEmployees.mockResolvedValue(mockEmployees);
    await useSettingsStore.getState().load();

    const ok = await useSettingsStore.getState().saveOrgName("   ");

    expect(ok).toBe(false);
    expect(mockedSaveSettings).not.toHaveBeenCalled();
    expect(useSettingsStore.getState().errorMessage).toContain("组织名称");
  });

  it("persists social and company updates", async () => {
    mockedLoadSettings.mockResolvedValue(mockSettings);
    mockedListEmployees.mockResolvedValue(mockEmployees);
    mockedSaveSettings.mockImplementation(async (next) => next as Settings);
    await useSettingsStore.getState().load();

    const socialSaved = await useSettingsStore.getState().saveSocial({
      ...social,
      compPension: 17,
    });
    const companySaved = await useSettingsStore.getState().upsertCompany({ short: "CC", full: "Core Co" });

    expect(socialSaved).toBe(true);
    expect(companySaved).toBe(true);
    expect(mockedSaveSettings).toHaveBeenCalled();
    expect(useSettingsStore.getState().settings.social.compPension).toBe(17);
    expect(useSettingsStore.getState().settings.companies.map((company) => company.short)).toContain("CC");
  });
});
