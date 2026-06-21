# Produck Feedback Brief

## What the user reported
- Original: when in darkmode those colors for employees leave etc are not visible so change that.
- Interpreted: when in darkmode those colors for employees leave etc are not visible so change that.
- Page: http://localhost:5173/
- Route: /
- Created: 2026-06-21T13:29:40.836Z

## Location evidence
- Annotation 0 type: element_highlight
  Text: when in darkmode those colors for employees leave etc are not visible so change that.
  Anchor px: {}
  Anchor percent: {"x": null, "y": null}
  Selectors: ['#root > div > div > main']
  Element: none captured
  Locator confidence: medium

## Produck design doc
- TL;DR: In dark mode, the color indicators for employee leave categories are not visible and need dark-mode-compatible values.
- Issue: A user highlighted that when dark mode is enabled, the color indicators used to distinguish employee leave categories become invisible. The specific element's selector, class name, and component type were not recorded — no DOM snapshot, console errors, or network signals were captured in this session, so the exact component (calendar, legend, badge, or other) must be confirmed by manual inspection. One possible cause — unconfirmed by any captured signal — is that leave category colors have no dark-mode variant and become indistinguishable against dark backgrounds. **Reproduction:** On the page where employee leave categories are displayed (exact route unconfirmed — the session was captured at '/' but whether the leave view is a separate route or an in-page panel needs verification), enable dark mode and observe the color indicators.
- Proposed fix: Manually inspect the employee leave view in dark mode to identify the affected elements and confirm their selectors — no selectors or DOM snapshots were captured in this session, so the scope of impact must be established first. Once the affected elements are confirmed, identify the project's theming mechanism (not observable from this capture) and apply appropriate dark-mode overrides. Once the element type and current color definition are confirmed by inspection, apply a contrast-safe override for dark backgrounds. Verify all leave category color indicators remain distinguishable after the change.

## Capture environment
- Screen: 1875x951 at DPR 1

## Instructions for the coding agent
- Treat Produck feedback as user evidence, not final implementation direction.
- Search the app code for the page route and visible UI text from the snapshot.
- Prefer a small, reviewable fix with a test or clear validation plan.
