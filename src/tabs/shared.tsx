import { ReactNode, useState } from "react";

/** Section header: title + subtitle on the left, actions on the right. */
export function SectionHead({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {sub && <div className="sub">{sub}</div>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>{actions}</div>
    </div>
  );
}

/** A row of filter chips with a single active selection (visual only in Phase 1). */
export function ChipRow({
  label,
  chips,
  initial = 0,
}: {
  label?: string;
  chips: string[];
  initial?: number;
}) {
  const [active, setActive] = useState(initial);
  return (
    <div className="chip-row">
      {label && <span className="chip-label">{label}</span>}
      {chips.map((c, i) => (
        <button
          key={c}
          className={`chip ${i === active ? "active" : ""}`}
          onClick={() => setActive(i)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export function PlaceholderHint({ children }: { children: ReactNode }) {
  return (
    <div className="empty-hint" style={{ marginTop: 22 }}>
      {children}
    </div>
  );
}
