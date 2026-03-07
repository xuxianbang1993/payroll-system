import Decimal from "decimal.js";

export { Decimal };

export function D(value: Decimal.Value = 0): Decimal {
  return new Decimal(value);
}
