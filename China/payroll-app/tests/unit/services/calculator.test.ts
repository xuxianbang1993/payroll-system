import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";

import { calculatePaySlip } from "@/services/calculator";
import type { Employee, PayrollInput, SocialConfig } from "@/types/payroll";

const DEFAULT_SOCIAL_CONFIG: SocialConfig = {
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

function buildEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 1,
    name: "Alice",
    idCard: "110101199001010011",
    companyShort: "AC",
    company: "Acme Co",
    dept: "Finance",
    position: "Specialist",
    type: "management",
    baseSalary: 10000,
    subsidy: 500,
    hasSocial: true,
    hasLocalPension: true,
    fundAmount: 300,
    ...overrides,
  };
}

describe("calculatePaySlip", () => {
  it("calculates base-only salary with no performance, social, or absence", () => {
    const employee = buildEmployee({ hasSocial: false, hasLocalPension: false, fundAmount: 0 });

    const result = calculatePaySlip(employee, {}, DEFAULT_SOCIAL_CONFIG);

    expect(result.base).toBe(10500);
    expect(result.totalPerf).toBe(0);
    expect(result.fullGrossPay).toBe(10500);
    expect(result.absentH).toBe(0);
    expect(result.absentDeduct).toBe(0);
    expect(result.grossPay).toBe(10500);
    expect(result.tax).toBe(0);
    expect(result.totalDeduct).toBe(0);
    expect(result.netPay).toBe(10500);
  });

  it("calculates fullGrossPay with all performance inputs", () => {
    const employee = buildEmployee({ hasSocial: false, fundAmount: 0 });
    const input: PayrollInput = {
      perfSalary: 1200,
      commission: 345.67,
      bonus: 500,
      otherAdj: 100,
    };

    const result = calculatePaySlip(employee, input, DEFAULT_SOCIAL_CONFIG);

    expect(result.perfSalary).toBe(1200);
    expect(result.commission).toBe(345.67);
    expect(result.bonus).toBe(500);
    expect(result.totalPerf).toBe(2045.67);
    expect(result.otherAdj).toBe(100);
    expect(result.fullGrossPay).toBe(12645.67);
  });

  it("calculates absence deduction by hourlyRate = base / 21.75 / 8", () => {
    const employee = buildEmployee({ baseSalary: 4350, subsidy: 0, hasSocial: false, fundAmount: 0 });

    const result = calculatePaySlip(employee, { absentHours: 3.5 }, DEFAULT_SOCIAL_CONFIG);

    expect(result.hourlyRate).toBe(25);
    expect(result.absentDeduct).toBe(87.5);
    expect(result.grossPay).toBe(4262.5);
  });

  it.each([
    { otherAdj: 200, expectedGross: 10700 },
    { otherAdj: -188.88, expectedGross: 10311.12 },
  ])("supports positive/negative other adjustment: $otherAdj", ({ otherAdj, expectedGross }) => {
    const employee = buildEmployee({ hasSocial: false, fundAmount: 0 });

    const result = calculatePaySlip(employee, { otherAdj }, DEFAULT_SOCIAL_CONFIG);

    expect(result.otherAdj).toBe(otherAdj);
    expect(result.fullGrossPay).toBe(expectedGross);
    expect(result.grossPay).toBe(expectedGross);
  });

  it("calculates all employer and worker social items when hasSocial = true", () => {
    const employee = buildEmployee({ hasSocial: true, hasLocalPension: true, fundAmount: 300 });

    const result = calculatePaySlip(employee, { tax: 100 }, DEFAULT_SOCIAL_CONFIG);

    expect(result.cPension).toBe(764);
    expect(result.cLocalPension).toBe(47.75);
    expect(result.cUnemploy).toBe(24);
    expect(result.cMedical).toBe(336.35);
    expect(result.cInjury).toBe(12);
    expect(result.cMaternity).toBe(33.64);
    expect(result.cSocial).toBe(1217.74);

    expect(result.wPension).toBe(382);
    expect(result.wUnemploy).toBe(6);
    expect(result.wMedical).toBe(134.54);
    expect(result.wSocial).toBe(522.54);

    expect(result.cFund).toBe(300);
    expect(result.wFund).toBe(300);
    expect(result.cTotal).toBe(1517.74);
    expect(result.totalDeduct).toBe(922.54);
    expect(result.netPay).toBe(9577.46);
  });

  it("zeros all social insurance when hasSocial = false", () => {
    const employee = buildEmployee({ hasSocial: false, hasLocalPension: true, fundAmount: 260 });

    const result = calculatePaySlip(employee, { tax: 50 }, DEFAULT_SOCIAL_CONFIG);

    expect(result.cPension).toBe(0);
    expect(result.cLocalPension).toBe(0);
    expect(result.cUnemploy).toBe(0);
    expect(result.cMedical).toBe(0);
    expect(result.cInjury).toBe(0);
    expect(result.cMaternity).toBe(0);
    expect(result.cSocial).toBe(0);
    expect(result.wPension).toBe(0);
    expect(result.wUnemploy).toBe(0);
    expect(result.wMedical).toBe(0);
    expect(result.wSocial).toBe(0);

    expect(result.cFund).toBe(260);
    expect(result.wFund).toBe(260);
    expect(result.totalDeduct).toBe(310);
    expect(result.netPay).toBe(10190);
  });

  it("sets cLocalPension to zero when hasLocalPension = false", () => {
    const employee = buildEmployee({ hasSocial: true, hasLocalPension: false, fundAmount: 0 });

    const result = calculatePaySlip(employee, {}, DEFAULT_SOCIAL_CONFIG);

    expect(result.cLocalPension).toBe(0);
    expect(result.cSocial).toBe(1169.99);
    expect(result.wSocial).toBe(522.54);
  });

  it("rounds each social item to 2 decimals before summing", () => {
    const social: SocialConfig = {
      compPension: 33.335,
      compLocalPension: 33.335,
      compUnemploy: 33.335,
      compMedical: 33.335,
      compInjury: 33.335,
      compMaternity: 33.335,
      workerPension: 33.335,
      workerUnemploy: 33.335,
      workerMedical: 33.335,
      pensionBase: 1,
      unemploymentBase: 1,
      medicalBase: 1,
      injuryBase: 1,
      maternityBase: 1,
    };

    const result = calculatePaySlip(buildEmployee({ hasSocial: true, hasLocalPension: true, fundAmount: 0 }), {}, social);

    expect(result.cPension).toBe(0.33);
    expect(result.cLocalPension).toBe(0.33);
    expect(result.cUnemploy).toBe(0.33);
    expect(result.cMedical).toBe(0.33);
    expect(result.cInjury).toBe(0.33);
    expect(result.cMaternity).toBe(0.33);
    expect(result.cSocial).toBe(1.98);

    expect(result.wPension).toBe(0.33);
    expect(result.wUnemploy).toBe(0.33);
    expect(result.wMedical).toBe(0.33);
    expect(result.wSocial).toBe(0.99);
  });

  it("sets both cFund and wFund to fundAmount when fundAmount > 0", () => {
    const employee = buildEmployee({ hasSocial: false, fundAmount: 456.78 });

    const result = calculatePaySlip(employee, {}, DEFAULT_SOCIAL_CONFIG);

    expect(result.cFund).toBe(456.78);
    expect(result.wFund).toBe(456.78);
    expect(result.cTotal).toBe(456.78);
  });

  it("sets both cFund and wFund to zero when fundAmount = 0", () => {
    const employee = buildEmployee({ hasSocial: false, fundAmount: 0 });

    const result = calculatePaySlip(employee, {}, DEFAULT_SOCIAL_CONFIG);

    expect(result.cFund).toBe(0);
    expect(result.wFund).toBe(0);
    expect(result.cTotal).toBe(0);
  });

  it("calculates netPay = grossPay - wSocial - wFund - tax", () => {
    const employee = buildEmployee({ hasSocial: true, hasLocalPension: true, fundAmount: 200 });

    const result = calculatePaySlip(employee, { tax: 123.45 }, DEFAULT_SOCIAL_CONFIG);
    const expectedNetPay = new Decimal(result.grossPay)
      .minus(result.wSocial)
      .minus(result.wFund)
      .minus(result.tax)
      .toDecimalPlaces(2)
      .toNumber();

    expect(result.netPay).toBe(expectedNetPay);
  });

  it("handles floating-point sensitive values using decimal.js", () => {
    const employee = buildEmployee({
      baseSalary: 0.1,
      subsidy: 0.2,
      hasSocial: false,
      hasLocalPension: false,
      fundAmount: 0.2,
    });

    const result = calculatePaySlip(
      employee,
      {
        perfSalary: 0.3,
        commission: 0.4,
        bonus: 0.5,
        otherAdj: -0.1,
        tax: 0.3,
      },
      DEFAULT_SOCIAL_CONFIG,
    );

    expect(result.base).toBe(0.3);
    expect(result.totalPerf).toBe(1.2);
    expect(result.fullGrossPay).toBe(1.4);
    expect(result.totalDeduct).toBe(0.5);
    expect(result.netPay).toBe(0.9);
  });
});
