import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import "@/i18n";
import { AppLayout } from "@/layouts/AppLayout";
import { useAppStore } from "@/stores/app-store";

describe("P0 layout navigation", () => {
  beforeEach(() => {
    if (window.localStorage && typeof window.localStorage.clear === "function") {
      window.localStorage.clear();
    }
    useAppStore.setState({
      language: "zh-CN",
      navPanelOpen: false,
      selectedMonth: "2026-02",
    });
  });

  it("shows month picker on routes with showMonthPicker flag", () => {
    render(
      <MemoryRouter initialEntries={["/voucher"]}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route path="voucher" element={<div>Voucher Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // Voucher route has showMonthPicker=true; payroll pages manage their own MonthPicker
    expect(screen.getByDisplayValue("2026-02")).toBeInTheDocument();
  });

  it("opens panel after clicking menu button", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<div>Overview</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByLabelText(/Menu|菜单/));
    expect(screen.getByText(/System|系统/, { selector: "p" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Settings|基础设置/ })).toBeInTheDocument();
  });
});
