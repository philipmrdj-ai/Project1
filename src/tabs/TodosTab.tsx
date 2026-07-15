import { useState } from "react";
import { Check, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { Confirm, EmptyState, Field, IconBtn, Modal } from "../components/ui";
import { patchById, removeById, uid, useDb } from "../state/store";
import { BrainId, TodoList } from "../state/types";
import { SectionHead } from "./shared";

export function TodosTab({ brainId }: { brainId: BrainId }) {
  const [db, update] = useDb();
  const lists = db.todoLists.filter((l) => l.brainId === brainId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [naming, setNaming] = useState<TodoList | "new" | null>(null);
  const [confirmDel, setConfirmDel] = useState<TodoList | null>(null);
  const [hideDone, setHideDone] = useState(false);
  const [draft, setDraft] = useState("");

  const list = lists.find((l) => l.id === activeId) ?? lists[0] ?? null;

  const patchList = (id: string, p: Partial<TodoList>) =>
    update((d) => ({ ...d, todoLists: patchById(d.todoLists, id, p) }));

  const addItem = () => {
    const text = draft.trim();
    if (!text || !list) return;
    patchList(list.id, {
      items: [...list.items, { id: uid(), text, done: false }],
    });
    setDraft("");
  };

  return (
    <>
      <SectionHead
        title="To-dos"
        sub="Simple checklists — as many lists as you need"
        actions={
          <div className="toolbar">
            {list && (
              <>
                <button
                  className={`btn ghost small ${hideDone ? "active" : ""}`}
                  onClick={() => setHideDone((v) => !v)}
                >
                  Hide done
                </button>
                <button
                  className="btn ghost small"
                  onClick={() => setNaming(list)}
                >
                  <Pencil size={13} /> Rename
                </button>
                <button
                  className="btn danger small"
                  onClick={() => setConfirmDel(list)}
                >
                  <Trash2 size={13} /> Delete list
                </button>
              </>
            )}
            <button className="btn" onClick={() => setNaming("new")}>
              <Plus size={14} /> List
            </button>
          </div>
        }
      />

      {lists.length > 0 && (
        <div className="chip-row">
          <span className="chip-label">List</span>
          {lists.map((l) => {
            const open = l.items.filter((i) => !i.done).length;
            return (
              <button
                key={l.id}
                className={`chip ${list && l.id === list.id ? "active" : ""}`}
                onClick={() => setActiveId(l.id)}
              >
                {l.name}
                {open > 0 ? ` · ${open}` : ""}
              </button>
            );
          })}
        </div>
      )}

      {!list ? (
        <EmptyState
          icon={ListChecks}
          title="No lists yet"
          hint="Create a to-do list — groceries, chapter fixes, launch steps, anything."
          action={
            <button className="btn" onClick={() => setNaming("new")}>
              <Plus size={14} /> List
            </button>
          }
        />
      ) : (
        <div className="todo-card">
          {list.items
            .filter((i) => !hideDone || !i.done)
            .map((item) => (
              <div className={`todo-item ${item.done ? "done" : ""}`} key={item.id}>
                <button
                  className={`todo-check ${item.done ? "done" : ""}`}
                  title={item.done ? "Mark as not done" : "Mark as done"}
                  onClick={() =>
                    patchList(list.id, {
                      items: patchById(list.items, item.id, { done: !item.done }),
                    })
                  }
                >
                  {item.done && <Check size={13} />}
                </button>
                <span className="todo-text">{item.text}</span>
                <IconBtn
                  title="Delete item"
                  danger
                  onClick={() =>
                    patchList(list.id, {
                      items: removeById(list.items, item.id),
                    })
                  }
                >
                  <Trash2 size={13} />
                </IconBtn>
              </div>
            ))}
          <div className="todo-add">
            <input
              className="input"
              placeholder="Add a to-do… (Enter to save)"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
            />
            <button className="btn small" onClick={addItem} disabled={!draft.trim()}>
              <Plus size={13} /> Add
            </button>
          </div>
        </div>
      )}

      {naming && (
        <ListNameModal
          list={naming === "new" ? null : naming}
          onClose={() => setNaming(null)}
          onSave={(name) => {
            if (naming === "new") {
              const nl: TodoList = { id: uid(), brainId, name, items: [] };
              update((d) => ({ ...d, todoLists: [...d.todoLists, nl] }));
              setActiveId(nl.id);
            } else {
              patchList(naming.id, { name });
            }
            setNaming(null);
          }}
        />
      )}

      {confirmDel && (
        <Confirm
          message={`Delete the list "${confirmDel.name}" and its ${confirmDel.items.length} item${confirmDel.items.length === 1 ? "" : "s"}?`}
          onConfirm={() => {
            update((d) => ({
              ...d,
              todoLists: removeById(d.todoLists, confirmDel.id),
            }));
            setActiveId(null);
            setConfirmDel(null);
          }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </>
  );
}

function ListNameModal({
  list,
  onClose,
  onSave,
}: {
  list: TodoList | null;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(list?.name ?? "");
  const submit = () => name.trim() && onSave(name.trim());
  return (
    <Modal title={list ? "Rename list" : "New to-do list"} onClose={onClose}>
      <Field label="List name">
        <input
          className="input"
          autoFocus
          value={name}
          placeholder="e.g. This week"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </Field>
      <div className="m-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn" onClick={submit} disabled={!name.trim()}>
          {list ? "Save" : "Create list"}
        </button>
      </div>
    </Modal>
  );
}
