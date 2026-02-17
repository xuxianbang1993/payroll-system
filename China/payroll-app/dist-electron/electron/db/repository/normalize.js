export function asRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    return value;
}
export function asString(value, fallback = "") {
    if (typeof value === "string") {
        return value.trim();
    }
    if (value === null || value === undefined) {
        return fallback;
    }
    return String(value).trim();
}
export function asNumber(value, fallback = 0) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return fallback;
}
export function asBoolean(value, fallback = false) {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        return value !== 0;
    }
    if (typeof value === "string") {
        const lowered = value.trim().toLowerCase();
        if (["true", "1", "yes", "y"].includes(lowered)) {
            return true;
        }
        if (["false", "0", "no", "n"].includes(lowered)) {
            return false;
        }
    }
    return fallback;
}
export function asPositiveInteger(value) {
    const numberValue = asNumber(value, Number.NaN);
    if (!Number.isFinite(numberValue)) {
        return null;
    }
    const integer = Math.trunc(numberValue);
    if (integer <= 0 || numberValue !== integer) {
        return null;
    }
    return integer;
}
export function normalizeEmployeeType(raw) {
    const value = asString(raw);
    if (value === "销售" || value.toLowerCase() === "sales") {
        return "sales";
    }
    return "management";
}
export function resolveCompanyFullName(short, full) {
    if (full !== "") {
        return full;
    }
    return short;
}
//# sourceMappingURL=normalize.js.map