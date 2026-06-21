// Regression test for the Dashboard currency unit.
//
// The frontend has no JS test runner configured (see PARCLE_MEMORY technical
// debt: "No automated test suite"). This is a dependency-free static test that
// can be run with `node frontend/tests/dashboard.currency.test.mjs`. It verifies
// that monetary values in the Dashboard are rendered in Dollars ($) and that no
// hard-coded Rupee (₹) prefix remains on those values.

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

test("Net payroll card renders amount in Dollars", () => {
  assert.match(
    dashboardSrc,
    /\$\$\{payrollSummary\.net_payroll\.toLocaleString\(\)\}/,
    "Net payroll value should be prefixed with the Dollar symbol ($)",
  );
});

test("Salary table renders amounts in Dollars", () => {
  for (const field of ["base_salary", "allowances", "deductions", "net_salary"]) {
    assert.match(
      dashboardSrc,
      new RegExp(`\\$\\{record\\.${field}\\.toLocaleString\\(\\)\\}`),
      `record.${field} should be prefixed with the Dollar symbol ($)`,
    );
  }
});

test("No hard-coded Rupee prefix remains on monetary values", () => {
  assert.doesNotMatch(
    dashboardSrc,
    /₹\$\{payrollSummary\.net_payroll/,
    "Net payroll should not be prefixed with a Rupee sign",
  );
  for (const field of ["base_salary", "allowances", "deductions", "net_salary"]) {
    assert.doesNotMatch(
      dashboardSrc,
      new RegExp(`₹\\{record\\.${field}\\.toLocaleString\\(\\)\\}`),
      `record.${field} should not be prefixed with a Rupee sign`,
    );
  }
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
