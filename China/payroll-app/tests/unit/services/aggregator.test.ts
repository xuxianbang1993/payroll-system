import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";

import { aggregatePaySlips } from "@/services/aggregator";
import type { AggregateGroup, PaySlip } from "@/types/payroll";

const AGGREGATE_FIELDS: Array<keyof AggregateGroup> = [
  "fullGrossPay",
  "cSocial",
  "cFund",
  "wSocial",
  "wFund",
  "tax",
  "netPay",
  "absentDeduct",
];

const ZERO_GROUP: AggregateGroup = {
  fullGrossPay: 0,
  cSocial: 0,
  cFund: 0,
  wSocial: 0,
  wFund: 0,
  tax: 0,
  netPay: 0,
  absentDeduct: 0,
};

function buildPaySlip(overrides: Partial<PaySlip> = {}): PaySlip {
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

const mixedTypeSlips: PaySlip[] = [
  buildPaySlip({
    type: "sales",
    companyShort: "AC",
    fullGrossPay: 1000,
    cSocial: 100,
    cFund: 50,
    wSocial: 80,
    wFund: 50,
    tax: 20,
    netPay: 850,
    absentDeduct: 10,
  }),
  buildPaySlip({
    type: "sales",
    companyShort: "BC",
    fullGrossPay: 500,
    cSocial: 60,
    cFund: 30,
    wSocial: 45,
    wFund: 30,
    tax: 10,
    netPay: 415,
    absentDeduct: 5,
  }),
  buildPaySlip({
    type: "management",
    companyShort: "AC",
    fullGrossPay: 800,
    cSocial: 90,
    cFund: 40,
    wSocial: 70,
    wFund: 40,
    tax: 15,
    netPay: 675,
    absentDeduct: 8,
  }),
  buildPaySlip({
    type: "management",
    companyShort: "BC",
    fullGrossPay: 1200,
    cSocial: 130,
    cFund: 60,
    wSocial: 100,
    wFund: 60,
    tax: 25,
    netPay: 1015,
    absentDeduct: 12,
  }),
];

describe("aggregatePaySlips", () => {
  it("returns all-zero groups for empty input", () => {
    const result = aggregatePaySlips([]);

    expect(result).toEqual({
      sale: ZERO_GROUP,
      manage: ZERO_GROUP,
      total: ZERO_GROUP,
    });
  });

  it("aggregates slips by type into sale/manage groups", () => {
    const result = aggregatePaySlips(mixedTypeSlips);

    expect(result.sale).toEqual({
      fullGrossPay: 1500,
      cSocial: 160,
      cFund: 80,
      wSocial: 125,
      wFund: 80,
      tax: 30,
      netPay: 1265,
      absentDeduct: 15,
    });
    expect(result.manage).toEqual({
      fullGrossPay: 2000,
      cSocial: 220,
      cFund: 100,
      wSocial: 170,
      wFund: 100,
      tax: 40,
      netPay: 1690,
      absentDeduct: 20,
    });
  });

  it("makes total equal to sale + manage for every aggregate field", () => {
    const result = aggregatePaySlips(mixedTypeSlips);

    for (const field of AGGREGATE_FIELDS) {
      const expected = new Decimal(result.sale[field]).plus(result.manage[field]).toDecimalPlaces(2).toNumber();
      expect(result.total[field]).toBe(expected);
    }
  });

  it("applies precision rule: sum raw values first, then round to 2 decimals", () => {
    const precisionSlips = Array.from({ length: 3 }, () =>
      buildPaySlip({
        type: "sales",
        companyShort: "AC",
        fullGrossPay: 0.105,
        cSocial: 0.105,
        cFund: 0.105,
        wSocial: 0.105,
        wFund: 0.105,
        tax: 0.105,
        netPay: 0.105,
        absentDeduct: 0.105,
      }),
    );

    const result = aggregatePaySlips(precisionSlips);

    for (const field of AGGREGATE_FIELDS) {
      expect(result.sale[field]).toBe(0.32);
      expect(result.total[field]).toBe(0.32);
      expect(result.sale[field]).not.toBe(0.33);
    }
  });

  it("filters by companyShort when filterCompany is provided", () => {
    const result = aggregatePaySlips(mixedTypeSlips, "AC");

    expect(result.sale).toEqual({
      fullGrossPay: 1000,
      cSocial: 100,
      cFund: 50,
      wSocial: 80,
      wFund: 50,
      tax: 20,
      netPay: 850,
      absentDeduct: 10,
    });
    expect(result.manage).toEqual({
      fullGrossPay: 800,
      cSocial: 90,
      cFund: 40,
      wSocial: 70,
      wFund: 40,
      tax: 15,
      netPay: 675,
      absentDeduct: 8,
    });
    expect(result.total).toEqual({
      fullGrossPay: 1800,
      cSocial: 190,
      cFund: 90,
      wSocial: 150,
      wFund: 90,
      tax: 35,
      netPay: 1525,
      absentDeduct: 18,
    });
  });

  it("treats filterCompany = undefined as aggregating all slips", () => {
    const resultAll = aggregatePaySlips(mixedTypeSlips);
    const resultUndefined = aggregatePaySlips(mixedTypeSlips, undefined);

    expect(resultUndefined).toEqual(resultAll);
  });

  it("keeps missing type group at zero when only one type exists", () => {
    const salesOnlySlips: PaySlip[] = [
      buildPaySlip({
        type: "sales",
        companyShort: "AC",
        fullGrossPay: 300,
        cSocial: 30,
        cFund: 10,
        wSocial: 20,
        wFund: 10,
        tax: 5,
        netPay: 255,
        absentDeduct: 2,
      }),
      buildPaySlip({
        type: "sales",
        companyShort: "AC",
        fullGrossPay: 400,
        cSocial: 40,
        cFund: 20,
        wSocial: 30,
        wFund: 20,
        tax: 8,
        netPay: 342,
        absentDeduct: 3,
      }),
    ];

    const result = aggregatePaySlips(salesOnlySlips);

    expect(result.sale).toEqual({
      fullGrossPay: 700,
      cSocial: 70,
      cFund: 30,
      wSocial: 50,
      wFund: 30,
      tax: 13,
      netPay: 597,
      absentDeduct: 5,
    });
    expect(result.manage).toEqual(ZERO_GROUP);
    expect(result.total).toEqual(result.sale);
  });
});
