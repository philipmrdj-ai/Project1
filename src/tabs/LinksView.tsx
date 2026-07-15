import { useState } from "react";
import {
  ExternalLink,
  Link as LinkIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useSearch } from "../App";
import {
  Confirm,
  EmptyState,
  Field,
  IconBtn,
  LabelManager,
  Modal,
} from "../components/ui";
import { now, patchById, removeById, uid, useDb } from "../state/store";
import { LinkItem } from "../state/types";
import { FilterRow, SectionHead } from "./shared";

function normalizeUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return "";
  return /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Best-effort page title: metadata can't be read cross-origin from a
 *  browser, so we fall back to a cleaned-up domain name. */
function autoTitle(url: string): string {
  const d = domainOf(url);
  const name = d.split(".")[0] ?? d;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function LinksView() {
  const [db, update] = useDb();
  const q = useSearch();
  const [catId, setCatId] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);
  const [editing, setEditing] = useState<LinkItem | null>(null);
  const [confirmDel, setConfirmDel] = useState<LinkItem | null>(null);
  const [url, setUrl] = useState("");

  const cats = db.linkCategories;
  const catName = (id: string | null) => cats.find((c) => c.id === id)?.name;

  const links = db.links
    .filter((l) => !catId || l.categoryId === catId)
    .filter(
      (l) =>
        !q ||
        (l.title + " " + l.url + " " + l.note)
          .toLowerCase()
          .includes(q.toLowerCase())
    )
    .sort((a, b) => b.createdAt - a.createdAt);

  const addLink = () => {
    const u = normalizeUrl(url);
    if (!u) return;
    const item: LinkItem = {
      id: uid(),
      title: autoTitle(u),
      url: u,
      categoryId: catId,
      note: "",
      createdAt: now(),
    };
    update((d) => ({ ...d, links: [...d.links, item] }));
    setUrl("");
    setEditing(item);
  };

  return (
    <>
      <SectionHead
        title="Links"
        sub="One place for every link — courses, articles, tools, documents"
      />

      <div className="capture-bar">
        <LinkIcon size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} />
        <input
          placeholder="Paste a link and press Enter — name and notes come after…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addLink()}
        />
        <button className="btn small" onClick={addLink} disabled={!url.trim()}>
          <Plus size={13} /> Save link
        </button>
      </div>

      <FilterRow
        label="Category"
        value={catId}
        onChange={setCatId}
        items={cats.map((c) => ({ id: c.id, label: c.name }))}
        onManage={() => setManaging(true)}
      />

      {links.length === 0 ? (
        db.links.length === 0 ? (
          <EmptyState
            icon={LinkIcon}
            title="No links saved yet"
            hint="Paste any URL above. Give it a name, a category and a note so future-you knows why it mattered."
          />
        ) : (
          <EmptyState
            icon={Search}
            title="Nothing matches"
            hint="No links match the current filter or search."
          />
        )
      ) : (
        links.map((l) => (
          <div className="link-card" key={l.id}>
            <div className="link-fav">
              <img
                src={`https://www.google.com/s2/favicons?domain=${domainOf(l.url)}&sz=64`}
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div className="link-main">
              <a href={l.url} target="_blank" rel="noreferrer">
                {l.title} <ExternalLink size={11} style={{ verticalAlign: -1 }} />
              </a>
              <div className="l-url">{l.url}</div>
              {l.note && <div className="l-note">{l.note}</div>}
            </div>
            {l.categoryId && (
              <span className="badge neutral">{catName(l.categoryId)}</span>
            )}
            <IconBtn title="Edit link" onClick={() => setEditing(l)}>
              <Pencil size={14} />
            </IconBtn>
            <IconBtn title="Delete link" danger onClick={() => setConfirmDel(l)}>
              <Trash2 size={14} />
            </IconBtn>
          </div>
        ))
      )}

      {editing && (
        <LinkModal
          link={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            update((d) => ({ ...d, links: patchById(d.links, editing.id, patch) }));
            setEditing(null);
          }}
        />
      )}

      {managing && (
        <Modal title="Edit categories" onClose={() => setManaging(false)}>
          <LabelManager
            items={cats}
            addPlaceholder="New category name…"
            deleteHint="Deleting a category leaves its links uncategorized — nothing else is lost."
            onAdd={(name) =>
              update((d) => ({
                ...d,
                linkCategories: [
                  ...d.linkCategories,
                  { id: uid(), brainId: "private", name },
                ],
              }))
            }
            onRename={(id, name) =>
              update((d) => ({
                ...d,
                linkCategories: patchById(d.linkCategories, id, { name }),
              }))
            }
            onDelete={(id) =>
              update((d) => ({
                ...d,
                linkCategories: removeById(d.linkCategories, id),
                links: d.links.map((l) =>
                  l.categoryId === id ? { ...l, categoryId: null } : l
                ),
              }))
            }
          />
        </Modal>
      )}

      {confirmDel && (
        <Confirm
          message={`Delete the link "${confirmDel.title}"?`}
          onConfirm={() => {
            update((d) => ({ ...d, links: removeById(d.links, confirmDel.id) }));
            setConfirmDel(null);
          }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </>
  );
}

function LinkModal({
  link,
  onClose,
  onSave,
}: {
  link: LinkItem;
  onClose: () => void;
  onSave: (patch: Partial<LinkItem>) => void;
}) {
  const [db] = useDb();
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [categoryId, setCategoryId] = useState<string | null>(link.categoryId);
  const [note, setNote] = useState(link.note);

  const save = () => {
    const u = normalizeUrl(url);
    if (!title.trim() || !u) return;
    onSave({ title: title.trim(), url: u, categoryId, note: note.trim() });
  };

  return (
    <Modal title="Edit link" onClose={onClose}>
      <div className="form-row">
        <Field label="Name">
          <input
            className="input"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Category">
          <select
            className="input"
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(e.target.value || null)}
          >
            <option value="">No category</option>
            {db.linkCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="URL">
        <input
          className="input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </Field>
      <Field label="Notes">
        <textarea
          className="input"
          value={note}
          placeholder="Why did you save this? What's inside?"
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      <div className="m-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn"
          onClick={save}
          disabled={!title.trim() || !url.trim()}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}
