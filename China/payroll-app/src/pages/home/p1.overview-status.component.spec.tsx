import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import "@/i18n";
import { OverviewPage } from "@/pages/home/OverviewPage";

describe("P1 overview status copy", () => {
  it("shows delivered status for settings/employee/data cards", () => {
    render(
      <MemoryRouter>
        <OverviewPage />
      </MemoryRouter>,
    );

    const ready = screen.getAllByText("This module is delivered in P1 and ready to use.");
    const pending = screen.getAllByText("This module shell is ready and awaiting a later delivery phase.");

    expect(ready).toHaveLength(3);
    expect(pending).toHaveLength(2);
  });
});
