PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS _tmp_employee_id_map;
CREATE TEMP TABLE _tmp_employee_id_map (
  old_id TEXT PRIMARY KEY,
  new_id INTEGER NOT NULL UNIQUE
);

INSERT INTO _tmp_employee_id_map (old_id, new_id)
SELECT
  CAST(id AS TEXT) AS old_id,
  CAST(TRIM(CAST(id AS TEXT)) AS INTEGER) AS new_id
FROM employees
WHERE
  CAST(TRIM(CAST(id AS TEXT)) AS INTEGER) > 0
  AND TRIM(CAST(id AS TEXT)) = CAST(CAST(TRIM(CAST(id AS TEXT)) AS INTEGER) AS TEXT)
ORDER BY CAST(TRIM(CAST(id AS TEXT)) AS INTEGER);

INSERT INTO _tmp_employee_id_map (old_id, new_id)
SELECT
  CAST(e.id AS TEXT) AS old_id,
  (SELECT COALESCE(MAX(new_id), 0) FROM _tmp_employee_id_map)
    + ROW_NUMBER() OVER (ORDER BY e.rowid)
FROM employees e
WHERE CAST(e.id AS TEXT) NOT IN (SELECT old_id FROM _tmp_employee_id_map);

DROP TABLE IF EXISTS employees_new;
DROP TABLE IF EXISTS payroll_inputs_new;
DROP TABLE IF EXISTS payroll_results_new;

CREATE TABLE employees_new (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  id_number TEXT,
  company_id TEXT,
  department TEXT,
  position TEXT,
  employee_type TEXT NOT NULL,
  base_salary REAL NOT NULL DEFAULT 0,
  subsidy REAL NOT NULL DEFAULT 0,
  has_social INTEGER NOT NULL DEFAULT 0,
  has_local_pension INTEGER NOT NULL DEFAULT 0,
  fund_amount REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE payroll_inputs_new (
  id TEXT PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  payroll_month TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees_new(id)
);

CREATE TABLE payroll_results_new (
  id TEXT PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  payroll_month TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees_new(id)
);

INSERT INTO employees_new (
  id,
  name,
  id_number,
  company_id,
  department,
  position,
  employee_type,
  base_salary,
  subsidy,
  has_social,
  has_local_pension,
  fund_amount,
  created_at,
  updated_at
)
SELECT
  map.new_id,
  e.name,
  e.id_number,
  e.company_id,
  e.department,
  e.position,
  e.employee_type,
  e.base_salary,
  e.subsidy,
  e.has_social,
  e.has_local_pension,
  e.fund_amount,
  e.created_at,
  e.updated_at
FROM employees e
JOIN _tmp_employee_id_map map ON map.old_id = CAST(e.id AS TEXT);

INSERT INTO payroll_inputs_new (
  id,
  employee_id,
  payroll_month,
  payload,
  created_at,
  updated_at
)
SELECT
  p.id,
  map.new_id,
  p.payroll_month,
  p.payload,
  p.created_at,
  p.updated_at
FROM payroll_inputs p
JOIN _tmp_employee_id_map map ON map.old_id = CAST(p.employee_id AS TEXT);

INSERT INTO payroll_results_new (
  id,
  employee_id,
  payroll_month,
  payload,
  created_at,
  updated_at
)
SELECT
  p.id,
  map.new_id,
  p.payroll_month,
  p.payload,
  p.created_at,
  p.updated_at
FROM payroll_results p
JOIN _tmp_employee_id_map map ON map.old_id = CAST(p.employee_id AS TEXT);

DROP TABLE payroll_results;
DROP TABLE payroll_inputs;
DROP TABLE employees;

ALTER TABLE employees_new RENAME TO employees;
ALTER TABLE payroll_inputs_new RENAME TO payroll_inputs;
ALTER TABLE payroll_results_new RENAME TO payroll_results;

DROP TABLE IF EXISTS _tmp_employee_id_map;

PRAGMA foreign_keys = ON;
