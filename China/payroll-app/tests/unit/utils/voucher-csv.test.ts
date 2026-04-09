import { describe, expect, it } from "vitest";

import type { VoucherSet } from "@/types/voucher";
import { voucherSetToCsv } from "@/utils/voucher-csv";

const SAMPLE_VOUCHER_SET: VoucherSet = {
  month: "2026-03",
  vouchers: [
    {
      id: 1,
      title: "2026-03 计提月工资",
      entries: [
        { direction: "debit", account: "销售费用-销售人员职工薪酬-人员工资", amount: 20000 },
        { direction: "credit", account: "应付职工薪酬-人员工资", amount: 20000 },
      ],
      debitTotal: 20000,
      creditTotal: 20000,
      balanced: true,
    },
    {
      id: 2,
      title: "2026-03 支付公积金",
      entries: [
        { direction: "debit", account: '管理费用,"特殊"科目', amount: 1500 },
        { direction: "credit", account: "银行存款", amount: 1500 },
      ],
      debitTotal: 1500,
      creditTotal: 1500,
      balanced: true,
    },
  ],
  balanceCheck: {
    credit: 21500,
    debit: 21500,
    balance: 0,
    balanced: true,
  },
};

describe("voucherSetToCsv", () => {
  it("prepends a UTF-8 BOM and writes the header row", () => {
    const csv = voucherSetToCsv(SAMPLE_VOUCHER_SET);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.split("\n")[0]).toBe("\uFEFF凭证序号,凭证标题,科目,借方金额,贷方金额");
  });

  it("places debit and credit amounts into the correct columns", () => {
    const csv = voucherSetToCsv(SAMPLE_VOUCHER_SET);
    const lines = csv.split("\n");

    expect(lines).toContain("1,2026-03 计提月工资,销售费用-销售人员职工薪酬-人员工资,20000.00,");
    expect(lines).toContain("1,2026-03 计提月工资,应付职工薪酬-人员工资,,20000.00");
  });

  it("adds a subtotal row after each voucher", () => {
    const csv = voucherSetToCsv(SAMPLE_VOUCHER_SET);
    const lines = csv.split("\n");

    expect(lines).toContain(",,合计,20000.00,20000.00");
    expect(lines).toContain(",,合计,1500.00,1500.00");
  });

  it("returns only the header row when the voucher set is empty", () => {
    const csv = voucherSetToCsv({
      month: "2026-03",
      vouchers: [],
      balanceCheck: {
        credit: 0,
        debit: 0,
        balance: 0,
        balanced: true,
      },
    });

    expect(csv).toBe("\uFEFF凭证序号,凭证标题,科目,借方金额,贷方金额");
  });

  it("escapes commas and quotes in CSV fields", () => {
    const csv = voucherSetToCsv(SAMPLE_VOUCHER_SET);

    expect(csv).toContain('2,2026-03 支付公积金,"管理费用,""特殊""科目",1500.00,');
  });
});
