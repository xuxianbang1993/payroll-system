import { expect, test } from "@playwright/test";

const VOUCHER_TITLE = "凭证总览";
const BALANCE_CHECK = "余额校验";
const FILTER_ALL = "全部公司";
const EMPTY_STATE_TEXT = "当前月份暂无工资数据，请先在薪资核算模块生成工资条";
const POSSIBLE_VOUCHER_TITLES = ["计提月工资", "缴纳社保", "支付公积金", "缴纳个税", "发放工资"];

test.describe("voucher module flow", () => {
  test("voucher page loads with balance check card", async ({ page }) => {
    await page.goto("/voucher");
    await expect(page.getByText(VOUCHER_TITLE)).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText(BALANCE_CHECK)).toBeVisible();
    await expect(page.getByRole("combobox")).toBeVisible();
    await expect(page.getByText(FILTER_ALL).first()).toBeVisible();
  });

  test("shows empty state when no payroll data", async ({ page }) => {
    await page.goto("/voucher");
    await expect(page.getByText(VOUCHER_TITLE)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(EMPTY_STATE_TEXT)).toBeVisible();
  });

  test("displays voucher cards when payroll data exists or stays in empty state", async ({ page }) => {
    await page.goto("/voucher");
    await expect(page.getByText(VOUCHER_TITLE)).toBeVisible({ timeout: 10_000 });

    const emptyState = page.getByText(EMPTY_STATE_TEXT);
    const voucherCards = page
      .locator("[data-slot='card']")
      .filter({ hasText: new RegExp(POSSIBLE_VOUCHER_TITLES.join("|")) });

    await expect
      .poll(
        async () => {
          if ((await emptyState.count()) > 0 && (await emptyState.first().isVisible())) {
            return "empty";
          }
          if ((await voucherCards.count()) > 0 && (await voucherCards.first().isVisible())) {
            return "vouchers";
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

    await expect(voucherCards.first()).toBeVisible();
  });

  test("company filter selector is functional", async ({ page }) => {
    await page.goto("/voucher");
    await expect(page.getByText(VOUCHER_TITLE)).toBeVisible({ timeout: 10_000 });

    const filter = page.getByRole("combobox");
    await expect(filter).toBeVisible();
    await expect(page.getByText(FILTER_ALL).first()).toBeVisible();

    await filter.click();
    await expect(page.locator("[data-slot='select-content']")).toBeVisible();
    await expect(page.getByText(FILTER_ALL).first()).toBeVisible();
  });
});
