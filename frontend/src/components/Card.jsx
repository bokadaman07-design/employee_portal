export default function Card({ title, value, description, accent = "pine", children }) {
  const accentClass = {
    pine: "border-l-pine",
    coral: "border-l-coral",
    gold: "border-l-gold",
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
