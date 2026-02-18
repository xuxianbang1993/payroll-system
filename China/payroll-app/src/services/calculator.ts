import Decimal from "decimal.js";

import type { Employee, PayrollInput, PaySlip, SocialConfig } from "../types/payroll";

const WORK_DAYS_PER_MONTH = new Decimal(21.75);
const WORK_HOURS_PER_DAY = new Decimal(8);

function asDecimal(value?: number): Decimal {
  return new Decimal(value ?? 0);
}

function round2(value: Decimal): number {
  return value.toDecimalPlaces(2).toNumber();
}

function sumRound2(values: number[]): number {
  return round2(values.reduce((acc, value) => acc.plus(value), new Decimal(0)));
}

function percentAmount(base: number, rate: number): number {
  return new Decimal(base).mul(rate).div(100).toDecimalPlaces(2).toNumber();
}

export function calculatePaySlip(
  employee: Employee,
  input: PayrollInput,
  social: SocialConfig,
): PaySlip {
  const perfSalary = round2(asDecimal(input.perfSalary));
  const commission = round2(asDecimal(input.commission));
  const bonus = round2(asDecimal(input.bonus));
  const otherAdj = round2(asDecimal(input.otherAdj));
  const absentH = asDecimal(input.absentHours).toNumber();
  const tax = round2(asDecimal(input.tax));
  const perfGrade = input.perfGrade ?? "";

  const base = round2(asDecimal(employee.baseSalary).plus(employee.subsidy));
  const totalPerf = sumRound2([perfSalary, commission, bonus]);
  const fullGrossPay = sumRound2([base, totalPerf, otherAdj]);

  const hourlyRate = round2(new Decimal(base).div(WORK_DAYS_PER_MONTH).div(WORK_HOURS_PER_DAY));
  const absentDeduct = round2(new Decimal(absentH).mul(hourlyRate));
  const grossPay = round2(new Decimal(fullGrossPay).minus(absentDeduct));

  const cPension = employee.hasSocial ? percentAmount(social.pensionBase, social.compPension) : 0;
  const cLocalPension =
    employee.hasSocial && employee.hasLocalPension
      ? percentAmount(social.pensionBase, social.compLocalPension)
      : 0;
  const cUnemploy = employee.hasSocial ? percentAmount(social.unemploymentBase, social.compUnemploy) : 0;
  const cMedical = employee.hasSocial ? percentAmount(social.medicalBase, social.compMedical) : 0;
  const cInjury = employee.hasSocial ? percentAmount(social.injuryBase, social.compInjury) : 0;
  const cMaternity = employee.hasSocial ? percentAmount(social.maternityBase, social.compMaternity) : 0;
  const cSocial = sumRound2([cPension, cLocalPension, cUnemploy, cMedical, cInjury, cMaternity]);

  const cFund = round2(asDecimal(employee.fundAmount));
  const cTotal = sumRound2([cSocial, cFund]);

  const wPension = employee.hasSocial ? percentAmount(social.pensionBase, social.workerPension) : 0;
  const wUnemploy = employee.hasSocial ? percentAmount(social.unemploymentBase, social.workerUnemploy) : 0;
  const wMedical = employee.hasSocial ? percentAmount(social.medicalBase, social.workerMedical) : 0;
  const wSocial = sumRound2([wPension, wUnemploy, wMedical]);
  const wFund = round2(asDecimal(employee.fundAmount));

  const totalDeduct = sumRound2([wSocial, wFund, tax]);
  const netPay = round2(new Decimal(grossPay).minus(totalDeduct));

  return {
    base,
    perfSalary,
    commission,
    bonus,
    totalPerf,
    otherAdj,
    fullGrossPay,
    absentH,
    absentDeduct,
    grossPay,
    cPension,
    cLocalPension,
    cUnemploy,
    cMedical,
    cInjury,
    cMaternity,
    cSocial,
    cFund,
    cTotal,
    wPension,
    wUnemploy,
    wMedical,
    wSocial,
    wFund,
    tax,
    totalDeduct,
    netPay,
    hourlyRate,
    perfGrade,
    type: employee.type,
    companyShort: employee.companyShort,
  };
}
