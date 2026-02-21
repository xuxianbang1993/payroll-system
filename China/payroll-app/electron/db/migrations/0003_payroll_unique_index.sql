-- Migration: 0003_payroll_unique_index.sql
-- Purpose: Add UNIQUE constraint on (employee_id, payroll_month) for payroll tables.
-- This prevents duplicate entries for the same employee in the same month and
-- enables the upsert pattern (INSERT ... ON CONFLICT ... DO UPDATE) in application code.

-- Before creating the unique index, remove any duplicate rows that may already exist.
-- Keep only the most recently updated row for each (employee_id, payroll_month) pair.

DELETE FROM payroll_inputs
WHERE rowid NOT IN (
  SELECT MAX(rowid)
  FROM payroll_inputs
  GROUP BY employee_id, payroll_month
);

DELETE FROM payroll_results
WHERE rowid NOT IN (
  SELECT MAX(rowid)
  FROM payroll_results
  GROUP BY employee_id, payroll_month
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payroll_inputs_employee_month
  ON payroll_inputs (employee_id, payroll_month);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payroll_results_employee_month
  ON payroll_results (employee_id, payroll_month);
