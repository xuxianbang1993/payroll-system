import { expect, test } from "@playwright/test";

test("loads overview shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("薪酬管理系统")).toBeVisible();
  await expect(page.getByRole("link", { name: "概览" })).toBeVisible();
});
