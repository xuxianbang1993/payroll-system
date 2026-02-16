/**
 * Formats a number as a currency amount with 2 decimal places.
 *
 * @param value - The numeric value to format
 * @returns A locale-formatted string with 2 decimal places
 */
export function formatAmount(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Alias for formatAmount. Formats a number as currency.
 *
 * @param value - The numeric value to format
 * @returns A locale-formatted string with 2 decimal places
 */
export function formatCurrency(value: number): string {
  return formatAmount(value);
}

/**
 * Formats a byte count into a human-readable string (B, KB, or MB).
 *
 * @param bytes - The number of bytes to format
 * @returns A formatted string with appropriate unit
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Parses a string value to a number, returning a fallback if invalid.
 *
 * @param value - The string value to parse
 * @param fallback - The fallback value to return if parsing fails
 * @returns The parsed number or the fallback value
 */
export function parseNumber(value: string, fallback: number): number {
  if (value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

/**
 * Alias for parseNumber. Converts a string to a number with fallback.
 *
 * @param value - The string value to convert
 * @param fallback - The fallback value to return if conversion fails
 * @returns The converted number or the fallback value
 */
export function toNumber(value: string, fallback: number): number {
  return parseNumber(value, fallback);
}
