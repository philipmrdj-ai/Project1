import { useMemo, useState } from "react";
import {
  ArrowRight,
  Inbox as InboxIcon,
  Pencil,
  Search,
  SkipForward,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useSearch } from "../App";
import { Confirm, EmptyState, IconBtn, Modal } from "../components/ui";
import { now, patchById, removeById, uid, useDb } from "../state/store";
import { BrainId, InboxNote, Note } from "../state/types";
import { SectionHead } from "./shared";

const BRAIN_DEST: { id: BrainId; label: string; glyph: string; hue: number }[] =
  [
    { id: "books", label: "Books", glyph: "B", hue: 70 },
    { id: "learning", label: "Learning", glyph: "L", hue: 195 },
    { id: "projects", label: "Projects", glyph: "P", hue: 288 },
    { id: "private", label: "Private", glyph: "✦", hue: 12 },
  ];

function age(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function InboxView() {
  const [db, update] = useDb();
  const q = useSearch();
  const [capture, setCapture] = useState("");
  const [sorting, setSorting] = useState<InboxNote | null>(null);
  const [sortAll, setSortAll] = useState(false);
  const [editing, setEditing] = useState<InboxNote | null>(null);
  const [confirmDel, setConfirmDel] = useState<InboxNote | null>(null);

  const items = db.inbox
    .filter((n) => !q || n.text.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.createdAt - a.createdAt);

  // in "sort everything" mode, always work on the oldest item
  const oldest = useMemo(
    () => [...db.inbox].sort((a, b) => a.createdAt - b.createdAt)[0] ?? null,
    [db.inbox]
  );
  const sortTarget = sortAll ? oldest : sorting;

  const addCapture = () => {
    const text = capture.trim();
    if (!text) return;
    update((d) => ({
      ...d,
      inbox: [...d.inbox, { id: uid(), text, createdAt: now() }],
    }));
    setCapture("");
  };

  const assign = (item: InboxNote, brainId: BrainId, ownerId: string | null) => {
    const firstLine = item.text.split("\n")[0].trim();
    const title = firstLine.length > 64 ? firstLine.slice(0, 61) + "…" : firstLine;
    const body = item.text === firstLine ? "" : item.text;
    const note: Note = {
      id: uid(),
      brainId,
      ownerId,
      parentId: null,
      title: title || "Untitled note",
      body,
      collapsed: false,
      order: now(), // large enough to land after existing siblings
      updatedAt: now(),
    };
    update((d) => ({
      ...d,
      notes: [...d.notes, note],
      inbox: removeById(d.inbox, item.id),
    }));
    if (!sortAll) setSorting(null);
  };

  const stopSorting = () => {
    setSorting(null);
    setSortAll(false);
  };

  return (
    <>
      <SectionHead
        title="Inbox"
        sub={`${db.inbox.length} unsorted thought${db.inbox.length === 1 ? "" : "s"} — capture first, sort when you're ready`}
        actions={
          db.inbox.length > 0 ? (
            <button className="btn" onClick={() => setSortAll(true)}>
              <Sparkles size={14} /> Sort one by one
            </button>
          ) : undefined
        }
      />

      <div className="capture-bar">
        <span className="c-dot" />
        <input
          autoFocus
          placeholder="Quick capture — drop a thought here, sort it later…"
          value={capture}
          onChange={(e) => setCapture(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCapture()}
        />
        <span className="kbd">⏎ to save</span>
      </div>

      {items.length === 0 ? (
        db.inbox.length === 0 ? (
          <EmptyState
            icon={InboxIcon}
            title="Inbox zero"
            hint="Anything you capture lands here. When you have a calm moment, press “Sort one by one” and give each thought a home — one decision at a time."
          />
        ) : (
          <EmptyState
            icon={Search}
            title="Nothing matches"
            hint="No captured notes match your search."
          />
        )
      ) : (
        items.map((n) => (
          <div className="inbox-item" key={n.id}>
            <div className="i-text">{n.text}</div>
            <span className="i-age">{age(n.createdAt)}</span>
            <button className="btn small" onClick={() => setSorting(n)}>
              Sort <ArrowRight size={12} />
            </button>
            <IconBtn title="Edit" onClick={() => setEditing(n)}>
              <Pencil size={14} />
            </IconBtn>
            <IconBtn title="Delete" danger onClick={() => setConfirmDel(n)}>
              <Trash2 size={14} />
            </IconBtn>
          </div>
        ))
      )}

      {sortTarget && (
        <SortModal
          key={sortTarget.id}
          item={sortTarget}
          remaining={sortAll ? db.inbox.length : undefined}
          onAssign={(brainId, ownerId) => assign(sortTarget, brainId, ownerId)}
          onSkip={
            sortAll
              ? () =>
                  // move it to the back of the queue and show the next one
                  update((d) => ({
                    ...d,
                    inbox: d.inbox.map((x) =>
                      x.id === sortTarget.id ? { ...x, createdAt: now() } : x
                    ),
                  }))
              : undefined
          }
          onDelete={() => {
            update((d) => ({ ...d, inbox: removeById(d.inbox, sortTarget.id) }));
            if (!sortAll) setSorting(null);
          }}
          onClose={stopSorting}
        />
      )}

      {editing && (
        <EditModal
          item={editing}
          onClose={() => setEditing(null)}
          onSave={(text) => {
            update((d) => ({
              ...d,
              inbox: patchById(d.inbox, editing.id, { text }),
            }));
            setEditing(null);
          }}
        />
      )}

      {confirmDel && (
        <Confirm
          message="Delete this captured note?"
          onConfirm={() => {
            update((d) => ({ ...d, inbox: removeById(d.inbox, confirmDel.id) }));
            setConfirmDel(null);
          }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </>
  );
}

/* ---------- the sorting flow: two small decisions, never a wall ---------- */

function SortModal({
  item,
  remaining,
  onAssign,
  onSkip,
  onDelete,
  onClose,
}: {
  item: InboxNote;
  remaining?: number;
  onAssign: (brainId: BrainId, ownerId: string | null) => void;
  onSkip?: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [db] = useDb();
  const [brainId, setBrainId] = useState<BrainId | null>(null);
  const [filter, setFilter] = useState("");

  // entities the note can be attached to inside the chosen brain
  const attachables: { id: string; title: string }[] =
    brainId === "books"
      ? db.books.map((b) => ({ id: b.id, title: b.title }))
      : brainId === "learning"
        ? db.courses.map((c) => ({ id: c.id, title: c.title }))
        : brainId === "projects"
          ? db.projects.map((p) => ({ id: p.id, title: p.title }))
          : [];
  const filtered = attachables.filter(
    (a) => !filter || a.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Modal
      title={
        remaining !== undefined
          ? `Sort — ${remaining} left`
          : "Where does this belong?"
      }
      onClose={onClose}
    >
      <div className="sort-preview">{item.text}</div>

      {!brainId ? (
        <div className="sort-dest">
          {BRAIN_DEST.map((b) => (
            <button
              key={b.id}
              className="dest-btn"
              style={{ "--hue": b.hue } as React.CSSProperties}
              onClick={() =>
                b.id === "private" ? onAssign("private", null) : setBrainId(b.id)
              }
            >
              <span className="d-glyph">{b.glyph}</span>
              {b.label}
              <ArrowRight size={14} style={{ marginLeft: "auto", opacity: 0.5 }} />
            </button>
          ))}
        </div>
      ) : (
        <div className="sort-dest">
          <button className="dest-btn" onClick={() => onAssign(brainId, null)}>
            <span className="d-glyph">🗒</span>
            {BRAIN_DEST.find((b) => b.id === brainId)?.label} → Notes (top level)
          </button>
          {attachables.length > 3 && (
            <input
              className="input"
              placeholder="Filter…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          )}
          {filtered.map((a) => (
            <button
              key={a.id}
              className="dest-btn"
              onClick={() => onAssign(brainId, a.id)}
            >
              <span className="d-glyph">→</span>
              Attach to “{a.title}”
            </button>
          ))}
          <button className="btn ghost small" onClick={() => setBrainId(null)}>
            ← Back to brains
          </button>
        </div>
      )}

      <div className="m-actions">
        <button className="btn danger small" onClick={onDelete}>
          <Trash2 size={13} /> Delete
        </button>
        <div style={{ flex: 1 }} />
        {onSkip && (
          <button className="btn ghost small" onClick={onSkip}>
            <SkipForward size={13} /> Skip for now
          </button>
        )}
        <button className="btn ghost small" onClick={onClose}>
          Done sorting
        </button>
      </div>
    </Modal>
  );
}

function EditModal({
  item,
  onClose,
  onSave,
}: {
  item: InboxNote;
  onClose: () => void;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(item.text);
  return (
    <Modal title="Edit captured note" onClose={onClose}>
      <textarea
        className="input"
        autoFocus
        style={{ minHeight: 120 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="m-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn" onClick={() => onSave(text)} disabled={!text.trim()}>
          Save
        </button>
      </div>
    </Modal>
  );
}
