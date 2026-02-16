/**
 * Type guard that checks if a value is a plain object (Record).
 * Returns null if the value is not a plain object.
 *
 * @param value - The value to check
 * @returns The value cast as Record<string, unknown> if valid, null otherwise
 */
export function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

/**
 * Alias for asObject. Type guard for plain objects.
 *
 * @param value - The value to check
 * @returns The value cast as Record<string, unknown> if valid, null otherwise
 */
export function asRecord(value: unknown): Record<string, unknown> | null {
  return asObject(value);
}
