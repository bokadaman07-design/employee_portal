// Tests for the Dashboard live salary total preview.
//
// The frontend has no JS test runner configured (see PARCLE_MEMORY technical
// debt: "No automated test suite"). This is a dependency-free test that can be
// run with `node frontend/tests/dashboard.salary-preview.test.mjs`. It combines:
//   - a static check that the preview UI and calculation exist in Dashboard.jsx
//     (regression: the form still renders the existing fields), and
//   - unit/integration checks of the preview math against the backend salary
//     contract (net_salary = base_salary + allowances - deductions, rounded to
//     2 decimals) across a range of inputs, including the empty-field case.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardSrc = readFileSync(join(here, "../src/views/Dashboard.jsx"), "utf8");

const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

// Mirrors the salaryPreview useMemo in Dashboard.jsx and the backend
// calculate_net_salary contract. Kept in sync intentionally so the unit tests
// document the expected behavior.
function computePreview(form) {
  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const base = toNumber(form.base_salary);
  const allowances = toNumber(form.allowances);
  const deductions = toNumber(form.deductions);
  const net = Math.round((base + allowances - deductions) * 100) / 100;
  return { base, allowances, deductions, net };
}

// --- Static / regression checks against the source ---

test("Dashboard renders a net salary preview section", () => {
  assert.match(dashboardSrc, /Net salary preview/, "preview label should be present in the form");
  assert.match(dashboardSrc, /salaryPreview\.net\.toLocaleString\(\)/, "preview should render the net total");
});

test("Preview is derived from the form fields via useMemo", () => {
  assert.match(dashboardSrc, /const salaryPreview = useMemo\(/, "salaryPreview should be a memoized value");
  for (const field of ["base_salary", "allowances", "deductions"]) {
    assert.match(
      dashboardSrc,
      new RegExp(`salaryForm\\.${field}`),
      `preview dependency list should include salaryForm.${field}`,
    );
  }
});

test("Existing salary form fields are still present (regression)", () => {
  for (const field of ["employee_id", "base_salary", "allowances", "deductions", "month"]) {
    assert.match(dashboardSrc, new RegExp(field), `salary form should still reference ${field}`);
  }
});

// --- Unit checks of the preview math ---

test("Net preview matches the backend contract for sample values", () => {
  const cases = [
    { form: { base_salary: "1000", allowances: "200", deductions: "150" }, net: 1050 },
    { form: { base_salary: "5000", allowances: "0", deductions: "0" }, net: 5000 },
    { form: { base_salary: "100.5", allowances: "10.25", deductions: "0.75" }, net: 110 },
    { form: { base_salary: "0", allowances: "0", deductions: "500" }, net: -500 },
  ];
  for (const { form, net } of cases) {
    assert.equal(computePreview(form).net, net, `net for ${JSON.stringify(form)}`);
  }
});

test("Empty or invalid fields are treated as zero (no NaN)", () => {
  const { base, allowances, deductions, net } = computePreview({
    base_salary: "",
    allowances: "",
    deductions: "abc",
  });
  assert.equal(base, 0);
  assert.equal(allowances, 0);
  assert.equal(deductions, 0);
  assert.equal(net, 0);
  assert.ok(Number.isFinite(net), "net should never be NaN");
});

test("Preview updates as values change (integration of the calculation)", () => {
  let form = { base_salary: "1000", allowances: "0", deductions: "0" };
  assert.equal(computePreview(form).net, 1000);
  form = { ...form, allowances: "250" };
  assert.equal(computePreview(form).net, 1250);
  form = { ...form, deductions: "100" };
  assert.equal(computePreview(form).net, 1150);
  form = { ...form, base_salary: "1200" };
  assert.equal(computePreview(form).net, 1350);
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`not ok - ${name}`);
    console.error(`  ${err.message}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log(`\n${tests.length} test(s) passed`);
