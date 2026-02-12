import fs from "node:fs";
import path from "node:path";

const appDir = process.cwd();
const chinaDir = path.resolve(appDir, "..");
const testDir = path.join(chinaDir, "test");
const rawDir = path.join(testDir, "06-reports", "raw");

const vitestFile = path.join(rawDir, "vitest-p1-repository.json");
const playwrightFile = path.join(rawDir, "playwright-p1-db-isolation.json");
const casesFile = path.join(testDir, "00-governance", "p1-test-cases.json");
const outFile = path.join(rawDir, "p1-case-map-reconciliation.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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
        status: normalizeStatus(assertion.status),
        durationMs: assertion.duration ?? 0,
      });
    }
  }

  return rows;
}

function walkPlaywrightSuites(suites, parentTitle = "", rows = []) {
  for (const suite of suites ?? []) {
    const title = [parentTitle, suite.title].filter(Boolean).join(" / ");

    for (const spec of suite.specs ?? []) {
      const specTitle = [title, spec.title].filter(Boolean).join(" :: ");
      for (const test of spec.tests ?? []) {
        const last = (test.results ?? [])[test.results.length - 1] ?? {};
        rows.push({
          runner: "playwright",
          file: spec.file,
          title: specTitle,
          status: normalizeStatus(last.status),
          durationMs: last.duration ?? 0,
        });
      }
    }

    walkPlaywrightSuites(suite.suites, title, rows);
  }

  return rows;
}

function parsePlaywright(json) {
  return walkPlaywrightSuites(json.suites);
}

const cases = readJson(casesFile);
const vitestRows = parseVitest(readJson(vitestFile));
const playwrightRows = parsePlaywright(readJson(playwrightFile));
const actualRows = [...vitestRows, ...playwrightRows];

const comparison = cases.map((tc) => {
  const sourceBase = path.basename(tc.sourceFile);
  const actual = actualRows.find(
    (row) =>
      (row.file.endsWith(tc.sourceFile) || row.file === sourceBase || row.file.endsWith(sourceBase)) &&
      row.title.includes(tc.testTitleContains),
  );

  const actualStatus = actual ? actual.status : "not-found";
  const objectiveResult = actual
    ? actual.status === tc.expectedStatus
      ? "match"
      : "mismatch"
    : "no-evidence";

  return {
    caseId: tc.caseId,
    phase: tc.phase,
    module: tc.module,
    scope: tc.scope,
    sourceFile: tc.sourceFile,
    testTitleContains: tc.testTitleContains,
    expectedStatus: tc.expectedStatus,
    actualStatus,
    objectiveResult,
    matchedTestTitle: actual?.title ?? "",
    durationMs: actual?.durationMs ?? 0,
  };
});

const summary = {
  generatedAt: new Date().toISOString(),
  totalCases: comparison.length,
  match: comparison.filter((row) => row.objectiveResult === "match").length,
  mismatch: comparison.filter((row) => row.objectiveResult === "mismatch").length,
  noEvidence: comparison.filter((row) => row.objectiveResult === "no-evidence").length,
};

fs.writeFileSync(
  outFile,
  JSON.stringify(
    {
      summary,
      comparison,
    },
    null,
    2,
  ),
  "utf8",
);

console.log(outFile);
