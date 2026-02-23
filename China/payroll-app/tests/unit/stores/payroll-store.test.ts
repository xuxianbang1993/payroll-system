import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/p1-repository", () => ({
  listRepositoryEmployees: vi.fn(),
  loadRepositorySettings: vi.fn(),
  listRepositoryPayrollInputs: vi.fn(),
  listRepositoryPayrollResults: vi.fn(),
  saveRepositoryPayrollInput: vi.fn(),
  saveRepositoryPayrollResult: vi.fn(),
  deleteRepositoryPayrollByMonth: vi.fn(),
}));

vi.mock("@/services/calculator", () => ({
  calculatePaySlip: vi.fn(),
}));

vi.mock("@/services/aggregator", () => ({
  aggregatePaySlips: vi.fn(),
}));

import * as repo from "@/lib/p1-repository";
import { aggregatePaySlips } from "@/services/aggregator";
import { calculatePaySlip } from "@/services/calculator";
import { usePayrollStore } from "@/stores/payroll-store";
import type {
  AggregateResult,
  Employee,
  PayrollInput,
  PaySlip,
  SocialConfig,
} from "@/types/payroll";

const EMPLOYEES: Employee[] = [
  {
    id: 1,
    name: "张三",
    idCard: "110101199001011001",
    companyShort: "AC",
    company: "AC公司",
    dept: "销售部",
    position: "销售员",
    type: "sales",
    baseSalary: 5000,
    subsidy: 500,
    hasSocial: true,
    hasLocalPension: false,
    fundAmount: 1000,
  },
  {
    id: 2,
    name: "李四",
    idCard: "110101199002022002",
    companyShort: "AC",
    company: "AC公司",
    dept: "销售部",
    position: "销售主管",
    type: "sales",
    baseSalary: 6000,
    subsidy: 0,
    hasSocial: false,
    hasLocalPension: false,
    fundAmount: 0,
  },
  {
    id: 3,
    name: "王五",
    idCard: "110101199003033003",
    companyShort: "BC",
    company: "BC公司",
    dept: "管理部",
    position: "经理",
    type: "management",
    baseSalary: 8000,
    subsidy: 1000,
    hasSocial: true,
    hasLocalPension: true,
    fundAmount: 2000,
  },
  {
    id: 4,
    name: "赵六",
    idCard: "110101199004044004",
    companyShort: "BC",
    company: "BC公司",
    dept: "管理部",
    position: "助理",
    type: "management",
    baseSalary: 4000,
    subsidy: 0,
    hasSocial: true,
    hasLocalPension: false,
    fundAmount: 500,
  },
];

const SOCIAL: SocialConfig = {
  compPension: 16,
  compLocalPension: 1,
  compUnemploy: 0.5,
  compMedical: 8,
  compInjury: 0.3,
  compMaternity: 0.8,
  workerPension: 8,
  workerUnemploy: 0.5,
  workerMedical: 2,
  pensionBase: 5000,
  unemploymentBase: 5000,
  medicalBase: 5000,
  injuryBase: 5000,
  maternityBase: 5000,
};

const MONTH = "2026-02";

const MOCK_SLIP: PaySlip = {
  base: 5500,
  perfSalary: 0,
  commission: 0,
  bonus: 0,
  totalPerf: 0,
  otherAdj: 0,
  fullGrossPay: 5500,
  absentH: 0,
  absentDeduct: 0,
  grossPay: 5500,
  cPension: 800,
  cLocalPension: 0,
  cUnemploy: 25,
  cMedical: 400,
  cInjury: 15,
  cMaternity: 40,
  cSocial: 1280,
  cFund: 1000,
  cTotal: 2280,
  wPension: 400,
  wUnemploy: 25,
  wMedical: 100,
  wSocial: 525,
  wFund: 1000,
  tax: 0,
  totalDeduct: 1525,
  netPay: 3975,
  hourlyRate: 31.61,
  perfGrade: "",
  type: "sales",
  companyShort: "AC",
};

function createAggregate(partial?: Partial<AggregateResult>): AggregateResult {
  const base: AggregateResult = {
    sale: {
      fullGrossPay: 0,
      cSocial: 0,
      cFund: 0,
      wSocial: 0,
      wFund: 0,
      tax: 0,
      netPay: 0,
      absentDeduct: 0,
    },
    manage: {
      fullGrossPay: 0,
      cSocial: 0,
      cFund: 0,
      wSocial: 0,
      wFund: 0,
      tax: 0,
      netPay: 0,
      absentDeduct: 0,
    },
    total: {
      fullGrossPay: 0,
      cSocial: 0,
      cFund: 0,
      wSocial: 0,
      wFund: 0,
      tax: 0,
      netPay: 0,
      absentDeduct: 0,
    },
  };

  return {
    sale: { ...base.sale, ...(partial?.sale ?? {}) },
    manage: { ...base.manage, ...(partial?.manage ?? {}) },
    total: { ...base.total, ...(partial?.total ?? {}) },
  };
}

