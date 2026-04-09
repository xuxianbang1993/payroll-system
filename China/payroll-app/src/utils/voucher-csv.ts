import type { VoucherSet } from "@/types/voucher";

const UTF8_BOM = "\uFEFF";
const HEADER = "凭证序号,凭证标题,科目,借方金额,贷方金额";

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function formatAmount(value: number | null): string {
  if (value === null) {
    return "";
  }

  return value.toFixed(2);
}

export function voucherSetToCsv(voucherSet: VoucherSet): string {
  const rows: string[] = [HEADER];

  for (const voucher of voucherSet.vouchers) {
    for (const entry of voucher.entries) {
      rows.push(
        [
          voucher.id.toString(),
          escapeCsvField(voucher.title),
          escapeCsvField(entry.account),
          formatAmount(entry.direction === "debit" ? entry.amount : null),
          formatAmount(entry.direction === "credit" ? entry.amount : null),
        ].join(","),
      );
    }

    rows.push(["", "", "合计", voucher.debitTotal.toFixed(2), voucher.creditTotal.toFixed(2)].join(","));
  }

  return `${UTF8_BOM}${rows.join("\n")}`;
}
