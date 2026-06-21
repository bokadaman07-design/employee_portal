// Regression tests for the class-based dark mode feature.
//
// The frontend has no JS test runner configured (see PARCLE_MEMORY technical
// debt: "No automated test suite"). This is a dependency-free static test that
// can be run with `node frontend/tests/theme.dark-mode.test.mjs`. It verifies
// the wiring that makes Tailwind's class-based dark mode work end to end:
//   1. Tailwind is configured for class-based dark mode and defines the dark
//      surface palette.
//   2. The theme hook resolves a stored choice before falling back to the OS
//      preference, persists explicit choices, and toggles the `dark` class on
//      <html>.
//   3. The app is wrapped in ThemeProvider and the Navbar exposes a toggle.
//   4. The core views carry `dark:` variants so the UI actually restyles.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(here, rel), "utf8");

const tailwindConfig = read("../tailwind.config.js");
const themeSrc = read("../src/hooks/useTheme.js");
const mainSrc = read("../src/main.jsx");
const navbarSrc = read("../src/components/Navbar.jsx");

const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

// --- Tailwind configuration ---

test("Tailwind enables class-based dark mode", () => {
  assert.match(
    tailwindConfig,
    /darkMode:\s*["']class["']/,
    "tailwind.config.js should set darkMode: 'class'",
  );
});

test("Dark surface palette is defined", () => {
  for (const token of ["night", "panel", "edge", "fog"]) {
    assert.match(
      tailwindConfig,
      new RegExp(`${token}:\\s*["']#`),
      `tailwind.config.js should define the '${token}' dark color`,
    );
  }
});

// --- Theme hook behavior ---

test("Stored theme choice takes precedence over the system preference", () => {
  assert.match(
    themeSrc,
    /readStoredTheme\(\)\s*\?\?\s*\(systemPrefersDark\(\)/,
    "resolveInitialTheme should prefer a stored choice, then fall back to OS preference",
  );
});

test("Explicit theme choices are persisted to localStorage", () => {
  assert.match(
    themeSrc,
    /localStorage\.setItem\(STORAGE_KEY,\s*next\)/,
    "setExplicitTheme should persist the chosen theme",
  );
});

test("Toggling flips the dark class on the document element", () => {
  assert.match(
    themeSrc,
    /document\.documentElement\.classList\.toggle\(\s*["']dark["']/,
    "applyThemeClass should toggle the 'dark' class on <html>",
  );
});

test("Theme provider/consumer contract is exported", () => {
  for (const name of ["ThemeProvider", "useTheme"]) {
    assert.match(
      themeSrc,
      new RegExp(`export function ${name}`),
      `useTheme.js should export ${name}`,
    );
  }
  assert.match(
    themeSrc,
    /must be used within ThemeProvider/,
    "useTheme should guard against use outside the provider",
  );
});

// --- App wiring ---

test("App is wrapped in ThemeProvider", () => {
  assert.match(mainSrc, /import \{ ThemeProvider \} from "\.\/hooks\/useTheme"/);
  assert.match(mainSrc, /<ThemeProvider>/, "main.jsx should mount the ThemeProvider");
});

test("Navbar exposes an accessible theme toggle", () => {
  assert.match(navbarSrc, /useTheme\(\)/, "Navbar should consume the theme hook");
  assert.match(navbarSrc, /onClick=\{toggleTheme\}/, "Navbar should wire the toggle button");
  assert.match(
    navbarSrc,
    /aria-pressed=\{isDark\}/,
    "Toggle should report its state via aria-pressed",
  );
});

// --- Views actually restyle in dark mode ---

test("Core views and components carry dark: variants", () => {
  const files = [
    "../src/App.jsx",
    "../src/components/Card.jsx",
    "../src/components/Sidebar.jsx",
    "../src/views/Dashboard.jsx",
    "../src/views/EmployeeList.jsx",
    "../src/views/LeaveTracker.jsx",
    "../src/views/SignIn.jsx",
  ];
  for (const rel of files) {
    assert.match(read(rel), /dark:/, `${rel} should include dark: variant classes`);
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
