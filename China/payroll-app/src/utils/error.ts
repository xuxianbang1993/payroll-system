/**
 * Converts an unknown error value to a readable error message string.
 *
 * @param error - The error value to convert (typically from a catch block)
 * @returns A string representation of the error message
 */
export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
