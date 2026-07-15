import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  BookOpen,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { NotesPanel } from "../components/NotesPanel";
import {
  Confirm,
  EmptyState,
  Field,
  LabelManager,
  Modal,
} from "../components/ui";
import { now, patchById, removeById, uid, useDb } from "../state/store";
import { Book, Label } from "../state/types";
import { FilterRow, SectionHead } from "./shared";

export function BooksTab() {
  const [db, update] = useDb();
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [managing, setManaging] = useState<"statuses" | "genres" | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<string | null>(null);
  const [statusId, setStatusId] = useState<string | null>(null);
  const [genreId, setGenreId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const openBook = db.books.find((b) => b.id === openId);
  if (openBook) {
    return <BookWorkspace book={openBook} onBack={() => setOpenId(null)} />;
  }

  const active = db.books.filter((b) => !b.archived);
  const archived = db.books.filter((b) => b.archived);
  const shown = (showArchived ? archived : active)
    .filter((b) => !kind || b.kind === kind)
    .filter((b) => !statusId || b.statusId === statusId)
    .filter((b) => !genreId || b.genreId === genreId)
    .filter(
      (b) =>
        !q ||
        (b.title + " " + b.description).toLowerCase().includes(q.toLowerCase())
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const labelName = (list: Label[], id: string | null) =>
    list.find((l) => l.id === id)?.name ?? null;

  return (
    <>
      <SectionHead
        title={showArchived ? "Archived books" : "Books"}
        sub={`${active.length} active · ${archived.length} archived`}
        actions={
          <div className="toolbar">
            <input
              className="input search-input"
              placeholder="Search books…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              className={`btn ghost ${showArchived ? "active" : ""}`}
              onClick={() => setShowArchived((v) => !v)}
            >
              <Archive size={14} />
              {showArchived ? "Back to active" : "Archived"}
            </button>
            <button className="btn" onClick={() => setCreating(true)}>
              <Plus size={14} /> New book
            </button>
          </div>
        }
      />

      <FilterRow
        label="Type"
        value={kind}
        onChange={setKind}
        items={[
          { id: "fiction", label: "Fiction" },
          { id: "nonfiction", label: "Non-fiction" },
        ]}
      />
      <FilterRow
        label="Status"
        value={statusId}
        onChange={setStatusId}
        items={db.statuses.map((s) => ({ id: s.id, label: s.name }))}
        onManage={() => setManaging("statuses")}
      />
      <FilterRow
        label="Genre"
        value={genreId}
        onChange={setGenreId}
        items={db.genres.map((g) => ({ id: g.id, label: g.name }))}
        onManage={() => setManaging("genres")}
      />

      {shown.length === 0 ? (
        db.books.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No books yet"
            hint="Add the book you're working on — you can archive it later when you want it out of sight."
            action={
              <button className="btn" onClick={() => setCreating(true)}>
                <Plus size={14} /> New book
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={Search}
            title="Nothing matches"
            hint="No books match the current filters."
          />
        )
      ) : (
        <div className="card-grid">
          {shown.map((b) => (
            <div className="card" key={b.id} onClick={() => setOpenId(b.id)}>
              <div className="stripe" />
              <h3>{b.title}</h3>
              <p>{b.description || "No description yet."}</p>
              <div className="meta-row">
                {labelName(db.statuses, b.statusId) && (
                  <span className="badge">
                    <span className="b-dot" />
                    {labelName(db.statuses, b.statusId)}
                  </span>
                )}
                {labelName(db.genres, b.genreId) && (
                  <span className="badge neutral">
                    {labelName(db.genres, b.genreId)}
                  </span>
                )}
                <span className="badge neutral">
                  {b.kind === "fiction" ? "Fiction" : "Non-fiction"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <BookForm
          onClose={() => setCreating(false)}
          onSave={(book) => {
            update((d) => ({ ...d, books: [...d.books, book] }));
            setCreating(false);
            setOpenId(book.id);
          }}
        />
      )}

      {managing === "statuses" && (
        <Modal title="Edit statuses" onClose={() => setManaging(null)}>
          <LabelManager
            items={db.statuses}
            addPlaceholder="New status name…"
            deleteHint="Deleting a status leaves its books without a status — nothing else is lost."
            onAdd={(name) =>
              update((d) => ({
                ...d,
                statuses: [...d.statuses, { id: uid(), brainId: "books", name }],
              }))
            }
            onRename={(id, name) =>
              update((d) => ({ ...d, statuses: patchById(d.statuses, id, { name }) }))
            }
            onDelete={(id) =>
              update((d) => ({
                ...d,
                statuses: removeById(d.statuses, id),
                books: d.books.map((b) =>
                  b.statusId === id ? { ...b, statusId: null } : b
                ),
              }))
            }
          />
        </Modal>
      )}
      {managing === "genres" && (
        <Modal title="Edit genres" onClose={() => setManaging(null)}>
          <LabelManager
            items={db.genres}
            addPlaceholder="New genre name…"
            deleteHint="Deleting a genre leaves its books without a genre — nothing else is lost."
            onAdd={(name) =>
              update((d) => ({
                ...d,
                genres: [...d.genres, { id: uid(), brainId: "books", name }],
              }))
            }
            onRename={(id, name) =>
              update((d) => ({ ...d, genres: patchById(d.genres, id, { name }) }))
            }
            onDelete={(id) =>
              update((d) => ({
                ...d,
                genres: removeById(d.genres, id),
                books: d.books.map((b) =>
                  b.genreId === id ? { ...b, genreId: null } : b
                ),
              }))
            }
          />
        </Modal>
      )}
    </>
  );
}

/* ---------- create form ---------- */

function BookForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (b: Book) => void;
}) {
  const [db] = useDb();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<Book["kind"]>("fiction");
  const [statusId, setStatusId] = useState<string | null>(
    db.statuses[0]?.id ?? null
  );
  const [genreId, setGenreId] = useState<string | null>(null);

  const save = () => {
    if (!title.trim()) return;
    onSave({
      id: uid(),
      title: title.trim(),
      description: description.trim(),
      kind,
      statusId,
      genreId,
      archived: false,
      createdAt: now(),
      updatedAt: now(),
    });
  };

  return (
    <Modal title="New book" onClose={onClose}>
      <Field label="Title">
        <input
          className="input"
          autoFocus
          value={title}
          placeholder="The next great book…"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
      </Field>
      <Field label="Type">
        <div className="seg">
          <button
            className={kind === "fiction" ? "active" : ""}
            onClick={() => setKind("fiction")}
          >
            Fiction
          </button>
          <button
            className={kind === "nonfiction" ? "active" : ""}
            onClick={() => setKind("nonfiction")}
          >
            Non-fiction
          </button>
        </div>
      </Field>
      <div className="form-row">
        <Field label="Status">
          <select
            className="input"
            value={statusId ?? ""}
            onChange={(e) => setStatusId(e.target.value || null)}
          >
            <option value="">No status</option>
            {db.statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Genre">
          <select
            className="input"
            value={genreId ?? ""}
            onChange={(e) => setGenreId(e.target.value || null)}
          >
            <option value="">No genre</option>
            {db.genres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Description">
        <textarea
          className="input"
          value={description}
          placeholder="What is this book about?"
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <div className="m-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn" onClick={save} disabled={!title.trim()}>
          Create book
        </button>
      </div>
    </Modal>
  );
}

/* ---------- workspace: one book, full focus ---------- */

function BookWorkspace({ book, onBack }: { book: Book; onBack: () => void }) {
  const [db, update] = useDb();
  const [confirmDel, setConfirmDel] = useState(false);

  const patch = (p: Partial<Book>) =>
    update((d) => ({
      ...d,
      books: patchById(d.books, book.id, { ...p, updatedAt: now() }),
    }));

  const del = () => {
    update((d) => ({
      ...d,
      books: removeById(d.books, book.id),
      notes: d.notes.filter((n) => n.ownerId !== book.id),
    }));
    onBack();
  };

  return (
    <>
      <div className="ws-head">
        <button className="ws-back" onClick={onBack}>
          <ArrowLeft size={14} /> All books
        </button>
        <div className="toolbar">
          <button
            className="btn ghost small"
            onClick={() => patch({ archived: !book.archived })}
          >
            {book.archived ? (
              <>
                <ArchiveRestore size={13} /> Unarchive
              </>
            ) : (
              <>
                <Archive size={13} /> Archive
              </>
            )}
          </button>
          <button
            className="btn danger small"
            onClick={() => setConfirmDel(true)}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      <input
        className="ws-title"
        value={book.title}
        placeholder="Book title"
        onChange={(e) => patch({ title: e.target.value })}
      />

      <div className="ws-meta">
        <div className="seg">
          <button
            className={book.kind === "fiction" ? "active" : ""}
            onClick={() => patch({ kind: "fiction" })}
          >
            Fiction
          </button>
          <button
            className={book.kind === "nonfiction" ? "active" : ""}
            onClick={() => patch({ kind: "nonfiction" })}
          >
            Non-fiction
          </button>
        </div>
        <select
          className="input"
          value={book.statusId ?? ""}
          onChange={(e) => patch({ statusId: e.target.value || null })}
        >
          <option value="">No status</option>
          {db.statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={book.genreId ?? ""}
          onChange={(e) => patch({ genreId: e.target.value || null })}
        >
          <option value="">No genre</option>
          {db.genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        {book.archived && <span className="badge neutral">Archived</span>}
      </div>

      <Field label="Description">
        <textarea
          className="input"
          value={book.description}
          placeholder="What is this book about?"
          onChange={(e) => patch({ description: e.target.value })}
        />
      </Field>

      <div className="ws-section">
        <h4>Notes for this book</h4>
        <NotesPanel brainId="books" ownerId={book.id} />
      </div>

      {confirmDel && (
        <Confirm
          message={`Delete "${book.title}" and all its notes? This can't be undone.`}
          onConfirm={del}
          onCancel={() => setConfirmDel(false)}
        />
      )}
    </>
  );
}