describe("usePayrollStore", () => {
  const mockedListRepositoryEmployees = vi.mocked(repo.listRepositoryEmployees);
  const mockedLoadRepositorySettings = vi.mocked(repo.loadRepositorySettings);
  const mockedListRepositoryPayrollInputs = vi.mocked(repo.listRepositoryPayrollInputs);
  const mockedListRepositoryPayrollResults = vi.mocked(repo.listRepositoryPayrollResults);
  const mockedSaveRepositoryPayrollInput = vi.mocked(repo.saveRepositoryPayrollInput);
  const mockedSaveRepositoryPayrollResult = vi.mocked(repo.saveRepositoryPayrollResult);
  const mockedDeleteRepositoryPayrollByMonth = vi.mocked(repo.deleteRepositoryPayrollByMonth);
  const mockedCalculatePaySlip = vi.mocked(calculatePaySlip);
  const mockedAggregatePaySlips = vi.mocked(aggregatePaySlips);

  beforeEach(() => {
    usePayrollStore.setState(usePayrollStore.getInitialState(), true);
    vi.clearAllMocks();
  });

  describe("loadForMonth", () => {
    it("loads employees, social, inputs, and results for the given month", async () => {
      const input1: PayrollInput = { perfSalary: 1000, commission: 300 };
      const input2: PayrollInput = { bonus: 600 };
      const slip1: PaySlip = { ...MOCK_SLIP };
      const aggregate = createAggregate({ total: { netPay: 3975 } });

      mockedListRepositoryEmployees.mockResolvedValue(EMPLOYEES);
      mockedLoadRepositorySettings.mockResolvedValue({
        orgName: "AC集团",
        social: SOCIAL,
        companies: [],
      });
      mockedListRepositoryPayrollInputs.mockResolvedValue([
        { id: "i-1", employeeId: 1, payrollMonth: MONTH, payload: input1 as Record<string, unknown> },
        { id: "i-2", employeeId: 3, payrollMonth: MONTH, payload: input2 as Record<string, unknown> },
      ]);
      mockedListRepositoryPayrollResults.mockResolvedValue([
        { id: "r-1", employeeId: 1, payrollMonth: MONTH, payload: slip1 as Record<string, unknown> },
      ]);
      mockedAggregatePaySlips.mockReturnValue(aggregate);

      await usePayrollStore.getState().loadForMonth(MONTH);

      const state = usePayrollStore.getState();
      expect(mockedListRepositoryPayrollInputs).toHaveBeenCalledWith(MONTH);
      expect(mockedListRepositoryPayrollResults).toHaveBeenCalledWith(MONTH);
      expect(state.selectedMonth).toBe(MONTH);
      expect(state.employees).toEqual(EMPLOYEES);
      expect(state.social).toEqual(SOCIAL);
      expect(state.inputs).toEqual({ 1: input1, 3: input2 });
      expect(state.slips).toEqual({ 1: slip1 });
      expect(state.aggregate).toEqual(aggregate);
      expect(state.loading).toBe(false);
      expect(mockedAggregatePaySlips).toHaveBeenCalledWith([slip1]);
    });

    it("sets aggregate to null when no results exist", async () => {
      const input1: PayrollInput = { perfSalary: 500 };

      mockedListRepositoryEmployees.mockResolvedValue(EMPLOYEES);
      mockedLoadRepositorySettings.mockResolvedValue({
        orgName: "AC集团",
        social: SOCIAL,
        companies: [],
      });
      mockedListRepositoryPayrollInputs.mockResolvedValue([
        { id: "i-1", employeeId: 1, payrollMonth: MONTH, payload: input1 as Record<string, unknown> },
      ]);
      mockedListRepositoryPayrollResults.mockResolvedValue([]);

      await usePayrollStore.getState().loadForMonth(MONTH);

      const state = usePayrollStore.getState();
      expect(state.aggregate).toBeNull();
      expect(state.slips).toEqual({});
      expect(mockedAggregatePaySlips).not.toHaveBeenCalled();
    });

    it("computes aggregate when results are present", async () => {
      const slip1: PaySlip = { ...MOCK_SLIP, netPay: 4000, type: "sales", companyShort: "AC" };
      const slip2: PaySlip = {
        ...MOCK_SLIP,
        netPay: 5200,
        type: "management",
        companyShort: "BC",
        cFund: 2000,
        wFund: 2000,
      };
      const aggregate = createAggregate({ total: { netPay: 9200 } });

      mockedListRepositoryEmployees.mockResolvedValue(EMPLOYEES);
      mockedLoadRepositorySettings.mockResolvedValue({
        orgName: "AC集团",
        social: SOCIAL,
        companies: [],
      });
      mockedListRepositoryPayrollInputs.mockResolvedValue([]);
      mockedListRepositoryPayrollResults.mockResolvedValue([
        { id: "r-1", employeeId: 1, payrollMonth: MONTH, payload: slip1 as Record<string, unknown> },
        { id: "r-2", employeeId: 3, payrollMonth: MONTH, payload: slip2 as Record<string, unknown> },
      ]);
      mockedAggregatePaySlips.mockReturnValue(aggregate);

      await usePayrollStore.getState().loadForMonth(MONTH);

      const state = usePayrollStore.getState();
      expect(mockedAggregatePaySlips).toHaveBeenCalledWith([slip1, slip2]);
      expect(state.aggregate).toEqual(aggregate);
    });

    it("sets errorMessage with toErrorMessage pattern when repository throws", async () => {
      mockedListRepositoryEmployees.mockRejectedValue(new Error("repo-down"));
      mockedLoadRepositorySettings.mockResolvedValue({
        orgName: "AC集团",
        social: SOCIAL,
        companies: [],
      });
      mockedListRepositoryPayrollInputs.mockResolvedValue([]);
      mockedListRepositoryPayrollResults.mockResolvedValue([]);

      await usePayrollStore.getState().loadForMonth(MONTH);

      const state = usePayrollStore.getState();
      expect(state.loading).toBe(false);
      expect(state.errorMessage).toBe("error.payrollLoadFailed|repo-down");
    });
  });

  describe("setMonth", () => {
    it("resets state and reloads for the new month", async () => {
      const nextMonth = "2026-03";

      usePayrollStore.setState({
        selectedMonth: MONTH,
        employees: EMPLOYEES,
        social: SOCIAL,
        inputs: { 1: { perfSalary: 1000 } },
        slips: { 1: MOCK_SLIP },
        aggregate: createAggregate({ total: { netPay: 9999 } }),
        errorMessage: "error.old",
        noticeMessage: "notice.old",
      });

      mockedListRepositoryEmployees.mockResolvedValue([EMPLOYEES[1]]);
      mockedLoadRepositorySettings.mockResolvedValue({
        orgName: "BC集团",
        social: SOCIAL,
        companies: [],
      });
      mockedListRepositoryPayrollInputs.mockResolvedValue([]);
      mockedListRepositoryPayrollResults.mockResolvedValue([]);

      await usePayrollStore.getState().setMonth(nextMonth);

      const state = usePayrollStore.getState();
      expect(state.selectedMonth).toBe(nextMonth);
      expect(state.employees).toEqual([EMPLOYEES[1]]);
      expect(state.inputs).toEqual({});
      expect(state.slips).toEqual({});
      expect(state.aggregate).toBeNull();
      expect(mockedListRepositoryPayrollInputs).toHaveBeenCalledWith(nextMonth);
      expect(mockedListRepositoryPayrollResults).toHaveBeenCalledWith(nextMonth);
    });
  });

  describe("updateInput", () => {
    it("saves input via IPC and updates inputs state", async () => {
      const input: PayrollInput = { perfGrade: "A", perfSalary: 1500 };
      usePayrollStore.setState({ selectedMonth: MONTH });

      mockedSaveRepositoryPayrollInput.mockResolvedValue({
        id: "i-1",
        employeeId: 1,
        payrollMonth: MONTH,
        payload: input as Record<string, unknown>,
      });

      const ok = await usePayrollStore.getState().updateInput(1, input);

      const state = usePayrollStore.getState();
      expect(ok).toBe(true);
      expect(mockedSaveRepositoryPayrollInput).toHaveBeenCalledWith(
        1,
        MONTH,
        input as Record<string, unknown>,
      );
      expect(state.inputs[1]).toEqual(input);
      expect(state.noticeMessage).toBe("success.payrollInputSaved");
      expect(state.generating).toBe(false);
    });

    it("sets error when repository returns null", async () => {
      const input: PayrollInput = { bonus: 300 };
      usePayrollStore.setState({ selectedMonth: MONTH });
      mockedSaveRepositoryPayrollInput.mockResolvedValue(null);

      const ok = await usePayrollStore.getState().updateInput(1, input);

      const state = usePayrollStore.getState();
      expect(ok).toBe(false);
      expect(state.errorMessage).toBe("error.payrollInputSaveUnavailable");
      expect(state.generating).toBe(false);
    });

    it("sets error with detail when repository throws", async () => {
      const input: PayrollInput = { bonus: 500 };
      usePayrollStore.setState({ selectedMonth: MONTH });
      mockedSaveRepositoryPayrollInput.mockRejectedValue(new Error("db-write-fail"));

      const ok = await usePayrollStore.getState().updateInput(1, input);

      const state = usePayrollStore.getState();
      expect(ok).toBe(false);
      expect(state.errorMessage).toBe("error.payrollInputSaveFailed|db-write-fail");
      expect(state.generating).toBe(false);
    });
  });

  describe("generateSlip", () => {
    it("calls calculatePaySlip, saves result, and updates state", async () => {
      const input: PayrollInput = { perfGrade: "A", commission: 500 };
      const slip: PaySlip = {
        ...MOCK_SLIP,
        perfGrade: "A",
        commission: 500,
        totalPerf: 500,
        fullGrossPay: 6000,
        grossPay: 6000,
        type: EMPLOYEES[0].type,
        companyShort: EMPLOYEES[0].companyShort,
      };
      const aggregate = createAggregate({ total: { netPay: slip.netPay } });

      usePayrollStore.setState({
        selectedMonth: MONTH,
        employees: EMPLOYEES,
        social: SOCIAL,
        inputs: { 1: input },
      });

      mockedCalculatePaySlip.mockReturnValue(slip);
      mockedSaveRepositoryPayrollResult.mockResolvedValue({
        id: "r-1",
        employeeId: 1,
        payrollMonth: MONTH,
        payload: slip as Record<string, unknown>,
      });
      mockedAggregatePaySlips.mockReturnValue(aggregate);

      const ok = await usePayrollStore.getState().generateSlip(1);

      const state = usePayrollStore.getState();
      expect(ok).toBe(true);
      expect(mockedCalculatePaySlip).toHaveBeenCalledWith(EMPLOYEES[0], input, SOCIAL);
      expect(mockedSaveRepositoryPayrollResult).toHaveBeenCalledWith(
        1,
        MONTH,
        slip as Record<string, unknown>,
      );
      expect(state.slips[1]).toEqual(slip);
      expect(state.aggregate).toEqual(aggregate);
      expect(state.noticeMessage).toBe("success.payrollSlipGenerated");
      expect(state.generating).toBe(false);
    });

    it("returns false and sets error when employee not found", async () => {
      usePayrollStore.setState({
        selectedMonth: MONTH,
        employees: [EMPLOYEES[0]],
        social: SOCIAL,
      });

      const ok = await usePayrollStore.getState().generateSlip(999);

      const state = usePayrollStore.getState();
      expect(ok).toBe(false);
      expect(state.errorMessage).toBe("error.employeeNotFound");
      expect(mockedCalculatePaySlip).not.toHaveBeenCalled();
      expect(mockedSaveRepositoryPayrollResult).not.toHaveBeenCalled();
    });

    it("returns false and sets error when social config not loaded", async () => {
      usePayrollStore.setState({
        selectedMonth: MONTH,
        employees: [EMPLOYEES[0]],
        social: null,
      });

      const ok = await usePayrollStore.getState().generateSlip(1);

      const state = usePayrollStore.getState();
      expect(ok).toBe(false);
      expect(state.errorMessage).toBe("error.socialConfigNotLoaded");
      expect(mockedCalculatePaySlip).not.toHaveBeenCalled();
      expect(mockedSaveRepositoryPayrollResult).not.toHaveBeenCalled();
    });

    it("returns false and sets error when save result returns null", async () => {
      const input: PayrollInput = { perfGrade: "B" };
      const slip: PaySlip = { ...MOCK_SLIP };

      usePayrollStore.setState({
        selectedMonth: MONTH,
        employees: [EMPLOYEES[0]],
        social: SOCIAL,
        inputs: { 1: input },
      });

      mockedCalculatePaySlip.mockReturnValue(slip);
      mockedSaveRepositoryPayrollResult.mockResolvedValue(null);

      const ok = await usePayrollStore.getState().generateSlip(1);

      const state = usePayrollStore.getState();
      expect(ok).toBe(false);
      expect(state.errorMessage).toBe("error.payrollResultSaveUnavailable");
      expect(state.generating).toBe(false);
    });
  });

  describe("generateAll", () => {
    it("computes and saves a slip for each employee sequentially", async () => {
      const aggregate = createAggregate({ total: { netPay: 5500 } });

      usePayrollStore.setState({
        selectedMonth: MONTH,
        employees: EMPLOYEES,
        social: SOCIAL,
        inputs: {},
      });

      mockedCalculatePaySlip.mockReturnValue(MOCK_SLIP);
      mockedSaveRepositoryPayrollResult.mockResolvedValue({
        id: "r-auto",
        employeeId: 0,
        payrollMonth: MONTH,
        payload: MOCK_SLIP as Record<string, unknown>,
      });
      mockedAggregatePaySlips.mockReturnValue(aggregate);

      await usePayrollStore.getState().generateAll();

      const state = usePayrollStore.getState();
      expect(mockedCalculatePaySlip).toHaveBeenCalledTimes(4);
      expect(mockedSaveRepositoryPayrollResult).toHaveBeenCalledTimes(4);
      expect(mockedCalculatePaySlip).toHaveBeenCalledWith(EMPLOYEES[0], {}, SOCIAL);
      expect(mockedCalculatePaySlip).toHaveBeenCalledWith(EMPLOYEES[1], {}, SOCIAL);
      expect(mockedCalculatePaySlip).toHaveBeenCalledWith(EMPLOYEES[2], {}, SOCIAL);
      expect(mockedCalculatePaySlip).toHaveBeenCalledWith(EMPLOYEES[3], {}, SOCIAL);
      expect(state.noticeMessage).toBe("success.payrollAllGenerated");
      expect(state.generating).toBe(false);
    });
  });

  describe("clearResults", () => {
    it("calls deleteRepositoryPayrollByMonth and resets slips and aggregate", async () => {
      const aggregate = createAggregate({ total: { netPay: 10000 } });
      usePayrollStore.setState({
        slips: { 1: MOCK_SLIP, 2: { ...MOCK_SLIP, netPay: 4200 } },
        aggregate,
      });

      mockedDeleteRepositoryPayrollByMonth.mockResolvedValue({
        deletedInputs: 2,
        deletedResults: 2,
      });

      const ok = await usePayrollStore.getState().clearResults(MONTH);

      const state = usePayrollStore.getState();
      expect(ok).toBe(true);
      expect(mockedDeleteRepositoryPayrollByMonth).toHaveBeenCalledWith(MONTH);
      expect(state.slips).toEqual({});
      expect(state.aggregate).toBeNull();
      expect(state.noticeMessage).toBe("success.payrollResultsCleared");
      expect(state.generating).toBe(false);
    });

    it("returns false and sets error when delete returns null", async () => {
      usePayrollStore.setState({
        slips: { 1: MOCK_SLIP },
        aggregate: createAggregate({ total: { netPay: 3975 } }),
      });

      mockedDeleteRepositoryPayrollByMonth.mockResolvedValue(null);

      const ok = await usePayrollStore.getState().clearResults(MONTH);

      const state = usePayrollStore.getState();
      expect(ok).toBe(false);
      expect(state.errorMessage).toBe("error.payrollClearUnavailable");
      expect(state.generating).toBe(false);
    });
  });

  describe("clearMessages", () => {
    it("clears both errorMessage and noticeMessage", () => {
      usePayrollStore.setState({
        errorMessage: "error.something",
        noticeMessage: "success.something",
      });

      usePayrollStore.getState().clearMessages();

      const state = usePayrollStore.getState();
      expect(state.errorMessage).toBe("");
      expect(state.noticeMessage).toBe("");
    });
  });

  describe("reset", () => {
    it("returns state to initial values", () => {
      usePayrollStore.setState({
        employees: EMPLOYEES,
        social: SOCIAL,
        inputs: { 1: { perfSalary: 1000 } },
        slips: { 1: MOCK_SLIP },
        aggregate: createAggregate({ total: { netPay: 3975 } }),
        loading: true,
        generating: true,
        errorMessage: "error.old",
        noticeMessage: "notice.old",
      });

      usePayrollStore.getState().reset();

      const state = usePayrollStore.getState();
      expect(state.employees).toEqual([]);
      expect(state.slips).toEqual({});
      expect(state.aggregate).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.generating).toBe(false);
      expect(state.errorMessage).toBe("");
      expect(state.noticeMessage).toBe("");
    });
  });
});
