// Regression test for the Sign Out confirmation guard.
//
// The frontend has no JS test runner configured (see PARCLE_MEMORY technical
// debt: "No automated test suite"). This is a dependency-free static test that
// can be run with `node frontend/tests/navbar.signout.test.mjs`. It verifies:
//   1. Navbar intercepts the sign-out click and asks for confirmation before
//      calling logout.
//   2. The actual token/session clearing logic stays centralized in
//      AuthContext.logout and is not duplicated into Navbar.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const navbarSrc = readFileSync(join(here, "../src/components/Navbar.jsx"), "utf8");
const authSrc = readFileSync(join(here, "../src/context/AuthContext.js"), "utf8");

const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

test("Sign out button is guarded by a confirmation handler, not raw logout", () => {
  // The button must not call logout directly.
  assert.doesNotMatch(
    navbarSrc,
    /onClick=\{logout\}/,
    "Sign out button should not call logout directly without confirmation",
  );
  // It should route through a handler.
  assert.match(
    navbarSrc,
    /onClick=\{handleSignOut\}/,
    "Sign out button should call the confirmation handler",
  );
});

test("Confirmation dialog asks before logging out", () => {
  assert.match(
    navbarSrc,
    /window\.confirm\(\s*["']Are you sure you want to sign out\?["']\s*\)/,
    "Navbar should display a 'Are you sure you want to sign out?' confirmation",
  );
  // logout must be called inside the confirm guard.
  assert.match(
    navbarSrc,
    /if\s*\(\s*window\.confirm\([^)]*\)\s*\)\s*\{\s*logout\(\);/s,
    "logout() must only run when the user confirms",
  );
});

test("Token/session clearing logic stays centralized in AuthContext.logout", () => {
  assert.match(
    authSrc,
    /function logout\(\)\s*\{[^}]*setToken\(null\)[^}]*removeItem\(["']employee_tracker_user["']\)/s,
    "AuthContext.logout should remain the single place that clears the session",
  );
  // Navbar must not reimplement session clearing.
  assert.doesNotMatch(
    navbarSrc,
    /localStorage|setToken/,
    "Navbar should not clear tokens/session itself",
  );
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
