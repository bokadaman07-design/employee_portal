export default function Card({ title, value, description, accent = "pine", children }) {
  // The card sets `dark:border-edge` on all sides, which Tailwind emits as a
  // `border-color` rule in the dark-variant layer. A bare `border-l-pine` is a
  // base (non-dark) utility, so in dark mode the edge color overrides the left
  // accent and every card loses its color. Re-declaring each accent with a
  // `dark:` left-border variant keeps the accent in the dark layer, where
  // Tailwind orders `border-left-color` after `border-color`, so it wins.
  const accentClass = {
    pine: "border-l-pine dark:border-l-pine",
    coral: "border-l-coral dark:border-l-coral",
    gold: "border-l-gold dark:border-l-gold",
    // The ink accent (#17211f) is indistinguishable from the dark panel
    // (#18211f), so the colored edge disappears in dark mode. Lift it to the
    // light "fog" tone on dark surfaces so the accent stays visible.
    ink: "border-l-ink dark:border-l-fog",
  }[accent];

  return (
    <section className={`rounded-lg border border-line bg-white p-5 shadow-soft border-l-4 dark:border-edge dark:bg-panel ${accentClass}`}>
      {title && <p className="text-sm font-medium text-ink/60 dark:text-fog/60">{title}</p>}
      {value !== undefined && <p className="mt-2 text-3xl font-semibold tracking-normal text-ink dark:text-fog">{value}</p>}
      {description && <p className="mt-1 text-sm text-ink/60 dark:text-fog/60">{description}</p>}
      {children}
    </section>
  );
}
