import { describe, expect, it } from "vitest";

import { navCategories } from "@/config/navigation";

describe("P0 navigation config", () => {
  it("contains required top-level categories", () => {
    const ids = navCategories.map((category) => category.id);
    expect(ids).toEqual(["settings", "employee", "payroll", "voucher", "data"]);
  });

  it("ensures each nav item has valid route and i18n key", () => {
    for (const category of navCategories) {
      for (const group of category.groups) {
        expect(group.items.length).toBeGreaterThan(0);

        for (const item of group.items) {
          expect(item.path.startsWith("/")).toBe(true);
          expect(item.titleKey.startsWith("nav.page.")).toBe(true);
        }
      }
    }
  });
});
