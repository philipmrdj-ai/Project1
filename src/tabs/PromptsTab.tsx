import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Link2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  Confirm,
  EmptyState,
  Field,
  IconBtn,
  LabelManager,
  Modal,
} from "../components/ui";
import {
  copyText,
  now,
  patchById,
  removeById,
  uid,
  useDb,
} from "../state/store";
import { BrainId, PipelineStep, Prompt } from "../state/types";
import { FilterRow, SectionHead } from "./shared";

type Sort = "recent" | "az" | "most";

export function PromptsTab({ brainId }: { brainId: BrainId }) {
  const [db, update] = useDb();
  const [q, setQ] = useState("");
  const [catId, setCatId] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("recent");
  const [editing, setEditing] = useState<Prompt | "new" | null>(null);
  const [managingCats, setManagingCats] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Prompt | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const cats = db.promptCategories.filter((c) => c.brainId === brainId);
  const prompts = db.prompts
    .filter((p) => p.brainId === brainId)
    .filter((p) => !catId || p.categoryId === catId)
    .filter(
      (p) =>
        !q ||
        (p.title + " " + p.description + " " + p.body)
          .toLowerCase()
          .includes(q.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "most") return b.copiedCount - a.copiedCount;
      return Math.max(b.lastUsedAt, b.updatedAt) - Math.max(a.lastUsedAt, a.updatedAt);
    });

  const markCopied = (key: string, promptId: string) => {
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1400);
    update((d) => ({
      ...d,
      prompts: d.prompts.map((p) =>
        p.id === promptId
          ? { ...p, copiedCount: p.copiedCount + 1, lastUsedAt: now() }
          : p
      ),
    }));
  };

  const copyBody = async (p: Prompt) => {
    if (await copyText(p.body)) markCopied(p.id, p.id);
  };
  const copyStep = async (p: Prompt, s: PipelineStep) => {
    if (await copyText(s.body || s.title)) markCopied(s.id, p.id);
  };

  return (
    <>
      <SectionHead
        title="Prompts"
        sub="Your prompt library — copy with one click"
        actions={
          <div className="toolbar">
            <input
              className="input search-input"
              placeholder="Search prompts…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn" onClick={() => setEditing("new")}>
              <Plus size={14} /> New prompt
            </button>
          </div>
        }
      />

      <FilterRow
        label="Category"
        value={catId}
        onChange={setCatId}
        items={cats.map((c) => ({ id: c.id, label: c.name }))}
        onManage={() => setManagingCats(true)}
      />
      <div className="chip-row">
        <span className="chip-label">Sort</span>
        {(
          [
            ["recent", "Recently used"],
            ["az", "A–Z"],
            ["most", "Most used"],
          ] as [Sort, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            className={`chip ${sort === id ? "active" : ""}`}
            onClick={() => setSort(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {prompts.length === 0 ? (
        db.prompts.filter((p) => p.brainId === brainId).length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No prompts yet"
            hint="Store the prompts you reuse — each gets a one-click copy button, and you can chain pipeline steps onto any of them."
            action={
              <button className="btn" onClick={() => setEditing("new")}>
                <Plus size={14} /> New prompt
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={Search}
            title="Nothing matches"
            hint="No prompts match the current filters."
          />
        )
      ) : (
        prompts.map((p) => (
          <div className="prompt-card" key={p.id}>
            <div className="prompt-top">
              <div>
                <h3>{p.title}</h3>
                {p.description && <p>{p.description}</p>}
              </div>
              <div className="prompt-actions">
                {p.categoryId && (
                  <span className="badge neutral">
                    {cats.find((c) => c.id === p.categoryId)?.name}
                  </span>
                )}
                <button className="btn small" onClick={() => copyBody(p)}>
                  {copiedKey === p.id ? <Check size={13} /> : <Copy size={13} />}
                  {copiedKey === p.id ? "Copied" : "Copy"}
                </button>
                <IconBtn title="Edit prompt" onClick={() => setEditing(p)}>
                  <Pencil size={14} />
                </IconBtn>
                <IconBtn title="Delete prompt" danger onClick={() => setConfirmDel(p)}>
                  <Trash2 size={14} />
                </IconBtn>
              </div>
            </div>
            {p.body && <div className="prompt-body">{p.body}</div>}
            {p.pipeline.length > 0 && (
              <div className="pipeline-strip">
                <Link2 size={13} /> Pipeline:
                {p.pipeline.map((s, i) => (
                  <span
                    key={s.id}
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    {i > 0 && "→"}
                    <button
                      className="p-step clickable"
                      style={{ background: "transparent", fontFamily: "inherit" }}
                      title="Copy this step"
                      onClick={() => copyStep(p, s)}
                    >
                      {copiedKey === s.id ? "✓ Copied" : s.title}
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {editing && (
        <PromptForm
          brainId={brainId}
          prompt={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {managingCats && (
        <Modal title="Edit categories" onClose={() => setManagingCats(false)}>
          <LabelManager
            items={cats}
            addPlaceholder="New category name…"
            deleteHint="Deleting a category leaves its prompts uncategorized — nothing else is lost."
            onAdd={(name) =>
              update((d) => ({
                ...d,
                promptCategories: [
                  ...d.promptCategories,
                  { id: uid(), brainId, name },
                ],
              }))
            }
            onRename={(id, name) =>
              update((d) => ({
                ...d,
                promptCategories: patchById(d.promptCategories, id, { name }),
              }))
            }
            onDelete={(id) =>
              update((d) => ({
                ...d,
                promptCategories: removeById(d.promptCategories, id),
                prompts: d.prompts.map((p) =>
                  p.categoryId === id ? { ...p, categoryId: null } : p
                ),
              }))
            }
          />
        </Modal>
      )}

      {confirmDel && (
        <Confirm
          message={`Delete the prompt "${confirmDel.title}"?`}
          onConfirm={() => {
            update((d) => ({ ...d, prompts: removeById(d.prompts, confirmDel.id) }));
            setConfirmDel(null);
          }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </>
  );
}

/* ---------- create / edit form with pipeline editor ---------- */

function PromptForm({
  brainId,
  prompt,
  onClose,
}: {
  brainId: BrainId;
  prompt: Prompt | null;
  onClose: () => void;
}) {
  const [db, update] = useDb();
  const cats = db.promptCategories.filter((c) => c.brainId === brainId);

  const [title, setTitle] = useState(prompt?.title ?? "");
  const [description, setDescription] = useState(prompt?.description ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    prompt?.categoryId ?? null
  );
  const [body, setBody] = useState(prompt?.body ?? "");
  const [pipeline, setPipeline] = useState<PipelineStep[]>(
    prompt?.pipeline ?? []
  );

  const patchStep = (id: string, patch: Partial<PipelineStep>) =>
    setPipeline((ps) => ps.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const moveStep = (i: number, dir: -1 | 1) =>
    setPipeline((ps) => {
      const j = i + dir;
      if (j < 0 || j >= ps.length) return ps;
      const copy = [...ps];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const save = () => {
    if (!title.trim()) return;
    const cleaned = pipeline.filter((s) => s.title.trim() || s.body.trim());
    if (prompt) {
      update((d) => ({
        ...d,
        prompts: patchById(d.prompts, prompt.id, {
          title: title.trim(),
          description: description.trim(),
          categoryId,
          body,
          pipeline: cleaned,
          updatedAt: now(),
        }),
      }));
    } else {
      update((d) => ({
        ...d,
        prompts: [
          ...d.prompts,
          {
            id: uid(),
            brainId,
            title: title.trim(),
            description: description.trim(),
            categoryId,
            body,
            pipeline: cleaned,
            copiedCount: 0,
            lastUsedAt: 0,
            updatedAt: now(),
          },
        ],
      }));
    }
    onClose();
  };

  return (
    <Modal title={prompt ? "Edit prompt" : "New prompt"} onClose={onClose} wide>
      <div className="form-row">
        <Field label="Title">
          <input
            className="input"
            autoFocus
            value={title}
            placeholder="e.g. Chapter deep-edit"
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
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Description">
        <input
          className="input"
          value={description}
          placeholder="What is this prompt for?"
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field label="Prompt text">
        <textarea
          className="input mono"
          value={body}
          placeholder="The prompt you'll copy…"
          onChange={(e) => setBody(e.target.value)}
        />
      </Field>

      <Field label="Pipeline steps (optional)">
        {pipeline.map((s, i) => (
          <div key={s.id} className="step-row" style={{ alignItems: "flex-start" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <input
                className="input"
                value={s.title}
                placeholder={`Step ${i + 1} name`}
                onChange={(e) => patchStep(s.id, { title: e.target.value })}
              />
              <textarea
                className="input mono"
                style={{ minHeight: 64 }}
                value={s.body}
                placeholder="Prompt text for this step"
                onChange={(e) => patchStep(s.id, { body: e.target.value })}
              />
            </div>
            <IconBtn title="Move up" onClick={() => moveStep(i, -1)}>
              <ArrowUp size={14} />
            </IconBtn>
            <IconBtn title="Move down" onClick={() => moveStep(i, 1)}>
              <ArrowDown size={14} />
            </IconBtn>
            <IconBtn
              title="Remove step"
              danger
              onClick={() => setPipeline((ps) => ps.filter((x) => x.id !== s.id))}
            >
              <X size={14} />
            </IconBtn>
          </div>
        ))}
        <button
          className="btn ghost small"
          style={{ marginTop: 6 }}
          onClick={() =>
            setPipeline((ps) => [...ps, { id: uid(), title: "", body: "" }])
          }
        >
          <Plus size={13} /> Add pipeline step
        </button>
      </Field>

      <div className="m-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn" onClick={save} disabled={!title.trim()}>
          {prompt ? "Save changes" : "Create prompt"}
        </button>
      </div>
    </Modal>
  );
}
