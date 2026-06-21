// Color tokens for leave status/category indicators.
//
// The original badge used a neutral translucent fill (`bg-mist text-ink/70`).
// In dark mode (the app uses Tailwind's default `darkMode: "media"` strategy,
// which keys off `prefers-color-scheme: dark`) that low-contrast chip became
// effectively invisible, and it never communicated the status by color.
//
// Each status now maps to a solid, status-coded background with white text.
// Solid fills are legible on ANY surface — light cards, dark cards, or a
// browser/OS-darkened page — so the indicator stays visible regardless of the
// active color scheme. A `dark:` variant keeps the saturation comfortable on
// dark backgrounds.
const STATUS_BADGE_CLASSES = {
  Pending: "bg-gold text-white dark:bg-gold/90",
  Approved: "bg-pine text-white dark:bg-pine/90",
  Rejected: "bg-coral text-white dark:bg-coral/90",
};

// Neutral fallback for unknown/unmapped statuses, still legible in both themes.
const DEFAULT_BADGE_CLASS =
  "bg-ink text-white dark:bg-white/15 dark:text-mist";

// Returns the Tailwind class string for a leave status indicator badge.
export function leaveStatusBadgeClass(status) {
  return STATUS_BADGE_CLASSES[status] ?? DEFAULT_BADGE_CLASS;
}

export { STATUS_BADGE_CLASSES, DEFAULT_BADGE_CLASS };
