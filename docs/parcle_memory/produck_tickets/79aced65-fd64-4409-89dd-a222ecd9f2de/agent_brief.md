# Produck Feedback Brief

## What the user reported
- Original: Before adding the salary as there no preview of what total amount I am adding I need a total preview section
- Interpreted: Before adding the salary as there no preview of what total amount I am adding I need a total preview section
- Page: http://localhost:5173/
- Route: /
- Created: 2026-06-21T11:10:34.047Z

## Location evidence
- Annotation 0 type: element_highlight
  Text: Before adding the salary as there no preview of what total amount I am adding I need a total preview section
  Anchor px: {}
  Anchor percent: {"x": null, "y": null}
  Selectors: ['main > div > section > form']
  Element: none captured
  Locator confidence: medium

## Produck design doc
- TL;DR: No total preview is shown while entering salary details; a summary of the cumulative amount should be added in proximity to the salary input area (exact location unconfirmed — no DOM captured) so users can verify before proceeding.
- Issue: The user annotated the salary entry area and explicitly reported that there is no preview of the total amount being built up as they add salary details. Per the user's annotation, no aggregate total appears to be surfaced during entry; this could not be independently verified as no DOM snapshot or replay was captured. It is possible — though unconfirmed — that the form accepts multiple salary components (e.g. distinct fields for different pay elements); no DOM snapshot or replay was captured to verify this structure.
- Proposed fix: Add a total preview element to the salary entry flow. Placement cannot be specified without a DOM snapshot; the implementer should identify the salary input container via inspection before positioning the preview element. The preview should reflect the sum of entered values; whether it updates in real time or on a discrete user action (e.g. a recalculate button) should be decided based on the form's actual interaction model, which was not captured. Because the frontend framework is unidentifiable from captured signals, the recalculation approach (e.g. reactive state binding vs. manual DOM update) cannot be prescribed here. Field names and any breakdown shown in the preview should be derived from the actual confirmed form structure rather than assumed.

## Capture environment
- Screen: 1875x951 at DPR 1

## Instructions for the coding agent
- Treat Produck feedback as user evidence, not final implementation direction.
- Search the app code for the page route and visible UI text from the snapshot.
- Prefer a small, reviewable fix with a test or clear validation plan.
