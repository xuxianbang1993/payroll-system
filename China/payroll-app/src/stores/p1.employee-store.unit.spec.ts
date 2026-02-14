import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Employee, Settings } from "@/types/payroll";
import { useEmployeeStore } from "@/stores/employee-store";
import {
  listRepositoryEmployees,
  loadRepositorySettings,
  replaceRepositoryEmployees,
} from "@/lib/p1-repository";

vi.mock("@/lib/p1-repository", () => ({
  listRepositoryEmployees: vi.fn(),
  loadRepositorySettings: vi.fn(),
  replaceRepositoryEmployees: vi.fn(),
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

const settings: Settings = {
  orgName: "Acme",
  social,
  companies: [
    { short: "AC", full: "Acme Co" },
    { short: "BC", full: "Beta Co" },
  ],
};

const employees: Employee[] = [
  {
    id: 1,
    name: "Alice",
    idCard: "110101199001010011",
    companyShort: "AC",
    company: "Acme Co",
    dept: "HR",
    position: "Manager",
    type: "管理",
    baseSalary: 10000,
    subsidy: 500,
    hasSocial: true,
    hasLocalPension: true,
    fundAmount: 300,
  },
  {
    id: 3,
    name: "Bob",
    idCard: "110101199001010022",
    companyShort: "BC",
    company: "Beta Co",
    dept: "Sales",
    position: "Sales",
    type: "销售",
    baseSalary: 9000,
    subsidy: 600,
    hasSocial: true,
    hasLocalPension: false,
    fundAmount: 200,
  },
];

describe("P1 employee store", () => {
  const mockedListEmployees = vi.mocked(listRepositoryEmployees);
  const mockedLoadSettings = vi.mocked(loadRepositorySettings);
  const mockedReplaceEmployees = vi.mocked(replaceRepositoryEmployees);

  beforeEach(() => {
    useEmployeeStore.getState().reset();
    mockedListEmployees.mockReset();
    mockedLoadSettings.mockReset();
    mockedReplaceEmployees.mockReset();

    mockedListEmployees.mockResolvedValue(employees);
    mockedLoadSettings.mockResolvedValue(settings);
    mockedReplaceEmployees.mockResolvedValue({ count: 0 });
  });

  it("loads employee list and company options", async () => {
    await useEmployeeStore.getState().load();

    const state = useEmployeeStore.getState();
    expect(state.employees).toHaveLength(2);
    expect(state.companyOptions.map((company) => company.short)).toEqual(["AC", "BC"]);
  });

  it("adds employee with incremental id and persists", async () => {
    await useEmployeeStore.getState().load();

    const ok = await useEmployeeStore.getState().addEmployee({
      name: "Carol",
      idCard: "110101199001010033",
      companyShort: "AC",
      company: "Acme Co",
      dept: "Ops",
      position: "Analyst",
      type: "管理",
      baseSalary: 8000,
      subsidy: 300,
      hasSocial: true,
      hasLocalPension: true,
      fundAmount: 180,
    });

    expect(ok).toBe(true);
    expect(mockedReplaceEmployees).toHaveBeenCalledTimes(1);
    const lastCall = mockedReplaceEmployees.mock.calls[0]?.[0] ?? [];
    expect(lastCall).toHaveLength(3);
    expect(lastCall[lastCall.length - 1]?.id).toBe(4);
  });

  it("updates and deletes employee", async () => {
    await useEmployeeStore.getState().load();

    const updated = await useEmployeeStore.getState().updateEmployee(1, {
      ...employees[0],
      position: "Director",
    });
    const deleted = await useEmployeeStore.getState().removeEmployee(3);

    expect(updated).toBe(true);
    expect(deleted).toBe(true);
    expect(mockedReplaceEmployees).toHaveBeenCalledTimes(2);
    expect(useEmployeeStore.getState().employees).toHaveLength(1);
    expect(useEmployeeStore.getState().employees[0]?.position).toBe("Director");
  });

  it("validates required fields for add action", async () => {
    await useEmployeeStore.getState().load();

    const ok = await useEmployeeStore.getState().addEmployee({
      name: " ",
      idCard: "",
      companyShort: "",
      company: "",
      dept: "",
      position: "",
      type: "管理",
      baseSalary: 0,
      subsidy: 0,
      hasSocial: false,
      hasLocalPension: false,
      fundAmount: 0,
    });

    expect(ok).toBe(false);
    expect(mockedReplaceEmployees).not.toHaveBeenCalled();
    expect(useEmployeeStore.getState().errorMessage).toContain("姓名");
  });
});
