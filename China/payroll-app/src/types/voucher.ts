export type EntryDirection = "debit" | "credit";

export interface VoucherEntry {
  direction: EntryDirection;
  account: string;
  amount: number;
}

export interface Voucher {
  id: number;
  title: string;
  entries: VoucherEntry[];
  debitTotal: number;
  creditTotal: number;
  balanced: boolean;
}

export interface SalaryPayableBalance {
  credit: number;
  debit: number;
  balance: number;
  balanced: boolean;
}

export interface VoucherSet {
  month: string;
  vouchers: Voucher[];
  balanceCheck: SalaryPayableBalance;
}
