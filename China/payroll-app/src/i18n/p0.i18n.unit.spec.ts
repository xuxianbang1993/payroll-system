import { describe, expect, it } from "vitest";

import i18n from "@/i18n";

describe("P0 i18n", () => {
  it("switches among zh-CN, zh-HK and en with correct app name", async () => {
    await i18n.changeLanguage("zh-CN");
    expect(i18n.t("app.name")).toBe("薪酬管理系统");

    await i18n.changeLanguage("zh-HK");
    expect(i18n.t("app.name")).toBe("薪酬管理系統");

    await i18n.changeLanguage("en");
    expect(i18n.t("app.name")).toBe("Payroll Management System");
  });
});
