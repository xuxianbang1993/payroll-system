import type { TFunction } from "i18next";

/**
 * Resolves a message string that may be a simple i18n key or a composite "key|param" format.
 * If the message contains "|", splits it into key and reason parameter.
 */
export function resolveMessage(message: string, t: TFunction): string {
  if (!message) {
    return "";
  }

  const parts = message.split("|");
  if (parts.length === 2) {
    return t(parts[0], { reason: parts[1] });
  }

  return t(message);
}
