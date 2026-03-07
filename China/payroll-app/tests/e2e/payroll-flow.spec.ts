import { expect, test } from "@playwright/test";

const TITLE_BY_EMPLOYEE = "按员工录入";
const TITLE_DETAIL = "全员明细表";
const EMPTY_EMPLOYEE_TEXT = "未找到员工，请先在员工列表中维护员工数据。";
const GENERATE_ALL = "全部生成";
const PREV_MONTH = "上一月";
const NEXT_MONTH = "下一月";

test.describe("payroll module flow", () => {
  test("payroll page loads with month picker and stats", async ({ page }) => {
    await page.goto("/payroll/employee");
    await expect(page.getByText(TITLE_BY_EMPLOYEE)).toBeVisible({ timeout: 10_000 });

    await expect(page.getByRole("button", { name: PREV_MONTH })).toBeVisible();
    await expect(page.getByRole("button", { name: NEXT_MONTH })).toBeVisible();

    await expect(page.getByText("员工人数")).toBeVisible();
    await expect(page.getByText("应发工资合计")).toBeVisible();
    await expect(page.getByText("实发工资合计")).toBeVisible();
    await expect(page.getByText("单位社保合计")).toBeVisible();

    await expect(page.getByRole("button", { name: GENERATE_ALL })).toBeVisible();
  });

  test("detail table page loads with 28-column header", async ({ page }) => {
    await page.goto("/payroll/detail");
    await expect(page.getByText(TITLE_DETAIL)).toBeVisible({ timeout: 10_000 });

    const emptyState = page.getByText(EMPTY_EMPLOYEE_TEXT);
    const table = page.locator("table");

    await expect
      .poll(
        async () => {
          if ((await emptyState.count()) > 0 && (await emptyState.first().isVisible())) {
            return "empty";
          }
          if ((await table.count()) > 0 && (await table.first().isVisible())) {
            return "table";
          }
          return "loading";
        },
        { timeout: 10_000 },
      )
      .not.toBe("loading");

    if ((await emptyState.count()) > 0 && (await emptyState.first().isVisible())) {
      await expect(emptyState).toBeVisible();
      return;
    }

    for (const header of ["基本信息", "收入", "工资汇总", "单位承担", "个人扣除", "最终"]) {
      await expect(page.locator("th", { hasText: header }).first()).toBeVisible();
    }

    await expect(page.locator("tbody tr", { hasText: "全员合计" })).toBeVisible();
  });

  test("month picker navigation works", async ({ page }) => {
    await page.goto("/payroll/employee");
    await expect(page.getByText(TITLE_BY_EMPLOYEE)).toBeVisible({ timeout: 10_000 });

    const prevMonthButton = page.getByRole("button", { name: PREV_MONTH });
    const nextMonthButton = page.getByRole("button", { name: NEXT_MONTH });
    const monthDisplay = page.locator("span").filter({ hasText: /^\d{4}年\d{2}月$/ }).first();

    await expect(prevMonthButton).toBeEnabled({ timeout: 10_000 });
    await expect(monthDisplay).toBeVisible();

    const initialMonth = (await monthDisplay.textContent())?.trim();
    expect(initialMonth).toBeTruthy();

    await prevMonthButton.click();
    await expect(monthDisplay).not.toHaveText(initialMonth as string);

    await expect(nextMonthButton).toBeEnabled({ timeout: 10_000 });
    await nextMonthButton.click();
    await expect(monthDisplay).toHaveText(initialMonth as string);
  });

  test("generate all button state", async ({ page }) => {
    await page.goto("/payroll/employee");
    await expect(page.getByText(TITLE_BY_EMPLOYEE)).toBeVisible({ timeout: 10_000 });

    const prevMonthButton = page.getByRole("button", { name: PREV_MONTH });
    const generateAllButton = page.getByRole("button", { name: GENERATE_ALL });
    const emptyState = page.getByText(EMPTY_EMPLOYEE_TEXT);

    await expect(generateAllButton).toBeVisible();
    await expect(prevMonthButton).toBeEnabled({ timeout: 10_000 });

    if ((await emptyState.count()) > 0 && (await emptyState.first().isVisible())) {
      await expect(generateAllButton).toBeDisabled();
      return;
    }

    await expect(generateAllButton).toBeEnabled();
  });
});
