export default function Card({ title, value, description, accent = "pine", children }) {
  const accentClass = {
    pine: "border-l-pine",
    coral: "border-l-coral",
    gold: "border-l-gold",
    ink: "border-l-ink",
  }[accent];

  return (
    <section className={`rounded-lg border border-line bg-white p-5 shadow-soft border-l-4 ${accentClass}`}>
      {title && <p className="text-sm font-medium text-ink/60">{title}</p>}
      {value !== undefined && <p className="mt-2 text-3xl font-semibold tracking-normal text-ink">{value}</p>}
      {description && <p className="mt-1 text-sm text-ink/60">{description}</p>}
      {children}
    </section>
  );
}
