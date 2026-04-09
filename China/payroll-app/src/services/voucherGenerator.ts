import Decimal from "decimal.js";

import type { AggregateResult } from "../types/payroll";
import type { SalaryPayableBalance, Voucher, VoucherEntry, VoucherSet } from "../types/voucher";

function sumAmounts(...amounts: number[]): number {
  return amounts
    .reduce((sum, amount) => sum.plus(amount), new Decimal(0))
    .toDecimalPlaces(2)
    .toNumber();
}

function buildVoucher(id: number, title: string, rawEntries: VoucherEntry[]): Voucher | null {
  const entries = rawEntries.filter((entry) => new Decimal(entry.amount).gt(0));

  if (entries.length === 0) {
    return null;
  }

  const debitTotal = entries
    .filter((entry) => entry.direction === "debit")
    .reduce((sum, entry) => sum.plus(entry.amount), new Decimal(0))
    .toDecimalPlaces(2)
    .toNumber();

  const creditTotal = entries
    .filter((entry) => entry.direction === "credit")
    .reduce((sum, entry) => sum.plus(entry.amount), new Decimal(0))
    .toDecimalPlaces(2)
    .toNumber();

  const balanced = new Decimal(debitTotal).minus(creditTotal).abs().lt(0.01);

  return {
    id,
    title,
    entries,
    debitTotal,
    creditTotal,
    balanced,
  };
}

function buildTitle(month: string, voucherName: string): string {
  return `${month} ${voucherName}`;
}

export function generateVoucher1(agg: AggregateResult, month: string): Voucher | null {
  const deductionTotal = sumAmounts(agg.total.wSocial, agg.total.wFund, agg.total.tax);

  return buildVoucher(1, buildTitle(month, "计提月工资"), [
    { direction: "debit", account: "销售费用-销售人员职工薪酬-人员工资", amount: agg.sale.fullGrossPay },
    { direction: "debit", account: "销售费用-销售人员职工薪酬-社保（单位部分）", amount: agg.sale.cSocial },
    { direction: "debit", account: "销售费用-销售人员职工薪酬-公积金（单位部分）", amount: agg.sale.cFund },
    { direction: "debit", account: "管理费用-管理人员职工薪酬-人员工资", amount: agg.manage.fullGrossPay },
    { direction: "debit", account: "管理费用-管理人员职工薪酬-社保（单位部分）", amount: agg.manage.cSocial },
    { direction: "debit", account: "管理费用-管理人员职工薪酬-公积金（单位部分）", amount: agg.manage.cFund },
    { direction: "credit", account: "应付职工薪酬-人员工资", amount: agg.total.fullGrossPay },
    { direction: "credit", account: "应付职工薪酬-社保（单位部分）", amount: agg.total.cSocial },
    { direction: "credit", account: "应付职工薪酬-公积金（单位部分）", amount: agg.total.cFund },
    { direction: "debit", account: "应付职工薪酬-人员工资", amount: deductionTotal },
    { direction: "credit", account: "其他应收款-社保（个人部分）", amount: agg.total.wSocial },
    { direction: "credit", account: "其他应收款-公积金（个人部分）", amount: agg.total.wFund },
    { direction: "credit", account: "应交税费-应交个人所得税", amount: agg.total.tax },
  ]);
}

export function generateVoucher2(agg: AggregateResult, month: string): Voucher | null {
  const bankAmount = sumAmounts(agg.total.cSocial, agg.total.wSocial);

  return buildVoucher(2, buildTitle(month, "缴纳社保"), [
    { direction: "debit", account: "应付职工薪酬-社保（单位部分）", amount: agg.total.cSocial },
    { direction: "debit", account: "其他应收款-社保（个人部分）", amount: agg.total.wSocial },
    { direction: "credit", account: "银行存款", amount: bankAmount },
  ]);
}

export function generateVoucher3(agg: AggregateResult, month: string): Voucher | null {
  const bankAmount = sumAmounts(agg.total.cFund, agg.total.wFund);

  return buildVoucher(3, buildTitle(month, "支付公积金"), [
    { direction: "debit", account: "应付职工薪酬-公积金（单位部分）", amount: agg.total.cFund },
    { direction: "debit", account: "其他应收款-公积金（个人部分）", amount: agg.total.wFund },
    { direction: "credit", account: "银行存款", amount: bankAmount },
  ]);
}

export function generateVoucher4(agg: AggregateResult, month: string): Voucher | null {
  return buildVoucher(4, buildTitle(month, "缴纳个税"), [
    { direction: "debit", account: "应交税费-应交个人所得税", amount: agg.total.tax },
    { direction: "credit", account: "银行存款", amount: agg.total.tax },
  ]);
}

export function generateVoucher5(agg: AggregateResult, month: string): Voucher | null {
  const rawEntries: VoucherEntry[] = [
    { direction: "debit", account: "应付职工薪酬-人员工资", amount: agg.total.netPay },
    { direction: "credit", account: "银行存款", amount: agg.total.netPay },
  ];

  if (new Decimal(agg.total.absentDeduct).gt(0)) {
    rawEntries.push(
      { direction: "debit", account: "应付职工薪酬-人员工资", amount: agg.total.absentDeduct },
      { direction: "credit", account: "营业外收入-违纪扣款", amount: agg.total.absentDeduct },
    );
  }

  return buildVoucher(5, buildTitle(month, "发放工资"), rawEntries);
}

function buildSalaryPayableBalance(agg: AggregateResult): SalaryPayableBalance {
  const credit = new Decimal(agg.total.fullGrossPay).toDecimalPlaces(2);
  const debit = new Decimal(sumAmounts(agg.total.wSocial, agg.total.wFund, agg.total.tax, agg.total.netPay, agg.total.absentDeduct));
  const balance = credit.minus(debit).toDecimalPlaces(2);

  return {
    credit: credit.toNumber(),
    debit: debit.toNumber(),
    balance: balance.toNumber(),
    balanced: balance.abs().lt(0.01),
  };
}

export function generateVouchers(agg: AggregateResult, month: string): VoucherSet {
  const vouchers = [
    generateVoucher1(agg, month),
    generateVoucher2(agg, month),
    generateVoucher3(agg, month),
    generateVoucher4(agg, month),
    generateVoucher5(agg, month),
  ].filter((voucher): voucher is Voucher => voucher !== null);

  return {
    month,
    vouchers,
    balanceCheck: buildSalaryPayableBalance(agg),
  };
}
