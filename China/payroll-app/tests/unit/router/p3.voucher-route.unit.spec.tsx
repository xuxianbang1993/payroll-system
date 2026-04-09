import { describe, expect, it } from "vitest";

import { VoucherPage } from "@/pages/voucher/VoucherPage";
import { appRoutes } from "@/router/app-routes";

describe("voucher route", () => {
  it("wires /voucher to VoucherPage", () => {
    const route = appRoutes.find((item) => item.path === "/voucher");

    expect(route).toBeDefined();
    expect(route?.element.type).toBe(VoucherPage);
  });
});
