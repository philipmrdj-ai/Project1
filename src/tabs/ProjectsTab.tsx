import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Plus,
  Rocket,
  Search,
  Trash2,
} from "lucide-react";
import { useSearch } from "../App";
import { NotesPanel } from "../components/NotesPanel";
import {
  Confirm,
  EmptyState,
  Field,
  LabelManager,
  Modal,
} from "../components/ui";
import { useScrollFade } from "../components/useScrollFade";
import { now, patchById, removeById, uid, useDb } from "../state/store";
import { Label, Project } from "../state/types";
import {
  FilterRow,
  ItemsView,
  SectionHead,
  useViewPref,
  ViewSwitcher,
} from "./shared";

export function ProjectsTab() {
  const [db, update] = useDb();
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [managing, setManaging] = useState<"statuses" | "categories" | null>(
    null
  );
  const q = useSearch();
  const [statusId, setStatusId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [view, setView] = useViewPref("projects");

  const openProject = db.projects.find((p) => p.id === openId);
  if (openProject) {
    return (
      <ProjectWorkspace project={openProject} onBack={() => setOpenId(null)} />
    );
  }

  const labelName = (list: Label[], id: string | null) =>
    list.find((l) => l.id === id)?.name ?? null;

  const active = db.projects.filter((p) => !p.archived);
  const archived = db.projects.filter((p) => p.archived);
  const shown = (showArchived ? archived : active)
    .filter((p) => !statusId || p.statusId === statusId)
    .filter((p) => !categoryId || p.categoryId === categoryId)
    .filter(
      (p) =>
        !q ||
        (p.title + " " + p.description).toLowerCase().includes(q.toLowerCase())
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <>
      <SectionHead
        title={showArchived ? "Archived projects" : "Projects"}
        sub={`${active.length} active · ${archived.length} archived`}
        actions={
          <div className="toolbar">
            <ViewSwitcher value={view} onChange={setView} />
            <button
              className={`btn ghost ${showArchived ? "active" : ""}`}
              onClick={() => setShowArchived((v) => !v)}
            >
              <Archive size={14} />
              {showArchived ? "Back to active" : "Archived"}
            </button>
            <button className="btn" onClick={() => setCreating(true)}>
              <Plus size={14} /> Project
            </button>
          </div>
        }
      />

      <FilterRow
        label="Status"
        value={statusId}
        onChange={setStatusId}
        items={db.projectStatuses.map((s) => ({ id: s.id, label: s.name }))}
        onManage={() => setManaging("statuses")}
      />
      <FilterRow
        label="Category"
        value={categoryId}
        onChange={setCategoryId}
        items={db.projectCategories.map((c) => ({ id: c.id, label: c.name }))}
        onManage={() => setManaging("categories")}
      />

      {shown.length === 0 ? (
        db.projects.length === 0 ? (
          <EmptyState
            icon={Rocket}
            title="No projects yet"
            hint="Add a project you're working on — give it a status and category, and open it for notes and details."
            action={
              <button className="btn" onClick={() => setCreating(true)}>
                <Plus size={14} /> New project
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={Search}
            title="Nothing matches"
            hint="No projects match the current filters."
          />
        )
      ) : (
        <ItemsView
          view={view}
          onOpen={setOpenId}
          items={shown.map((p) => ({
            id: p.id,
            title: p.title,
            desc: p.description,
            status: labelName(db.projectStatuses, p.statusId),
            meta: labelName(db.projectCategories, p.categoryId),
          }))}
        />
      )}

      {creating && (
        <ProjectForm
          onClose={() => setCreating(false)}
          onSave={(project) => {
            update((d) => ({ ...d, projects: [...d.projects, project] }));
            setCreating(false);
            setOpenId(project.id);
          }}
        />
      )}

      {managing === "statuses" && (
        <Modal title="Edit statuses" onClose={() => setManaging(null)}>
          <LabelManager
            items={db.projectStatuses}
            addPlaceholder="New status name…"
            deleteHint="Deleting a status leaves its projects without a status — nothing else is lost."
            onAdd={(name) =>
              update((d) => ({
                ...d,
                projectStatuses: [
                  ...d.projectStatuses,
                  { id: uid(), brainId: "projects", name },
                ],
              }))
            }
            onRename={(id, name) =>
              update((d) => ({
                ...d,
                projectStatuses: patchById(d.projectStatuses, id, { name }),
              }))
            }
            onDelete={(id) =>
              update((d) => ({
                ...d,
                projectStatuses: removeById(d.projectStatuses, id),
                projects: d.projects.map((p) =>
                  p.statusId === id ? { ...p, statusId: null } : p
                ),
              }))
            }
          />
        </Modal>
      )}
      {managing === "categories" && (
        <Modal title="Edit categories" onClose={() => setManaging(null)}>
          <LabelManager
            items={db.projectCategories}
            addPlaceholder="New category name…"
            deleteHint="Deleting a category leaves its projects without a category — nothing else is lost."
            onAdd={(name) =>
              update((d) => ({
                ...d,
                projectCategories: [
                  ...d.projectCategories,
                  { id: uid(), brainId: "projects", name },
                ],
              }))
            }
            onRename={(id, name) =>
              update((d) => ({
                ...d,
                projectCategories: patchById(d.projectCategories, id, { name }),
              }))
            }
            onDelete={(id) =>
              update((d) => ({
                ...d,
                projectCategories: removeById(d.projectCategories, id),
                projects: d.projects.map((p) =>
                  p.categoryId === id ? { ...p, categoryId: null } : p
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

function ProjectForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (p: Project) => void;
}) {
  const [db] = useDb();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState<string | null>(
    db.projectStatuses[0]?.id ?? null
  );
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const save = () => {
    if (!title.trim()) return;
    onSave({
      id: uid(),
      title: title.trim(),
      description: description.trim(),
      statusId,
      categoryId,
      archived: false,
      createdAt: now(),
      updatedAt: now(),
    });
  };

  return (
    <Modal title="New project" onClose={onClose}>
      <Field label="Title">
        <input
          className="input"
          autoFocus
          value={title}
          placeholder="What are you building?"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
      </Field>
      <div className="form-row">
        <Field label="Status">
          <select
            className="input"
            value={statusId ?? ""}
            onChange={(e) => setStatusId(e.target.value || null)}
          >
            <option value="">No status</option>
            {db.projectStatuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Category">
          <select
            className="input"
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(e.target.value || null)}
          >
            <option value="">No category</option>
            {db.projectCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Description">
        <textarea
          className="input"
          value={description}
          placeholder="What is this project about?"
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <div className="m-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn" onClick={save} disabled={!title.trim()}>
          Create project
        </button>
      </div>
    </Modal>
  );
}

/* ---------- workspace ---------- */

function ProjectWorkspace({
  project,
  onBack,
}: {
  project: Project;
  onBack: () => void;
}) {
  const [db, update] = useDb();
  const [confirmDel, setConfirmDel] = useState(false);
  const fadeRef = useScrollFade<HTMLDivElement>();

  const patch = (p: Partial<Project>) =>
    update((d) => ({
      ...d,
      projects: patchById(d.projects, project.id, { ...p, updatedAt: now() }),
    }));

  const del = () => {
    update((d) => ({
      ...d,
      projects: removeById(d.projects, project.id),
      notes: d.notes.filter((n) => n.ownerId !== project.id),
    }));
    onBack();
  };

  return (
    <>
      <div className="ws-head">
        <button className="ws-back" onClick={onBack}>
          <ArrowLeft size={14} /> All projects
        </button>
        <div className="toolbar">
          <button
            className="btn ghost small"
            onClick={() => patch({ archived: !project.archived })}
          >
            {project.archived ? (
              <>
                <ArchiveRestore size={13} /> Unarchive
              </>
            ) : (
              <>
                <Archive size={13} /> Archive
              </>
            )}
          </button>
          <button className="btn danger small" onClick={() => setConfirmDel(true)}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      <input
        className="ws-title"
        value={project.title}
        placeholder="Project title"
        onChange={(e) => patch({ title: e.target.value })}
      />

      <div className="ws-fade" ref={fadeRef}>
        <div className="ws-meta">
          <select
            className="input"
            value={project.statusId ?? ""}
            onChange={(e) => patch({ statusId: e.target.value || null })}
          >
            <option value="">No status</option>
            {db.projectStatuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={project.categoryId ?? ""}
            onChange={(e) => patch({ categoryId: e.target.value || null })}
          >
            <option value="">No category</option>
            {db.projectCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {project.archived && <span className="badge neutral">Archived</span>}
        </div>

        <Field label="Description">
          <textarea
            className="input"
            value={project.description}
            placeholder="What is this project about?"
            onChange={(e) => patch({ description: e.target.value })}
          />
        </Field>
      </div>

      <div className="ws-section">
        <h4>Notes for this project</h4>
        <NotesPanel brainId="projects" ownerId={project.id} />
      </div>

      {confirmDel && (
        <Confirm
          message={`Delete "${project.title}" and all its notes? This can't be undone.`}
          onConfirm={del}
          onCancel={() => setConfirmDel(false)}
        />
      )}
    </>
  );
}
