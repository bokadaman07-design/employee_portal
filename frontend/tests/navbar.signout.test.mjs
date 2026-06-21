// Regression test for the Sign Out confirmation guard.
//
// The frontend has no JS test runner configured (see PARCLE_MEMORY technical
// debt: "No automated test suite"). This is a dependency-free static test that
// can be run with `node frontend/tests/navbar.signout.test.mjs`. It verifies:
//   1. Navbar intercepts the sign-out click and opens an accessible
//      confirmation dialog before calling logout.
//   2. The dialog offers an explicit Cancel action that keeps the session.
//   3. The actual token/session clearing logic stays centralized in
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

test("Sign out button is guarded by a confirmation step, not raw logout", () => {
  // The button must not call logout directly.
  assert.doesNotMatch(
    navbarSrc,
    /onClick=\{logout\}/,
    "Sign out button should not call logout directly without confirmation",
  );
  // The trigger should open the confirmation dialog rather than logging out.
  assert.match(
    navbarSrc,
    /onClick=\{\(\)\s*=>\s*setConfirmOpen\(true\)\}/,
    "Sign out button should open the confirmation dialog",
  );
});

test("Confirmation dialog asks before logging out", () => {
  // The dialog presents the confirmation prompt.
  assert.match(
    navbarSrc,
    /Are you sure you want to sign out\?/,
    "Navbar should display a 'Are you sure you want to sign out?' confirmation",
  );
  // The dialog must offer an explicit Cancel action that only dismisses it.
  assert.match(
    navbarSrc,
    /onClick=\{\(\)\s*=>\s*setConfirmOpen\(false\)\}/,
    "Confirmation dialog must have a Cancel action that keeps the session intact",
  );
  // logout must only run via the confirm handler, which closes the dialog first.
  assert.match(
    navbarSrc,
    /function handleConfirmSignOut\(\)\s*\{\s*setConfirmOpen\(false\);\s*logout\(\);\s*\}/s,
    "logout() must only run after the user confirms",
  );
  // The confirm button is wired to the guarded handler.
  assert.match(
    navbarSrc,
    /onClick=\{handleConfirmSignOut\}/,
    "Confirm button should call the guarded sign-out handler",
  );
});

test("Dialog is rendered only when confirmation is open", () => {
  assert.match(
    navbarSrc,
    /confirmOpen\s*&&/,
    "Confirmation dialog should be conditionally rendered on confirmOpen state",
  );
  assert.match(
    navbarSrc,
    /role="dialog"/,
    "Confirmation should be an accessible dialog",
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
