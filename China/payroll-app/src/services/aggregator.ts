import Decimal from "decimal.js";

import type { AggregateGroup, AggregateResult, PaySlip } from "../types/payroll";

const AGGREGATE_FIELDS = [
  "fullGrossPay",
  "cSocial",
  "cFund",
  "wSocial",
  "wFund",
  "tax",
  "netPay",
  "absentDeduct",
] as const;

type AggregateField = (typeof AGGREGATE_FIELDS)[number];
type DecimalAggregateGroup = Record<AggregateField, Decimal>;

function createDecimalGroup(): DecimalAggregateGroup {
  return {
    fullGrossPay: new Decimal(0),
    cSocial: new Decimal(0),
    cFund: new Decimal(0),
    wSocial: new Decimal(0),
    wFund: new Decimal(0),
    tax: new Decimal(0),
    netPay: new Decimal(0),
    absentDeduct: new Decimal(0),
  };
}

function addSlip(group: DecimalAggregateGroup, slip: PaySlip): void {
  for (const field of AGGREGATE_FIELDS) {
    group[field] = group[field].plus(slip[field]);
  }
}

function roundGroup(group: DecimalAggregateGroup): AggregateGroup {
  return {
    fullGrossPay: group.fullGrossPay.toDecimalPlaces(2).toNumber(),
    cSocial: group.cSocial.toDecimalPlaces(2).toNumber(),
    cFund: group.cFund.toDecimalPlaces(2).toNumber(),
    wSocial: group.wSocial.toDecimalPlaces(2).toNumber(),
    wFund: group.wFund.toDecimalPlaces(2).toNumber(),
    tax: group.tax.toDecimalPlaces(2).toNumber(),
    netPay: group.netPay.toDecimalPlaces(2).toNumber(),
    absentDeduct: group.absentDeduct.toDecimalPlaces(2).toNumber(),
  };
}

export function aggregatePaySlips(
  slips: PaySlip[],
  filterCompany?: string,
): AggregateResult {
  const saleGroup = createDecimalGroup();
  const manageGroup = createDecimalGroup();
  const totalGroup = createDecimalGroup();

  for (const slip of slips) {
    if (filterCompany !== undefined && slip.companyShort !== filterCompany) {
      continue;
    }

    if (slip.type === "sales") {
      addSlip(saleGroup, slip);
    } else {
      addSlip(manageGroup, slip);
    }
    addSlip(totalGroup, slip);
  }

  return {
    sale: roundGroup(saleGroup),
    manage: roundGroup(manageGroup),
    total: roundGroup(totalGroup),
  };
}
