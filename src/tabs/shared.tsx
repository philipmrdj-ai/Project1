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
        <button
          className="chip"
          onClick={onManage}
          title={`Edit ${label.toLowerCase()}`}
        >
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
export function useViewPref(
  key: string,
  def: ViewMode = "cards"
): [ViewMode, (v: ViewMode) => void] {
  const [view, setView] = useState<ViewMode>(() => loadViews()[key] ?? def);
  const set = (v: ViewMode) => {
    setView(v);
    try {
      localStorage.setItem(
        VIEW_KEY,
        JSON.stringify({ ...loadViews(), [key]: v })
      );
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
    { id: "cards", icon: <LayoutGrid size={13} />, title: "Grid" },
    { id: "list", icon: <List size={13} />, title: "List" },
    { id: "compact", icon: <Rows3 size={13} />, title: "Compact" },
  ];
  return (
    <div className="view-switch" role="group" aria-label="View">
      {opts.map((o) => (
        <button
          key={o.id}
          className={value === o.id ? "active" : ""}
          title={`${o.title} view`}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.icon}
          {o.title}
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
  /** status pill text (accent) */
  status?: string | null;
  /** small grey meta text, e.g. "Fiction · Fantasy" */
  meta?: string | null;
  /** 0–100; when set, cards/list show a progress bar */
  progress?: number;
  /** extra badges (links count, etc.) */
  badges?: ReactNode;
}

/** Renders a collection in the chosen view mode (design v3: cover cards). */
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
      <div className="cv-grid">
        {items.map((it) => (
          <div className="cv-card" key={it.id} onClick={() => onOpen(it.id)}>
            <div className="cv-cover">
              <span />
            </div>
            <div className="cv-body">
              <div className="cv-meta">
                {it.status && <span className="badge">{it.status}</span>}
                {it.meta && <span className="m-text">{it.meta}</span>}
                {it.badges}
              </div>
              <div className="cv-title">{it.title}</div>
              {it.desc && <div className="cv-desc">{it.desc}</div>}
              {it.progress !== undefined && (
                <div className="cv-progress">
                  <div className="progress">
                    <div style={{ width: `${Math.max(it.progress, 2)}%` }} />
                  </div>
                  <div className="progress-label">
                    {it.progress > 0
                      ? `${it.progress}% complete`
                      : "Not started"}
                  </div>
                </div>
              )}
            </div>
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
          {view === "list" && it.progress !== undefined && (
            <div className="lr-extra">
              <div className="progress">
                <div style={{ width: `${Math.max(it.progress, 2)}%` }} />
              </div>
            </div>
          )}
          <div className="lr-badges">
            {it.status && <span className="badge">{it.status}</span>}
            {view === "list" && it.meta && (
              <span className="badge neutral">{it.meta}</span>
            )}
            {view === "list" && it.badges}
          </div>
        </div>
      ))}
    </div>
  );
}
