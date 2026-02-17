import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/i18n";
import { EmployeeForm } from "@/components/EmployeeForm";
import { createEmptyForm } from "@/utils/employee-utils";
import type { EmployeeFormModel } from "@/types/payroll";

describe("P1 employee form component", () => {
  const defaultProps = () => ({
    open: true,
    onOpenChange: vi.fn(),
    formData: createEmptyForm(),
    onFieldChange: vi.fn(),
    onFormChange: vi.fn(),
    onSubmit: vi.fn(),
    companyOptions: [
      { short: "AC", full: "Acme Co" },
      { short: "BC", full: "Beta Corp" },
    ],
    resolveCompanyFullName: (short: string) => (short === "AC" ? "Acme Co" : "Beta Corp"),
    saving: false,
  });

  it("renders all form fields with default values", () => {
    const props = defaultProps();

    render(<EmployeeForm {...props} />);

    expect(screen.getByText("Add Employee")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("ID Number")).toBeInTheDocument();
    expect(screen.getByText("Department")).toBeInTheDocument();
    expect(screen.getByText("Position")).toBeInTheDocument();
    expect(screen.getByText("Base Salary")).toBeInTheDocument();
    expect(screen.getByText("Subsidy")).toBeInTheDocument();
    expect(screen.getByText("Housing Fund Amount")).toBeInTheDocument();
  });

  it("calls onFieldChange when typing into name field", async () => {
    const user = userEvent.setup();
    const props = defaultProps();

    render(<EmployeeForm {...props} />);

    const nameInputs = screen.getAllByRole("textbox");
    // Name is the first text input
    const nameInput = nameInputs[0]!;
    await user.type(nameInput, "A");

    expect(props.onFieldChange).toHaveBeenCalledWith("name", "A");
  });

  it("calls onSubmit when Add button is clicked", async () => {
    const user = userEvent.setup();
    const props = defaultProps();

    render(<EmployeeForm {...props} />);

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(props.onSubmit).toHaveBeenCalled();
  });

  it("disables buttons when saving is true", () => {
    const props = defaultProps();
    props.saving = true;

    render(<EmployeeForm {...props} />);

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("unchecking social insurance also disables local pension", async () => {
    const user = userEvent.setup();
    const props = defaultProps();
    props.formData.hasSocial = true;
    props.formData.hasLocalPension = true;

    render(<EmployeeForm {...props} />);

    const checkboxes = screen.getAllByRole("checkbox");
    // First checkbox is hasSocial, second is hasLocalPension
    const socialCheckbox = checkboxes[0]!;

    await user.click(socialCheckbox);

    // onFormChange should be called with hasSocial=false and hasLocalPension=false
    expect(props.onFormChange).toHaveBeenCalledWith(
      expect.objectContaining({
        hasSocial: false,
        hasLocalPension: false,
      }),
    );
  });

  it("renders with pre-filled form data", () => {
    const props = defaultProps();
    const filledForm: EmployeeFormModel = {
      name: "Alice",
      idCard: "110101199001011234",
      companyShort: "AC",
      company: "Acme Co",
      dept: "HR",
      position: "Manager",
      type: "management",
      baseSalary: 10000,
      subsidy: 500,
      hasSocial: true,
      hasLocalPension: true,
      fundAmount: 300,
    };
    props.formData = filledForm;

    render(<EmployeeForm {...props} />);

    expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
    expect(screen.getByDisplayValue("110101199001011234")).toBeInTheDocument();
    expect(screen.getByDisplayValue("HR")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Manager")).toBeInTheDocument();
    expect(screen.getByDisplayValue("10000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("500")).toBeInTheDocument();
    expect(screen.getByDisplayValue("300")).toBeInTheDocument();
  });
});
