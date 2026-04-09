import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";

import { generateVouchers } from "@/services/voucherGenerator";
import type { AggregateGroup, AggregateResult } from "@/types/payroll";

function buildAggregateResult(overrides?: {
  sale?: Partial<AggregateGroup>;
  manage?: Partial<AggregateGroup>;
}): AggregateResult {
  const defaultGroup: AggregateGroup = {
    fullGrossPay: 0,
    cSocial: 0,
    cFund: 0,
    wSocial: 0,
    wFund: 0,
    tax: 0,
    netPay: 0,
    absentDeduct: 0,
  };

  const sale: AggregateGroup = { ...defaultGroup, ...overrides?.sale };
  const manage: AggregateGroup = { ...defaultGroup, ...overrides?.manage };
  const total: AggregateGroup = {
    fullGrossPay: new Decimal(sale.fullGrossPay).plus(manage.fullGrossPay).toDecimalPlaces(2).toNumber(),
    cSocial: new Decimal(sale.cSocial).plus(manage.cSocial).toDecimalPlaces(2).toNumber(),
    cFund: new Decimal(sale.cFund).plus(manage.cFund).toDecimalPlaces(2).toNumber(),
    wSocial: new Decimal(sale.wSocial).plus(manage.wSocial).toDecimalPlaces(2).toNumber(),
    wFund: new Decimal(sale.wFund).plus(manage.wFund).toDecimalPlaces(2).toNumber(),
    tax: new Decimal(sale.tax).plus(manage.tax).toDecimalPlaces(2).toNumber(),
    netPay: new Decimal(sale.netPay).plus(manage.netPay).toDecimalPlaces(2).toNumber(),
    absentDeduct: new Decimal(sale.absentDeduct).plus(manage.absentDeduct).toDecimalPlaces(2).toNumber(),
  };

  return { sale, manage, total };
}

function getVoucher(result: ReturnType<typeof generateVouchers>, id: number) {
  return result.vouchers.find((voucher) => voucher.id === id);
}

function getEntry(
  result: ReturnType<typeof generateVouchers>,
  voucherId: number,
  direction: "debit" | "credit",
  account: string,
) {
  return getVoucher(result, voucherId)?.entries.find(
    (entry) => entry.direction === direction && entry.account === account,
  );
}

const MONTH = "2026-03";

const aggregateWithoutAbsence = buildAggregateResult({
  sale: {
    fullGrossPay: 20000,
    cSocial: 3000,
    cFund: 1000,
    wSocial: 1200,
    wFund: 450,
    tax: 300,
    netPay: 18050,
    absentDeduct: 0,
  },
  manage: {
    fullGrossPay: 10000,
    cSocial: 1500,
    cFund: 500,
    wSocial: 800,
    wFund: 300,
    tax: 200,
    netPay: 8700,
    absentDeduct: 0,
  },
});

const aggregateWithAbsence = buildAggregateResult({
  sale: {
    fullGrossPay: 20000,
    cSocial: 3000,
    cFund: 1000,
    wSocial: 1200,
    wFund: 450,
    tax: 300,
    netPay: 17850,
    absentDeduct: 200,
  },
  manage: {
    fullGrossPay: 10000,
    cSocial: 1500,
    cFund: 500,
    wSocial: 800,
    wFund: 300,
    tax: 200,
    netPay: 8600,
    absentDeduct: 100,
  },
});

