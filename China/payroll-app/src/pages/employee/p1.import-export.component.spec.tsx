import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/i18n";

const importExportMocks = vi.hoisted(() => ({
  createTemplate: vi.fn(() => new Uint8Array()),
  buildWorkbook: vi.fn(() => new Uint8Array()),
  parseWorkbook: vi.fn(),
  findConflicts: vi.fn(),
  mergeRows: vi.fn(),
}));

vi.mock("@/lib/p1-employee-import-export", () => ({
  createEmployeeTemplateWorkbook: importExportMocks.createTemplate,
  buildEmployeeWorkbook: importExportMocks.buildWorkbook,
  parseEmployeeWorkbook: importExportMocks.parseWorkbook,
  findEmployeeImportConflicts: importExportMocks.findConflicts,
  mergeEmployeeImportRows: importExportMocks.mergeRows,
}));

import { ImportExportPage } from "@/pages/employee/ImportExportPage";
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

describe("P1 import/export page", () => {
  const mockedListEmployees = vi.mocked(listRepositoryEmployees);
  const mockedLoadSettings = vi.mocked(loadRepositorySettings);
  const mockedReplaceEmployees = vi.mocked(replaceRepositoryEmployees);

  beforeEach(() => {
    useEmployeeStore.getState().reset();

    mockedListEmployees.mockReset();
    mockedLoadSettings.mockReset();
    mockedReplaceEmployees.mockReset();

    importExportMocks.parseWorkbook.mockReset();
    importExportMocks.findConflicts.mockReset();
    importExportMocks.mergeRows.mockReset();

    const existing = {
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
    };

    const row = {
      rowNumber: 2,
      name: "Alice",
      idCard: "110101199001010011",
      companyShort: "AC",
      company: "Acme Co",
      dept: "HR",
      position: "Director",
      type: "管理" as const,
      baseSalary: 12000,
      subsidy: 600,
      hasSocial: true,
      hasLocalPension: true,
      fundAmount: 400,
    };

    mockedListEmployees.mockResolvedValue([existing]);
    mockedLoadSettings.mockResolvedValue({
      orgName: "Acme",
      social,
      companies: [{ short: "AC", full: "Acme Co" }],
    });
    mockedReplaceEmployees.mockResolvedValue({ count: 1 });

    importExportMocks.parseWorkbook.mockReturnValue({ rows: [row], errors: [] });
    importExportMocks.findConflicts.mockReturnValue({
      conflicts: [{ row, existing }],
      acceptedRows: [],
    });
    importExportMocks.mergeRows.mockReturnValue({
      employees: [existing],
      summary: { inserted: 0, overwritten: 1, skipped: 0 },
    });
  });

  it("blocks direct apply when conflicts are unresolved", async () => {
    const user = userEvent.setup();
    const { container } = render(<ImportExportPage defaultTab="import" />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).toBeTruthy();

    const file = new File(["dummy"], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }) as File & { arrayBuffer?: () => Promise<ArrayBuffer> };
    file.arrayBuffer = async () => new TextEncoder().encode("dummy").buffer;

    fireEvent.change(fileInput!, { target: { files: [file] } });

    await waitFor(() => {
      expect(importExportMocks.parseWorkbook).toHaveBeenCalled();
    });

    expect(screen.getByRole("heading", { name: "Import Conflict Handling" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "Resolve Conflicts" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply Import" })).toBeDisabled();
  });
});
