import fs from "node:fs";
import path from "node:path";
import xlsx from "xlsx";

const appDir = process.cwd();
const chinaDir = path.resolve(appDir, "..");
const testDir = path.join(chinaDir, "test");
const rawDir = path.join(testDir, "06-reports", "raw");

const vitestFile = path.join(rawDir, "vitest-p0.json");
const playwrightFile = path.join(rawDir, "playwright-p0.json");
const casesFile = path.join(testDir, "00-governance", "p0-test-cases.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseVitest(json) {
  const rows = [];

  const files = Array.isArray(json.testResults) ? json.testResults : [];
  for (const file of files) {
    const assertions = Array.isArray(file.assertionResults) ? file.assertionResults : [];
    for (const assertion of assertions) {
      rows.push({
        runner: "vitest",
        file: file.name,
        title: assertion.fullName ?? assertion.title,
        status: assertion.status,
        durationMs: assertion.duration ?? 0,
      });
    }
  }

  return rows;
}

function collectPlaywrightSpecRows(spec, suiteTitle, rows) {
  const specTitle = [suiteTitle, spec.title].filter(Boolean).join(" :: ");

  for (const test of spec.tests ?? []) {
    const lastResult = (test.results ?? [])[test.results.length - 1] ?? {};
    rows.push({
      runner: "playwright",
      file: spec.file,
      title: specTitle,
      status: lastResult.status ?? "unknown",
      durationMs: lastResult.duration ?? 0,
    });
  }
}

function walkPlaywrightSuites(suites, parentTitle = "", rows = []) {
  for (const suite of suites ?? []) {
    const title = [parentTitle, suite.title].filter(Boolean).join(" / ");

    for (const spec of suite.specs ?? []) {
      collectPlaywrightSpecRows(spec, title, rows);
    }

    walkPlaywrightSuites(suite.suites, title, rows);
  }

  return rows;
}

function parsePlaywright(json) {
  return walkPlaywrightSuites(json.suites);
}

function normalizeStatus(status) {
  if (status === "passed" || status === "ok" || status === "expected") {
    return "passed";
  }
  if (status === "failed" || status === "unexpected") {
    return "failed";
  }
  return String(status ?? "unknown");
}

function createSummaryRows(actualRows) {
  const total = actualRows.length;
  const passed = actualRows.filter((row) => normalizeStatus(row.status) === "passed").length;
  const failed = actualRows.filter((row) => normalizeStatus(row.status) === "failed").length;
  const passRate = total > 0 ? `${((passed / total) * 100).toFixed(2)}%` : "0.00%";

  return [
    { key: "generatedAt", value: new Date().toISOString() },
    { key: "total", value: total },
    { key: "passed", value: passed },
    { key: "failed", value: failed },
    { key: "passRate", value: passRate },
  ];
}

function createObjectiveRows(caseCatalog, actualRows) {
  return caseCatalog.map((tc) => {
    const sourceBase = path.basename(tc.sourceFile);
    const actual = actualRows.find(
      (row) =>
        (row.file.endsWith(tc.sourceFile) || row.file === sourceBase || row.file.endsWith(sourceBase)) &&
        row.title.includes(tc.testTitleContains),
    );

    return {
      caseId: tc.caseId,
      phase: tc.phase,
      module: tc.module,
      scope: tc.scope,
      sourceFile: tc.sourceFile,
      idealOutput: tc.idealOutput,
      expectedStatus: tc.expectedStatus,
      actualStatus: actual ? normalizeStatus(actual.status) : "not-found",
      durationMs: actual?.durationMs ?? "",
      matchedTestTitle: actual?.title ?? "",
      objectiveResult: actual
        ? normalizeStatus(actual.status) === tc.expectedStatus
          ? "match"
          : "mismatch"
        : "no-evidence",
    };
  });
}

const vitestJson = readJson(vitestFile);
const playwrightJson = readJson(playwrightFile);
const caseCatalog = readJson(casesFile);

const vitestRows = parseVitest(vitestJson);
const playwrightRows = parsePlaywright(playwrightJson);
const actualRows = [...vitestRows, ...playwrightRows];

const wb = xlsx.utils.book_new();

xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(createSummaryRows(actualRows)), "Summary");
xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(caseCatalog), "IdealCases");
xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(vitestRows), "ActualVitest");
xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(playwrightRows), "ActualPlaywright");
xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(createObjectiveRows(caseCatalog, actualRows)), "ObjectiveResult");

const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "_").slice(0, 15);
const output = path.join(testDir, "06-reports", `p0-test-report-${stamp}.xlsx`);

xlsx.writeFile(wb, output);
console.log(output);
