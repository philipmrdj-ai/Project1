import { useState } from "react";
import {
  Pencil,
  Plus,
  SquareKanban,
  Trash2,
} from "lucide-react";
import { Confirm, Field, IconBtn, Modal } from "../components/ui";
import { patchById, removeById, uid, useDb } from "../state/store";
import { Board, BrainId, KanbanCard, KanbanColumn } from "../state/types";
import { SectionHead } from "./shared";
import { EmptyState } from "../components/ui";

interface DragInfo {
  cardId: string;
  fromCol: string;
}

export function BoardsTab({ brainId }: { brainId: BrainId }) {
  const [db, update] = useDb();
  const boards = db.boards.filter((b) => b.brainId === brainId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<Board | "new" | null>(null);
  const [confirmDelBoard, setConfirmDelBoard] = useState<Board | null>(null);
  const [editingCard, setEditingCard] = useState<{
    colId: string;
    card: KanbanCard;
  } | null>(null);
  const [drag, setDrag] = useState<DragInfo | null>(null);
  const [hoverCol, setHoverCol] = useState<string | null>(null);

  const board = boards.find((b) => b.id === activeId) ?? boards[0] ?? null;

  const patchBoard = (id: string, p: Partial<Board>) =>
    update((d) => ({ ...d, boards: patchById(d.boards, id, p) }));

  const patchCols = (fn: (cols: KanbanColumn[]) => KanbanColumn[]) => {
    if (board) patchBoard(board.id, { columns: fn(board.columns) });
  };

  const moveCard = (info: DragInfo, toCol: string, beforeCardId?: string) => {
    patchCols((cols) => {
      const card = cols
        .find((c) => c.id === info.fromCol)
        ?.cards.find((c) => c.id === info.cardId);
      if (!card) return cols;
      return cols.map((col) => {
        let cards = col.cards;
        if (col.id === info.fromCol) cards = cards.filter((c) => c.id !== card.id);
        if (col.id === toCol) {
          const idx = beforeCardId
            ? cards.findIndex((c) => c.id === beforeCardId)
            : -1;
          cards =
            idx >= 0
              ? [...cards.slice(0, idx), card, ...cards.slice(idx)]
              : [...cards, card];
        }
        return { ...col, cards };
      });
    });
  };

  if (!board) {
    return (
      <>
        <SectionHead title="Boards" sub="Kanban planning for this brain" />
        <EmptyState
          icon={SquareKanban}
          title="No boards yet"
          hint="Create a board to plan with columns and cards."
          action={
            <button className="btn" onClick={() => setRenaming("new")}>
              <Plus size={14} /> New board
            </button>
          }
        />
        {renaming && (
          <BoardNameModal
            board={null}
            onClose={() => setRenaming(null)}
            onSave={(name) => {
              const nb = newBoard(brainId, name);
              update((d) => ({ ...d, boards: [...d.boards, nb] }));
              setActiveId(nb.id);
              setRenaming(null);
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <SectionHead
        title="Boards"
        sub="Kanban planning — drag cards between columns"
        actions={
          <div className="toolbar">
            <button className="btn ghost small" onClick={() => setRenaming(board)}>
              <Pencil size={13} /> Rename
            </button>
            <button
              className="btn danger small"
              onClick={() => setConfirmDelBoard(board)}
            >
              <Trash2 size={13} /> Delete board
            </button>
            <button className="btn" onClick={() => setRenaming("new")}>
              <Plus size={14} /> New board
            </button>
          </div>
        }
      />

      <div className="chip-row">
        <span className="chip-label">Board</span>
        {boards.map((b) => (
          <button
            key={b.id}
            className={`chip ${b.id === board.id ? "active" : ""}`}
            onClick={() => setActiveId(b.id)}
          >
            {b.name}
          </button>
        ))}
      </div>

      <div className="kanban">
        {board.columns.map((col) => (
          <Column
            key={col.id}
            col={col}
            isDropTarget={hoverCol === col.id && drag !== null}
            onDragEnterCol={() => setHoverCol(col.id)}
            onDropOnCol={(beforeCardId) => {
              if (drag) moveCard(drag, col.id, beforeCardId);
              setDrag(null);
              setHoverCol(null);
            }}
            onDragStartCard={(cardId) => setDrag({ cardId, fromCol: col.id })}
            onDragEndCard={() => {
              setDrag(null);
              setHoverCol(null);
            }}
            onEditCard={(card) => setEditingCard({ colId: col.id, card })}
            onAddCard={(text) =>
              patchCols((cols) =>
                cols.map((c) =>
                  c.id === col.id
                    ? {
                        ...c,
                        cards: [
                          ...c.cards,
                          { id: uid(), text, tags: [], color: null },
                        ],
                      }
                    : c
                )
              )
            }
            onRenameCol={(name) =>
              patchCols((cols) => patchById(cols, col.id, { name }))
            }
            onDeleteCol={() =>
              patchCols((cols) => removeById(cols, col.id))
            }
          />
        ))}
        <button
          className="kanban-ghost-col"
          onClick={() =>
            patchCols((cols) => [
              ...cols,
              { id: uid(), name: "New column", cards: [] },
            ])
          }
        >
          <Plus size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
          Add column
        </button>
      </div>

      {renaming && (
        <BoardNameModal
          board={renaming === "new" ? null : renaming}
          onClose={() => setRenaming(null)}
          onSave={(name) => {
            if (renaming === "new") {
              const nb = newBoard(brainId, name);
              update((d) => ({ ...d, boards: [...d.boards, nb] }));
              setActiveId(nb.id);
            } else {
              patchBoard(renaming.id, { name });
            }
            setRenaming(null);
          }}
        />
      )}

      {confirmDelBoard && (
        <Confirm
          message={`Delete the board "${confirmDelBoard.name}" and all its cards?`}
          onConfirm={() => {
            update((d) => ({ ...d, boards: removeById(d.boards, confirmDelBoard.id) }));
            setActiveId(null);
            setConfirmDelBoard(null);
          }}
          onCancel={() => setConfirmDelBoard(null)}
        />
      )}

      {editingCard && (
        <CardModal
          card={editingCard.card}
          onClose={() => setEditingCard(null)}
          onSave={(text, tags, color) => {
            patchCols((cols) =>
              cols.map((c) =>
                c.id === editingCard.colId
                  ? {
                      ...c,
                      cards: patchById(c.cards, editingCard.card.id, {
                        text,
                        tags,
                        color,
                      }),
                    }
                  : c
              )
            );
            setEditingCard(null);
          }}
          onDelete={() => {
            patchCols((cols) =>
              cols.map((c) =>
                c.id === editingCard.colId
                  ? { ...c, cards: removeById(c.cards, editingCard.card.id) }
                  : c
              )
            );
            setEditingCard(null);
          }}
        />
      )}
    </>
  );
}

function newBoard(brainId: BrainId, name: string): Board {
  return {
    id: uid(),
    brainId,
    name,
    columns: [
      { id: uid(), name: "To do", cards: [] },
      { id: uid(), name: "Doing", cards: [] },
      { id: uid(), name: "Done", cards: [] },
    ],
  };
}

/* ---------- one column ---------- */

function Column({
  col,
  isDropTarget,
  onDragEnterCol,
  onDropOnCol,
  onDragStartCard,
  onDragEndCard,
  onEditCard,
  onAddCard,
  onRenameCol,
  onDeleteCol,
}: {
  col: KanbanColumn;
  isDropTarget: boolean;
  onDragEnterCol: () => void;
  onDropOnCol: (beforeCardId?: string) => void;
  onDragStartCard: (cardId: string) => void;
  onDragEndCard: () => void;
  onEditCard: (card: KanbanCard) => void;
  onAddCard: (text: string) => void;
  onRenameCol: (name: string) => void;
  onDeleteCol: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(col.name);
  const [confirmDel, setConfirmDel] = useState(false);

  const submitAdd = () => {
    const text = draft.trim();
    if (text) onAddCard(text);
    setDraft("");
    setAdding(false);
  };
  const submitRename = () => {
    const name = nameDraft.trim();
    if (name) onRenameCol(name);
    setRenaming(false);
  };

  return (
    <div
      className={`kanban-col ${isDropTarget ? "drag-over" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragEnterCol();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDropOnCol();
      }}
    >
      <h4>
        {renaming ? (
          <input
            className="input"
            style={{ padding: "3px 8px", fontSize: 12 }}
            value={nameDraft}
            autoFocus
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
          />
        ) : (
          <span className="col-head-row" style={{ flex: 1 }}>
            <span className="col-name">{col.name}</span>
            <IconBtn
              title="Rename column"
              onClick={() => {
                setNameDraft(col.name);
                setRenaming(true);
              }}
            >
              <Pencil size={11} />
            </IconBtn>
            <IconBtn title="Delete column" danger onClick={() => setConfirmDel(true)}>
              <Trash2 size={11} />
            </IconBtn>
          </span>
        )}
        <span className="count">{col.cards.length}</span>
      </h4>

      {col.cards.map((card) => (
        <div
          className="kanban-card"
          key={card.id}
          data-color={card.color ?? undefined}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            onDragStartCard(card.id);
          }}
          onDragEnd={onDragEndCard}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDropOnCol(card.id);
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => onEditCard(card)}
        >
          <span className="cc-bar" />
          {card.text}
          {card.tags.length > 0 && (
            <div className="k-tags">
              {card.tags.map((t) => (
                <span className="badge neutral" key={t}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div className="quick-add">
          <input
            className="input"
            autoFocus
            placeholder="Card text…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={submitAdd}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitAdd();
              if (e.key === "Escape") {
                setDraft("");
                setAdding(false);
              }
            }}
          />
        </div>
      ) : (
        <button className="kanban-add" onClick={() => setAdding(true)}>
          + Add card
        </button>
      )}

      {confirmDel && (
        <Confirm
          message={
            col.cards.length
              ? `Delete the column "${col.name}" and its ${col.cards.length} card${
                  col.cards.length > 1 ? "s" : ""
                }?`
              : `Delete the empty column "${col.name}"?`
          }
          onConfirm={() => {
            onDeleteCol();
            setConfirmDel(false);
          }}
          onCancel={() => setConfirmDel(false)}
        />
      )}
    </div>
  );
}

/* ---------- modals ---------- */

function BoardNameModal({
  board,
  onClose,
  onSave,
}: {
  board: Board | null;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(board?.name ?? "");
  const submit = () => name.trim() && onSave(name.trim());
  return (
    <Modal title={board ? "Rename board" : "New board"} onClose={onClose}>
      <Field label="Board name">
        <input
          className="input"
          autoFocus
          value={name}
          placeholder="e.g. Writing pipeline"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </Field>
      <div className="m-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn" onClick={submit} disabled={!name.trim()}>
          {board ? "Save" : "Create board"}
        </button>
      </div>
    </Modal>
  );
}

const CARD_COLORS = [
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "violet",
  "pink",
];

function CardModal({
  card,
  onClose,
  onSave,
  onDelete,
}: {
  card: KanbanCard;
  onClose: () => void;
  onSave: (text: string, tags: string[], color: string | null) => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState(card.text);
  const [tags, setTags] = useState(card.tags.join(", "));
  const [color, setColor] = useState<string | null>(card.color);
  const submit = () =>
    text.trim() &&
    onSave(
      text.trim(),
      tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      color
    );
  return (
    <Modal title="Edit card" onClose={onClose}>
      <Field label="Text">
        <textarea
          className="input"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </Field>
      <Field label="Tags (comma-separated)">
        <input
          className="input"
          value={tags}
          placeholder="e.g. Hollow Crown, urgent"
          onChange={(e) => setTags(e.target.value)}
        />
      </Field>
      <Field label="Colour">
        <div className="swatch-row">
          <button
            className={`swatch ${color === null ? "active" : ""}`}
            title="No colour"
            onClick={() => setColor(null)}
          />
          {CARD_COLORS.map((c) => (
            <button
              key={c}
              className={`swatch ${color === c ? "active" : ""}`}
              data-c={c}
              title={c}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </Field>
      <div className="m-actions">
        <button className="btn danger" onClick={onDelete}>
          <Trash2 size={13} /> Delete
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn" onClick={submit} disabled={!text.trim()}>
          Save
        </button>
      </div>
    </Modal>
  );
}
