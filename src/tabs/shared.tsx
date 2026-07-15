import { ReactNode, useState } from "react";
import { Settings2 } from "lucide-react";

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

/** Controlled filter chips: null value = "All". Optional manage button. */
export function FilterRow({
  label,
  items,
  value,
  onChange,
  onManage,
}: {
  label: string;
  items: { id: string; label: string }[];
  value: string | null;
  onChange: (id: string | null) => void;
  onManage?: () => void;
}) {
  return (
    <div className="chip-row">
      <span className="chip-label">{label}</span>
      <button
        className={`chip ${value === null ? "active" : ""}`}
        onClick={() => onChange(null)}
      >
        All
      </button>
      {items.map((it) => (
        <button
          key={it.id}
          className={`chip ${value === it.id ? "active" : ""}`}
          onClick={() => onChange(value === it.id ? null : it.id)}
        >
          {it.label}
        </button>
      ))}
      {onManage && (
        <button className="chip" onClick={onManage} title={`Edit ${label.toLowerCase()}`}>
          <Settings2 size={11} style={{ verticalAlign: -1.5, marginRight: 4 }} />
          edit
        </button>
      )}
    </div>
  );
}

/** Uncontrolled chip row — still used by Phase 3 placeholder tabs. */
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
