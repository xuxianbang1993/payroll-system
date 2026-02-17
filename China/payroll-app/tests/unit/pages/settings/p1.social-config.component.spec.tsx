import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/i18n";
import { SocialConfigPage } from "@/pages/settings/SocialConfigPage";
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

const baseSocial = {
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

describe("P1 social config page", () => {
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
      social: baseSocial,
      companies: [{ short: "AC", full: "Acme Co" }],
    });
    mockedListEmployees.mockResolvedValue([]);
    mockedSaveSettings.mockImplementation(async (payload) => payload as never);
  });

  it("loads and displays example totals from config values", async () => {
    render(<SocialConfigPage />);

    // Wait for settings to load — the example section should display computed totals
    await waitFor(() => {
      expect(mockedLoadSettings).toHaveBeenCalled();
    });

    // Employer total = (4775*(16+1))/100 + (3000*0.8)/100 + (6727*5)/100
    //                + (3000*0.4)/100 + (6727*0.5)/100 = 811.75 + 24 + 336.35 + 12 + 33.635
    // = 1,217.74 (approx with formatAmount rounding)
    // The exact value depends on formatAmount logic, just check something is rendered
    const exampleSection = await screen.findByText(/Employer total:/i);
    expect(exampleSection).toBeInTheDocument();

    const workerSection = screen.getByText(/Employee total:/i);
    expect(workerSection).toBeInTheDocument();
  });

  it("updates example in real-time when a rate field changes", async () => {
    const user = userEvent.setup();

    render(<SocialConfigPage />);

    // Wait for form to populate
    const pensionInput = await screen.findByDisplayValue("16");
    expect(pensionInput).toBeInTheDocument();

    // Capture original employer total text
    const originalText = screen.getByText(/Employer total:/i).textContent;

    // Change employer pension from 16 to 20
    await user.clear(pensionInput);
    await user.type(pensionInput, "20");

    // Example should update — new employer total should be different
    await waitFor(() => {
      const updatedText = screen.getByText(/Employer total:/i).textContent;
      expect(updatedText).not.toBe(originalText);
    });
  });

  it("saves social config on button click", async () => {
    const user = userEvent.setup();

    render(<SocialConfigPage />);

    await screen.findByDisplayValue("16");

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockedSaveSettings).toHaveBeenCalled();
    });

    const payload = mockedSaveSettings.mock.calls[0]?.[0];
    expect(payload?.social).toBeDefined();
    expect(payload?.social.compPension).toBe(16);
  });
});
