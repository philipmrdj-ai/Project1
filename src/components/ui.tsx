import { ReactNode, useEffect, useState } from "react";
import { LucideIcon, Pencil, Plus, Trash2, X } from "lucide-react";

/* ---------- modal ---------- */

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal ${wide ? "wide" : ""}`} role="dialog" aria-label={title}>
        <div className="m-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirm({
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title="Are you sure?" onClose={onCancel}>
      <p className="confirm-text">{message}</p>
      <div className="m-actions">
        <button className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- form bits ---------- */

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function IconBtn({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      className={`icon-btn ${danger ? "danger" : ""}`}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/* ---------- empty state ---------- */

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="es-icon">
        <Icon size={26} strokeWidth={1.6} />
      </div>
      <h3>{title}</h3>
      <p>{hint}</p>
      {action && <div className="es-action">{action}</div>}
    </div>
  );
}

/* ---------- label manager (statuses, genres, categories) ---------- */

export type LabelKind = "fiction" | "nonfiction" | "both";

export function LabelManager({
  items,
  onAdd,
  onRename,
  onDelete,
  onKind,
  addPlaceholder,
  deleteHint,
}: {
  items: { id: string; name: string; kind?: LabelKind }[];
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  /** when provided, each label gets a Fiction / Non-fiction / Both selector */
  onKind?: (id: string, kind: LabelKind) => void;
  addPlaceholder: string;
  deleteHint?: string;
}) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    onAdd(name);
    setDraft("");
  };
  const saveRename = (id: string) => {
    const name = editText.trim();
    if (name) onRename(id, name);
    setEditing(null);
  };

  return (
    <div className="label-manager">
      {items.map((it) => (
        <div className="label-row" key={it.id}>
          {editing === it.id ? (
            <input
              className="input"
              value={editText}
              autoFocus
              onChange={(e) => setEditText(e.target.value)}
              onBlur={() => saveRename(it.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRename(it.id);
                if (e.key === "Escape") setEditing(null);
              }}
            />
          ) : (
            <span className="label-name">{it.name}</span>
          )}
          {onKind && editing !== it.id && (
            <div className="seg small">
              {(
                [
                  ["fiction", "Fiction"],
                  ["nonfiction", "Non-fiction"],
                  ["both", "Both"],
                ] as [LabelKind, string][]
              ).map(([k, lbl]) => (
                <button
                  key={k}
                  className={(it.kind ?? "both") === k ? "active" : ""}
                  onClick={() => onKind(it.id, k)}
                >
                  {lbl}
                </button>
              ))}
            </div>
          )}
          <IconBtn
            title="Rename"
            onClick={() => {
              setEditing(it.id);
              setEditText(it.name);
            }}
          >
            <Pencil size={14} />
          </IconBtn>
          <IconBtn title="Delete" danger onClick={() => onDelete(it.id)}>
            <Trash2 size={14} />
          </IconBtn>
        </div>
      ))}
      {items.length === 0 && (
        <p className="confirm-text">Nothing here yet — add the first one below.</p>
      )}
      <div className="label-add">
        <input
          className="input"
          placeholder={addPlaceholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="btn small" onClick={add}>
          <Plus size={13} /> Add
        </button>
      </div>
      {deleteHint && <p className="field-hint">{deleteHint}</p>}
    </div>
  );
}
