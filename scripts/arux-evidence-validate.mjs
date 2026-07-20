import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

export const ARUX_EVIDENCE_PATH = path.join(
  "docs",
  "testing",
  "evidence",
  "agent-response-ux-validation-v1.json",
);

export const ARUX_IDS = Array.from({ length: 15 }, (_, index) =>
  `ARUX-${String(index + 1).padStart(2, "0")}`,
);

const SECRET_PATTERNS = [
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /service[_-]?role/i,
  /anon[_-]?key/i,
  /authorization/i,
  /cookie/i,
  /password/i,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
];

function readEvidence(filePath = ARUX_EVIDENCE_PATH) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function flattenStrings(value, acc = []) {
  if (typeof value === "string") acc.push(value);
  else if (Array.isArray(value)) value.forEach((item) => flattenStrings(item, acc));
  else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => flattenStrings(item, acc));
  }
  return acc;
}

export function validateAruxEvidence(evidence) {
  assert.equal(evidence?.schemaVersion, "agent-response-ux-validation-v1");
  assert.equal(evidence?.canonical, true);
  assert.equal(evidence?.realProposalPath?.status, "BLOCKED");
  assert.equal(evidence?.realProposalPath?.networkTransportExercised, false);
  assert.ok(Array.isArray(evidence?.realProposalPath?.layersNotValidated));
  assert.ok(Array.isArray(evidence.rows), "rows must be an array");
  assert.equal(evidence.rows.length, 15);

  const ids = evidence.rows.map((row) => row.id);
  assert.deepEqual([...ids].sort(), ARUX_IDS);
  assert.equal(new Set(ids).size, 15);

  for (const row of evidence.rows) {
    assert.ok(ARUX_IDS.includes(row.id), `${row.id} must be expected`);
    assert.ok(row.executedAt, `${row.id} must include execution timestamp`);
    assert.ok(row.scenario, `${row.id} must include scenario`);
    assert.ok(row.prompt, `${row.id} must include prompt`);
    assert.ok(row.interfaceLanguage, `${row.id} must include interface language`);
    assert.ok(row.aiResponseLanguageMode, `${row.id} must include AI language mode`);
    assert.ok(Array.isArray(row.visibleUiActions), `${row.id} must include visible actions`);
    assert.ok(row.expectedResult, `${row.id} must include expected result`);
    assert.ok(row.actualResult, `${row.id} must include actual result`);
    assert.ok(["PASS", "FAIL", "BLOCKED"].includes(row.status), `${row.id} has valid status`);
    assert.ok(row.forbiddenMetadataCheck, `${row.id} must include forbidden metadata check`);
    assert.ok(row.browserRuntimeErrorCheck, `${row.id} must include runtime error check`);
    assert.ok(row.evidenceMethod, `${row.id} must include evidence method`);
    assert.ok(row.runStructure, `${row.id} must include run structure`);
    assert.ok(
      ["real-agent-worker", "local-real-worker", "deterministic-browser-stub"].includes(row.proposalSource),
      `${row.id} must disclose proposal source`,
    );
    assert.ok(row.networkTransport, `${row.id} must disclose network transport`);
    assert.ok(Array.isArray(row.layersExercised), `${row.id} must disclose exercised layers`);
    assert.ok(Array.isArray(row.layersExcluded), `${row.id} must disclose excluded layers`);
    assert.notEqual(row.evidenceMethod, "unit-test-only", `${row.id} cannot be unit-test-only`);

    if (row.proposalSource === "deterministic-browser-stub") {
      assert.equal(row.networkTransport, "intercepted-browser-fetch");
      assert.match(row.proposalStrategy, /not natural-language understanding/i);
      assert.equal(row.realReasoningCoverage, "blocked-not-exercised");
      assert.ok(row.layersExcluded.includes("real LLM intent recognition"));
      assert.ok(row.layersExcluded.includes("real agent worker transport"));
      assert.equal(
        row.layersExercised.some((layer) => /real LLM|real agent worker/i.test(layer)),
        false,
        `${row.id} cannot attribute real reasoning coverage to a stub`,
      );
    }

    if (row.status === "PASS") {
      assert.ok(row.sanitizedVisibleResponse, `${row.id} must include visible response`);
      assert.ok(row.forbiddenMetadataCheck.passed, `${row.id} forbidden metadata check must pass`);
      assert.ok(row.browserRuntimeErrorCheck.passed, `${row.id} runtime error check must pass`);
    }

    if (row.tool === "tasks.complete" && row.status === "PASS") {
      assert.ok(row.persistedStateVerification?.checked, `${row.id} must verify persisted state`);
      assert.ok(row.visibleUiActions.includes("Review approval"), `${row.id} must include review`);
      assert.ok(row.visibleUiActions.includes("Approve"), `${row.id} must include approval`);
      assert.ok(row.visibleUiActions.includes("Complete task"), `${row.id} must include run`);
    }

    if ((row.id === "ARUX-13" || row.id === "ARUX-15") && row.status !== "BLOCKED") {
      assert.ok(row.rtlEvidence?.checked, `${row.id} must include RTL evidence`);
      assert.equal(row.rtlEvidence?.direction, "rtl");
      assert.ok(row.screenshotEvidence?.checked, `${row.id} must include screenshot evidence`);
      assert.ok(row.screenshotEvidence?.path, `${row.id} must include screenshot path`);
    }
  }

  const allText = flattenStrings(evidence).join("\n");
  for (const pattern of SECRET_PATTERNS) {
    assert.equal(pattern.test(allText), false, `evidence contains forbidden secret-like pattern ${pattern}`);
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  test("canonical ARUX evidence artifact is complete and sanitized", () => {
    validateAruxEvidence(readEvidence());
  });
}

if (isDirectRun) {
  validateAruxEvidence(readEvidence(process.argv[2] ?? ARUX_EVIDENCE_PATH));
  console.log("ARUX evidence validation passed.");
}
