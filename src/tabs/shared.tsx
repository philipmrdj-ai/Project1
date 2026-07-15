import { ReactNode, useState } from "react";
import { LayoutGrid, List, Rows3, Settings2 } from "lucide-react";

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

/* ---------- switchable collection views ---------- */

export type ViewMode = "cards" | "list" | "compact";

const VIEW_KEY = "brains.views.v1";

function loadViews(): Record<string, ViewMode> {
  try {
    return JSON.parse(localStorage.getItem(VIEW_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Per-collection view preference, persisted. */
export function useViewPref(key: string): [ViewMode, (v: ViewMode) => void] {
  const [view, setView] = useState<ViewMode>(() => loadViews()[key] ?? "cards");
  const set = (v: ViewMode) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, JSON.stringify({ ...loadViews(), [key]: v }));
    } catch {
      /* storage unavailable — preference just won't persist */
    }
  };
  return [view, set];
}

export function ViewSwitcher({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const opts: { id: ViewMode; icon: ReactNode; title: string }[] = [
    { id: "cards", icon: <LayoutGrid size={14} />, title: "Card view" },
    { id: "list", icon: <List size={14} />, title: "List view" },
    { id: "compact", icon: <Rows3 size={14} />, title: "Compact view" },
  ];
  return (
    <div className="view-switch" role="group" aria-label="View">
      {opts.map((o) => (
        <button
          key={o.id}
          className={value === o.id ? "active" : ""}
          title={o.title}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}

/** One item as rendered by ItemsView, whatever the entity. */
export interface ItemVM {
  id: string;
  title: string;
  desc: string;
  badges: ReactNode;
  /** extra row shown under the badges (e.g. a progress bar) */
  extra?: ReactNode;
}

/** Renders a collection in the chosen view mode. */
export function ItemsView({
  items,
  view,
  onOpen,
}: {
  items: ItemVM[];
  view: ViewMode;
  onOpen: (id: string) => void;
}) {
  if (view === "cards") {
    return (
      <div className="card-grid">
        {items.map((it) => (
          <div className="card" key={it.id} onClick={() => onOpen(it.id)}>
            <div className="stripe" />
            <h3>{it.title}</h3>
            <p>{it.desc || "No description yet."}</p>
            <div className="meta-row">{it.badges}</div>
            {it.extra}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={`list-rows ${view === "compact" ? "compact" : ""}`}>
      {items.map((it) => (
        <div className="list-row" key={it.id} onClick={() => onOpen(it.id)}>
          <div className="lr-stripe" />
          <div className="lr-main">
            <span className="lr-title">{it.title}</span>
            {view === "list" && it.desc && (
              <span className="lr-desc">{it.desc}</span>
            )}
          </div>
          {view === "list" && it.extra && (
            <div className="lr-extra">{it.extra}</div>
          )}
          <div className="lr-badges">{it.badges}</div>
        </div>
      ))}
    </div>
  );
}
