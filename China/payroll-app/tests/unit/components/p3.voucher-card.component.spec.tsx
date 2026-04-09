import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import "@/i18n";
import i18n from "@/i18n";
import { VoucherCard } from "@/components/VoucherCard";
import type { Voucher } from "@/types/voucher";

const BALANCED_VOUCHER: Voucher = {
  id: 1,
  title: "2026-03 计提月工资",
  entries: [
    { direction: "debit", account: "销售费用-销售人员职工薪酬-人员工资", amount: 20000 },
    { direction: "credit", account: "应付职工薪酬-人员工资", amount: 20000 },
  ],
  debitTotal: 20000,
  creditTotal: 20000,
  balanced: true,
};

describe("VoucherCard", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders voucher entries and totals in debit and credit columns", () => {
    render(<VoucherCard voucher={BALANCED_VOUCHER} />);

    expect(screen.getByText("2026-03 计提月工资")).toBeInTheDocument();
    expect(screen.getByText("Balanced")).toBeInTheDocument();
    expect(screen.getByText("Debit")).toBeInTheDocument();
    expect(screen.getByText("Credit")).toBeInTheDocument();
    expect(screen.getByText("销售费用-销售人员职工薪酬-人员工资")).toBeInTheDocument();
    expect(screen.getByText("应付职工薪酬-人员工资")).toBeInTheDocument();
    expect(screen.getAllByText("20,000.00")).toHaveLength(4);
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("shows unbalanced badge text for an unbalanced voucher", () => {
    render(
      <VoucherCard
        voucher={{
          ...BALANCED_VOUCHER,
          creditTotal: 19999,
          balanced: false,
        }}
      />,
    );

    expect(screen.getByText("Unbalanced")).toBeInTheDocument();
  });
});
