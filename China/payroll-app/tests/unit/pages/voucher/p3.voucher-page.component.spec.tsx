import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/i18n";
import i18n from "@/i18n";
import { VoucherPage } from "@/pages/voucher/VoucherPage";
import type { Company, PaySlip } from "@/types/payroll";

interface PayrollStoreStateMock {
  slips: Record<number, PaySlip>;
  selectedMonth: string;
  loading: boolean;
  errorMessage: string;
  noticeMessage: string;
  loadForMonth: (month: string) => Promise<void>;
  clearMessages: () => void;
}

interface SettingsStoreStateMock {
  settings: { companies: Company[] };
  loading: boolean;
  load: () => Promise<void>;
}

interface AppStoreStateMock {
  selectedMonth: string;
}

const payrollState: PayrollStoreStateMock = {
  slips: {},
  selectedMonth: "2026-03",
  loading: false,
  errorMessage: "",
  noticeMessage: "",
  loadForMonth: vi.fn(async () => {}),
  clearMessages: vi.fn(),
};

const settingsState: SettingsStoreStateMock = {
  settings: { companies: [] },
  loading: false,
  load: vi.fn(async () => {}),
};

const appState: AppStoreStateMock = {
  selectedMonth: "2026-03",
};

const createObjectUrlMock = vi.fn(() => "blob:csv-export");
const revokeObjectUrlMock = vi.fn();
const anchorClickMock = vi.fn();

vi.mock("@/stores/payroll-store", () => ({
  usePayrollStore: (selector: (state: PayrollStoreStateMock) => unknown) => selector(payrollState),
}));

vi.mock("@/stores/settings-store", () => ({
  useSettingsStore: (selector: (state: SettingsStoreStateMock) => unknown) => selector(settingsState),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (state: AppStoreStateMock) => unknown) => selector(appState),
}));

function buildSlip(overrides: Partial<PaySlip>): PaySlip {
  return {
    base: 0,
    perfSalary: 0,
    commission: 0,
    bonus: 0,
    totalPerf: 0,
    otherAdj: 0,
    fullGrossPay: 0,
    absentH: 0,
    absentDeduct: 0,
    grossPay: 0,
    cPension: 0,
    cLocalPension: 0,
    cUnemploy: 0,
    cMedical: 0,
    cInjury: 0,
    cMaternity: 0,
    cSocial: 0,
    cFund: 0,
    cTotal: 0,
    wPension: 0,
    wUnemploy: 0,
    wMedical: 0,
    wSocial: 0,
    wFund: 0,
    tax: 0,
    totalDeduct: 0,
    netPay: 0,
    hourlyRate: 0,
    perfGrade: "",
    type: "sales",
    companyShort: "AC",
    ...overrides,
  };
}

describe("VoucherPage", () => {
  beforeAll(() => {
    if (!HTMLElement.prototype.scrollIntoView) {
      HTMLElement.prototype.scrollIntoView = () => {};
    }
    if (!HTMLElement.prototype.hasPointerCapture) {
      HTMLElement.prototype.hasPointerCapture = () => false;
    }
    if (!HTMLElement.prototype.setPointerCapture) {
      HTMLElement.prototype.setPointerCapture = () => {};
    }
    if (!HTMLElement.prototype.releasePointerCapture) {
      HTMLElement.prototype.releasePointerCapture = () => {};
    }
    URL.createObjectURL = createObjectUrlMock;
    URL.revokeObjectURL = revokeObjectUrlMock;
    HTMLAnchorElement.prototype.click = anchorClickMock;
  });

  beforeEach(async () => {
    await i18n.changeLanguage("en");
    payrollState.slips = {
      1: buildSlip({
        type: "sales",
        companyShort: "AC",
        fullGrossPay: 20000,
        cSocial: 3000,
        cFund: 1000,
        wSocial: 1200,
        wFund: 450,
        tax: 300,
        netPay: 17850,
        absentDeduct: 200,
      }),
      2: buildSlip({
        type: "management",
        companyShort: "BC",
        fullGrossPay: 10000,
        cSocial: 1500,
        cFund: 500,
        wSocial: 800,
        wFund: 300,
        tax: 200,
        netPay: 8600,
        absentDeduct: 100,
      }),
    };
    payrollState.selectedMonth = "2026-03";
    payrollState.loading = false;
    payrollState.errorMessage = "";
    payrollState.noticeMessage = "";
    payrollState.loadForMonth = vi.fn(async () => {});
    payrollState.clearMessages = vi.fn();

    settingsState.settings = {
      companies: [
        { short: "AC", full: "Acme Co" },
        { short: "BC", full: "Beta Corp" },
      ],
    };
    settingsState.loading = false;
    settingsState.load = vi.fn(async () => {});

    appState.selectedMonth = "2026-03";
    createObjectUrlMock.mockClear();
    revokeObjectUrlMock.mockClear();
    anchorClickMock.mockClear();
  });

  it("loads month/settings on mount and renders balance summary with vouchers", async () => {
    render(<VoucherPage />);

    await waitFor(() => {
      expect(payrollState.loadForMonth).toHaveBeenCalledWith("2026-03");
      expect(settingsState.load).toHaveBeenCalled();
    });

    expect(screen.getByText("Voucher Overview")).toBeInTheDocument();
    expect(screen.getByText("Balance Check")).toBeInTheDocument();
    expect(screen.getByText("5 voucher(s) generated")).toBeInTheDocument();
    expect(screen.getByText("Salary Payable")).toBeInTheDocument();
    expect(screen.getAllByText("30,000.00").length).toBeGreaterThan(0);
    expect(screen.getByText("2026-03 计提月工资")).toBeInTheDocument();
    expect(screen.getByText("2026-03 发放工资")).toBeInTheDocument();
  });

  it("filters voucher data by selected company", async () => {
    const user = userEvent.setup();

    render(<VoucherPage />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Acme Co"));

    expect(screen.getAllByText("20,000.00").length).toBeGreaterThan(0);
    expect(screen.queryByText("30,000.00")).not.toBeInTheDocument();
  });

  it("shows empty state when the month has no payroll slips", () => {
    payrollState.slips = {};

    render(<VoucherPage />);

    expect(screen.getByRole("button", { name: "Export CSV" })).toBeDisabled();
    expect(
      screen.getByText("No payroll data for this month. Please generate payslips in the Payroll module first."),
    ).toBeInTheDocument();
  });

  it("exports voucher CSV when the export button is clicked", async () => {
    const user = userEvent.setup();

    render(<VoucherPage />);

    await user.click(screen.getByRole("button", { name: "Export CSV" }));

    expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
    expect(anchorClickMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:csv-export");
  });
});