describe("generateVouchers", () => {
  it("creates voucher 1 with sale and manage debit entries", () => {
    const result = generateVouchers(aggregateWithoutAbsence, MONTH);

    expect(getVoucher(result, 1)?.entries).toEqual(
      expect.arrayContaining([
        { direction: "debit", account: "销售费用-销售人员职工薪酬-人员工资", amount: 20000 },
        { direction: "debit", account: "销售费用-销售人员职工薪酬-社保（单位部分）", amount: 3000 },
        { direction: "debit", account: "销售费用-销售人员职工薪酬-公积金（单位部分）", amount: 1000 },
        { direction: "debit", account: "管理费用-管理人员职工薪酬-人员工资", amount: 10000 },
        { direction: "debit", account: "管理费用-管理人员职工薪酬-社保（单位部分）", amount: 1500 },
        { direction: "debit", account: "管理费用-管理人员职工薪酬-公积金（单位部分）", amount: 500 },
      ]),
    );
  });

  it("creates voucher 1 with total credit entries", () => {
    const result = generateVouchers(aggregateWithoutAbsence, MONTH);

    expect(getVoucher(result, 1)?.entries).toEqual(
      expect.arrayContaining([
        { direction: "credit", account: "应付职工薪酬-人员工资", amount: 30000 },
        { direction: "credit", account: "应付职工薪酬-社保（单位部分）", amount: 4500 },
        { direction: "credit", account: "应付职工薪酬-公积金（单位部分）", amount: 1500 },
      ]),
    );
  });

  it("creates voucher 1 personal deduction entries", () => {
    const result = generateVouchers(aggregateWithoutAbsence, MONTH);

    expect(getEntry(result, 1, "debit", "应付职工薪酬-人员工资")).toEqual({
      direction: "debit",
      account: "应付职工薪酬-人员工资",
      amount: 3250,
    });
    expect(getEntry(result, 1, "credit", "其他应收款-社保（个人部分）")).toEqual({
      direction: "credit",
      account: "其他应收款-社保（个人部分）",
      amount: 2000,
    });
    expect(getEntry(result, 1, "credit", "其他应收款-公积金（个人部分）")).toEqual({
      direction: "credit",
      account: "其他应收款-公积金（个人部分）",
      amount: 750,
    });
    expect(getEntry(result, 1, "credit", "应交税费-应交个人所得税")).toEqual({
      direction: "credit",
      account: "应交税费-应交个人所得税",
      amount: 500,
    });
  });

  it("marks voucher 1 as balanced", () => {
    const result = generateVouchers(aggregateWithoutAbsence, MONTH);

    expect(getVoucher(result, 1)).toMatchObject({
      debitTotal: 39250,
      creditTotal: 39250,
      balanced: true,
    });
  });

  it("creates voucher 2 for social insurance payment", () => {
    const result = generateVouchers(aggregateWithoutAbsence, MONTH);

    expect(getVoucher(result, 2)).toMatchObject({
      debitTotal: 6500,
      creditTotal: 6500,
      balanced: true,
    });
    expect(getVoucher(result, 2)?.entries).toEqual([
      { direction: "debit", account: "应付职工薪酬-社保（单位部分）", amount: 4500 },
      { direction: "debit", account: "其他应收款-社保（个人部分）", amount: 2000 },
      { direction: "credit", account: "银行存款", amount: 6500 },
    ]);
  });

  it("creates voucher 3 for housing fund payment", () => {
    const result = generateVouchers(aggregateWithoutAbsence, MONTH);

    expect(getVoucher(result, 3)).toMatchObject({
      debitTotal: 2250,
      creditTotal: 2250,
      balanced: true,
    });
    expect(getVoucher(result, 3)?.entries).toEqual([
      { direction: "debit", account: "应付职工薪酬-公积金（单位部分）", amount: 1500 },
      { direction: "debit", account: "其他应收款-公积金（个人部分）", amount: 750 },
      { direction: "credit", account: "银行存款", amount: 2250 },
    ]);
  });

  it("creates voucher 4 for income tax payment", () => {
    const result = generateVouchers(aggregateWithoutAbsence, MONTH);

    expect(getVoucher(result, 4)).toMatchObject({
      debitTotal: 500,
      creditTotal: 500,
      balanced: true,
    });
    expect(getVoucher(result, 4)?.entries).toEqual([
      { direction: "debit", account: "应交税费-应交个人所得税", amount: 500 },
      { direction: "credit", account: "银行存款", amount: 500 },
    ]);
  });

  it("creates voucher 5 with the net pay transfer", () => {
    const result = generateVouchers(aggregateWithoutAbsence, MONTH);

    expect(getVoucher(result, 5)).toMatchObject({
      debitTotal: 26750,
      creditTotal: 26750,
      balanced: true,
    });
    expect(getVoucher(result, 5)?.entries).toEqual([
      { direction: "debit", account: "应付职工薪酬-人员工资", amount: 26750 },
      { direction: "credit", account: "银行存款", amount: 26750 },
    ]);
  });

  it("creates voucher 5 absence deduction entries when absentDeduct is positive", () => {
    const result = generateVouchers(aggregateWithAbsence, MONTH);

    expect(getVoucher(result, 5)).toMatchObject({
      debitTotal: 26750,
      creditTotal: 26750,
      balanced: true,
    });
    expect(getVoucher(result, 5)?.entries).toEqual([
      { direction: "debit", account: "应付职工薪酬-人员工资", amount: 26450 },
      { direction: "credit", account: "银行存款", amount: 26450 },
      { direction: "debit", account: "应付职工薪酬-人员工资", amount: 300 },
      { direction: "credit", account: "营业外收入-违纪扣款", amount: 300 },
    ]);
  });

  it("omits voucher 5 absence deduction entries when absentDeduct is zero", () => {
    const result = generateVouchers(aggregateWithoutAbsence, MONTH);

    expect(getVoucher(result, 5)?.entries).not.toContainEqual({
      direction: "credit",
      account: "营业外收入-违纪扣款",
      amount: 0,
    });
    expect(getEntry(result, 5, "credit", "营业外收入-违纪扣款")).toBeUndefined();
  });

  it("omits voucher 4 when all voucher 4 amounts are zero", () => {
    const result = generateVouchers(
      buildAggregateResult({
        sale: {
          fullGrossPay: 20000,
          cSocial: 3000,
          cFund: 1000,
          wSocial: 1200,
          wFund: 450,
          tax: 0,
          netPay: 18350,
        },
        manage: {
          fullGrossPay: 10000,
          cSocial: 1500,
          cFund: 500,
          wSocial: 800,
          wFund: 300,
          tax: 0,
          netPay: 8900,
        },
      }),
      MONTH,
    );

    expect(getVoucher(result, 4)).toBeUndefined();
    expect(result.vouchers.map((voucher) => voucher.id)).toEqual([1, 2, 3, 5]);
  });

  it("returns a zero salary payable balance for the PRD balance rule", () => {
    const result = generateVouchers(aggregateWithAbsence, MONTH);

    expect(result.balanceCheck).toEqual({
      credit: 30000,
      debit: 30000,
      balance: 0,
      balanced: true,
    });
  });

  it("returns an empty voucher list for an all-zero aggregate", () => {
    const result = generateVouchers(buildAggregateResult(), MONTH);

    expect(result.month).toBe(MONTH);
    expect(result.vouchers).toEqual([]);
    expect(result.balanceCheck).toEqual({
      credit: 0,
      debit: 0,
      balance: 0,
      balanced: true,
    });
  });
});
