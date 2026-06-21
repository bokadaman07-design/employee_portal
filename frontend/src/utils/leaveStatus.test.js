import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_BADGE_CLASS,
  STATUS_BADGE_CLASSES,
  leaveStatusBadgeClass,
} from "./leaveStatus.js";

// Regression coverage for the dark-mode leave indicator incident: the status
// badge must be color-coded AND carry a dark-mode-safe class so it stays
// visible when the OS/browser reports a dark color scheme.

test("each known leave status maps to a distinct badge class", () => {
  const classes = Object.values(STATUS_BADGE_CLASSES);
  const unique = new Set(classes);
  assert.equal(unique.size, classes.length, "status colors must be distinct");
});

test("every known status badge carries a dark-mode variant", () => {
  for (const [status, className] of Object.entries(STATUS_BADGE_CLASSES)) {
    assert.match(
      className,
      /\bdark:/,
      `status "${status}" must include a dark: variant`,
    );
  }
});

test("known statuses resolve to their mapped class", () => {
  assert.equal(leaveStatusBadgeClass("Pending"), STATUS_BADGE_CLASSES.Pending);
  assert.equal(leaveStatusBadgeClass("Approved"), STATUS_BADGE_CLASSES.Approved);
  assert.equal(leaveStatusBadgeClass("Rejected"), STATUS_BADGE_CLASSES.Rejected);
});

test("unknown status falls back to the dark-mode-safe default", () => {
  assert.equal(leaveStatusBadgeClass("Cancelled"), DEFAULT_BADGE_CLASS);
  assert.equal(leaveStatusBadgeClass(undefined), DEFAULT_BADGE_CLASS);
  assert.match(DEFAULT_BADGE_CLASS, /\bdark:/);
});

test("badge classes provide foreground contrast (text color present)", () => {
  const all = [...Object.values(STATUS_BADGE_CLASSES), DEFAULT_BADGE_CLASS];
  for (const className of all) {
    assert.match(className, /\btext-/, `"${className}" must set a text color`);
  }
});
