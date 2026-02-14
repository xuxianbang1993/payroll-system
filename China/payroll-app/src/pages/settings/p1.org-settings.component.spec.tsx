import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/i18n";
import { OrgSettingsPage } from "@/pages/settings/OrgSettingsPage";
import { useSettingsStore } from "@/stores/settings-store";
import {
  listRepositoryEmployees,
  loadRepositorySettings,
  saveRepositorySettings,
} from "@/lib/p1-repository";

vi.mock("@/lib/p1-repository", () => ({
  listRepositoryEmployees: vi.fn(),
  loadRepositorySettings: vi.fn(),
  saveRepositorySettings: vi.fn(),
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

describe("P1 org settings page", () => {
  const mockedLoadSettings = vi.mocked(loadRepositorySettings);
  const mockedListEmployees = vi.mocked(listRepositoryEmployees);
  const mockedSaveSettings = vi.mocked(saveRepositorySettings);

  beforeEach(() => {
    useSettingsStore.getState().reset();
    mockedLoadSettings.mockReset();
    mockedListEmployees.mockReset();
    mockedSaveSettings.mockReset();

    mockedLoadSettings.mockResolvedValue({
      orgName: "Acme",
      social,
      companies: [{ short: "AC", full: "Acme Co" }],
    });
    mockedListEmployees.mockResolvedValue([
      {
        id: 1,
        name: "Alice",
        idCard: "",
        companyShort: "AC",
        company: "Acme Co",
        dept: "",
        position: "",
        type: "管理",
        baseSalary: 10000,
        subsidy: 500,
        hasSocial: true,
        hasLocalPension: true,
        fundAmount: 300,
      },
    ]);
    mockedSaveSettings.mockImplementation(async (payload) => payload as never);
  });

  it("loads metrics and saves edited org name", async () => {
    const user = userEvent.setup();

    render(<OrgSettingsPage />);

    await screen.findByText("Employees");
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getByText(/10,500\.00|10500\.00/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const input = screen.getByDisplayValue("Acme");
    await user.clear(input);
    await user.type(input, "Acme New");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockedSaveSettings).toHaveBeenCalled();
    });
  });
});
