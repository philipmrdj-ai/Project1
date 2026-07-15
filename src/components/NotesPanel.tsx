import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";
import { now, patchById, uid, useDb } from "../state/store";
import { BrainId, Note } from "../state/types";
import { Confirm, EmptyState, IconBtn } from "./ui";

/**
 * Infinite nested notes: a tree sidebar + editor.
 * Scoped to a brain, and optionally to an owner entity (e.g. one book),
 * so every brain / workspace keeps a fully separate tree.
 */
export function NotesPanel({
  brainId,
  ownerId = null,
}: {
  brainId: BrainId;
  ownerId?: string | null;
}) {
  const [db, update] = useDb();
  const [selId, setSelId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | "root" | null>(null);
  const [confirmDel, setConfirmDel] = useState<Note | null>(null);

  const notes = useMemo(
    () =>
      db.notes.filter((n) => n.brainId === brainId && n.ownerId === ownerId),
    [db.notes, brainId, ownerId]
  );
  const byParent = useMemo(() => {
    const m = new Map<string | null, Note[]>();
    for (const n of notes) {
      const list = m.get(n.parentId) ?? [];
      list.push(n);
      m.set(n.parentId, list);
    }
    for (const list of m.values()) list.sort((a, b) => a.order - b.order);
    return m;
  }, [notes]);

  const selected = notes.find((n) => n.id === selId) ?? null;

  const nextOrder = (parentId: string | null) =>
    Math.max(0, ...(byParent.get(parentId) ?? []).map((n) => n.order)) + 1;

  const addNote = (parentId: string | null) => {
    const note: Note = {
      id: uid(),
      brainId,
      ownerId,
      parentId,
      title: "Untitled note",
      body: "",
      collapsed: false,
      order: nextOrder(parentId),
      updatedAt: now(),
    };
    update((d) => ({
      ...d,
      notes: [
        ...(parentId
          ? patchById(d.notes, parentId, { collapsed: false })
          : d.notes),
        note,
      ],
    }));
    setSelId(note.id);
  };

  const patchNote = (id: string, patch: Partial<Note>) =>
    update((d) => ({
      ...d,
      notes: patchById(d.notes, id, { ...patch, updatedAt: now() }),
    }));

  /** ids of a note and all its descendants */
  const subtreeIds = (id: string): Set<string> => {
    const out = new Set<string>([id]);
    const walk = (pid: string) => {
      for (const c of byParent.get(pid) ?? []) {
        out.add(c.id);
        walk(c.id);
      }
    };
    walk(id);
    return out;
  };

  const deleteNote = (note: Note) => {
    const ids = subtreeIds(note.id);
    update((d) => ({ ...d, notes: d.notes.filter((n) => !ids.has(n.id)) }));
    if (selId && ids.has(selId)) setSelId(null);
    setConfirmDel(null);
  };

  const moveNote = (id: string, newParentId: string | null) => {
    if (id === newParentId) return;
    // a note can't become a child of its own descendant
    if (newParentId && subtreeIds(id).has(newParentId)) return;
    patchNote(id, { parentId: newParentId, order: nextOrder(newParentId) });
  };

  const crumbs = useMemo(() => {
    const chain: Note[] = [];
    let cur = selected;
    while (cur) {
      chain.unshift(cur);
      cur = notes.find((n) => n.id === cur!.parentId) ?? null;
    }
    return chain;
  }, [selected, notes]);

  const renderTree = (parentId: string | null, depth: number) => {
    const items = byParent.get(parentId) ?? [];
    return items.map((n) => {
      const kids = byParent.get(n.id) ?? [];
      return (
        <div key={n.id}>
          <div
            className={`tree-item ${n.id === selId ? "active" : ""} ${
              dropTarget === n.id ? "drag-over" : ""
            }`}
            onClick={() => setSelId(n.id)}
            draggable
            onDragStart={(e) => {
              setDragId(n.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => {
              setDragId(null);
              setDropTarget(null);
            }}
            onDragOver={(e) => {
              if (dragId && dragId !== n.id) {
                e.preventDefault();
                setDropTarget(n.id);
              }
            }}
            onDragLeave={() =>
              setDropTarget((t) => (t === n.id ? null : t))
            }
            onDrop={(e) => {
              e.preventDefault();
              if (dragId) moveNote(dragId, n.id);
              setDragId(null);
              setDropTarget(null);
            }}
          >
            <span
              className="twisty"
              onClick={(e) => {
                e.stopPropagation();
                if (kids.length) patchNote(n.id, { collapsed: !n.collapsed });
              }}
            >
              {kids.length > 0 &&
                (n.collapsed ? (
                  <ChevronRight size={12} />
                ) : (
                  <ChevronDown size={12} />
                ))}
            </span>
            <span className="t-ico">
              <FileText size={14} />
            </span>
            <span className="t-label">{n.title || "Untitled note"}</span>
            <span className="t-actions">
              <IconBtn
                title="Add note inside"
                onClick={(e) => {
                  e.stopPropagation();
                  addNote(n.id);
                }}
              >
                <Plus size={12} />
              </IconBtn>
              <IconBtn
                title="Delete note"
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDel(n);
                }}
              >
                <Trash2 size={12} />
              </IconBtn>
            </span>
          </div>
          {!n.collapsed && kids.length > 0 && depth < 40 && (
            <div className="tree-children">{renderTree(n.id, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={StickyNote}
        title="No notes yet"
        hint="Notes can live inside other notes, as deep as you need. Start with one."
        action={
          <button className="btn" onClick={() => addNote(null)}>
            <Plus size={14} /> New note
          </button>
        }
      />
    );
  }

  return (
    <div className="notes-layout">
      <div className="note-tree">
        {renderTree(null, 0)}
        <button
          className="ws-back"
          style={{ marginTop: 8 }}
          onClick={() => addNote(null)}
        >
          <Plus size={13} /> New note
        </button>
        {dragId && (
          <div
            className={`root-drop ${dropTarget === "root" ? "drag-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDropTarget("root");
            }}
            onDragLeave={() =>
              setDropTarget((t) => (t === "root" ? null : t))
            }
            onDrop={(e) => {
              e.preventDefault();
              if (dragId) moveNote(dragId, null);
              setDragId(null);
              setDropTarget(null);
            }}
          >
            Drop here for top level
          </div>
        )}
      </div>

      <div className="note-editor">
        {selected ? (
          <>
            <div className="note-breadcrumb">
              {crumbs.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && " / "}
                  <button onClick={() => setSelId(c.id)}>
                    {c.title || "Untitled note"}
                  </button>
                </span>
              ))}
            </div>
            <input
              className="note-title-input"
              value={selected.title}
              placeholder="Untitled note"
              onChange={(e) => patchNote(selected.id, { title: e.target.value })}
            />
            <textarea
              className="note-body-input"
              value={selected.body}
              placeholder="Write anything…"
              onChange={(e) => patchNote(selected.id, { body: e.target.value })}
            />
            <div className="toolbar">
              <button className="btn ghost small" onClick={() => addNote(selected.id)}>
                <Plus size={13} /> Note inside this note
              </button>
            </div>
          </>
        ) : (
          <EmptyState
            icon={StickyNote}
            title="Pick a note"
            hint="Select a note on the left, or create a new one."
          />
        )}
      </div>

      {confirmDel && (
        <Confirm
          message={
            subtreeIds(confirmDel.id).size > 1
              ? `Delete "${confirmDel.title}" and everything inside it (${
                  subtreeIds(confirmDel.id).size - 1
                } nested note${subtreeIds(confirmDel.id).size > 2 ? "s" : ""})?`
              : `Delete "${confirmDel.title}"?`
          }
          onConfirm={() => deleteNote(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}
