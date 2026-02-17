import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/i18n";
import { CompanyPage } from "@/pages/settings/CompanyPage";
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

describe("P1 company page", () => {
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
    mockedListEmployees.mockResolvedValue([]);
    mockedSaveSettings.mockImplementation(async (payload) => payload as never);
  });

  it("loads and displays existing companies in the table", async () => {
    render(<CompanyPage />);

    await screen.findByText("AC");
    expect(screen.getByText("Acme Co")).toBeInTheDocument();
  });

  it("adds a new company", async () => {
    const user = userEvent.setup();

    render(<CompanyPage />);

    await screen.findByText("AC");

    const shortInput = screen.getByPlaceholderText("e.g. AC");
    const fullInput = screen.getByPlaceholderText("e.g. Acme Co");

    await user.type(shortInput, "BC");
    await user.type(fullInput, "Beta Corp");

    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(mockedSaveSettings).toHaveBeenCalled();
    });

    const payload = mockedSaveSettings.mock.calls[0]?.[0];
    const companies = payload?.companies ?? [];
    expect(companies.some((c: { short: string }) => c.short === "BC")).toBe(true);
  });

  it("edits an existing company", async () => {
    const user = userEvent.setup();

    render(<CompanyPage />);

    await screen.findByText("AC");

    // Click Edit on the AC row
    await user.click(screen.getByRole("button", { name: "Edit" }));

    // Form should be populated
    const shortInput = screen.getByDisplayValue("AC");
    const fullInput = screen.getByDisplayValue("Acme Co");

    await user.clear(fullInput);
    await user.type(fullInput, "Acme Corporation");

    // Button should now say "Update"
    await user.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(mockedSaveSettings).toHaveBeenCalled();
    });

    const payload = mockedSaveSettings.mock.calls[0]?.[0];
    const acCompany = payload?.companies?.find((c: { short: string }) => c.short === "AC");
    expect(acCompany?.full).toBe("Acme Corporation");
  });

  it("deletes a company after confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<CompanyPage />);

    await screen.findByText("AC");

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockedSaveSettings).toHaveBeenCalled();
    });

    const payload = mockedSaveSettings.mock.calls[0]?.[0];
    const companies = payload?.companies ?? [];
    expect(companies.some((c: { short: string }) => c.short === "AC")).toBe(false);

    vi.mocked(window.confirm).mockRestore();
  });
});
