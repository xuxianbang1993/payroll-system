import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/i18n";
import { EmployeeListPage } from "@/pages/employee/EmployeeListPage";
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

describe("P1 employee list page", () => {
  const mockedListEmployees = vi.mocked(listRepositoryEmployees);
  const mockedLoadSettings = vi.mocked(loadRepositorySettings);
  const mockedReplaceEmployees = vi.mocked(replaceRepositoryEmployees);

  beforeEach(() => {
    useEmployeeStore.getState().reset();
    mockedListEmployees.mockReset();
    mockedLoadSettings.mockReset();
    mockedReplaceEmployees.mockReset();

    mockedListEmployees.mockResolvedValue([
      {
        id: 1,
        name: "Alice",
        idCard: "",
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
    ]);
    mockedLoadSettings.mockResolvedValue({
      orgName: "Acme",
      social: {
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
      },
      companies: [{ short: "AC", full: "Acme Co" }],
    });
    mockedReplaceEmployees.mockResolvedValue({ count: 1 });
  });

  it("supports inline edit and persists list", async () => {
    const user = userEvent.setup();

    render(<EmployeeListPage />);

    await screen.findByText("Alice");
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const nameInput = screen.getByDisplayValue("Alice");
    await user.clear(nameInput);
    await user.type(nameInput, "Alice Updated");

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockedReplaceEmployees).toHaveBeenCalled();
    });

    const payload = mockedReplaceEmployees.mock.calls[0]?.[0] ?? [];
    expect(payload[0]?.name).toBe("Alice Updated");
  });

  it("allows jumping from detail panel to inline edit", async () => {
    const user = userEvent.setup();

    render(<EmployeeListPage />);

    await user.click(await screen.findByRole("cell", { name: "Alice" }));
    await user.click(screen.getByRole("button", { name: "Edit This Employee" }));

    expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
  });
});
