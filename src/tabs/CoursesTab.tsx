import { useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  GraduationCap,
  Link as LinkIcon,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { NotesPanel } from "../components/NotesPanel";
import {
  Confirm,
  EmptyState,
  Field,
  IconBtn,
  LabelManager,
  Modal,
} from "../components/ui";
import { now, patchById, removeById, uid, useDb } from "../state/store";
import { Course } from "../state/types";
import {
  FilterRow,
  ItemsView,
  SectionHead,
  useViewPref,
  ViewSwitcher,
} from "./shared";

type Sort = "recent" | "progress" | "az";

export function CoursesTab() {
  const [db, update] = useDb();
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [managing, setManaging] = useState(false);
  const [q, setQ] = useState("");
  const [statusId, setStatusId] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("recent");
  const [view, setView] = useViewPref("courses");

  const openCourse = db.courses.find((c) => c.id === openId);
  if (openCourse) {
    return <CourseWorkspace course={openCourse} onBack={() => setOpenId(null)} />;
  }

  const statusName = (id: string | null) =>
    db.courseStatuses.find((s) => s.id === id)?.name ?? null;

  const shown = db.courses
    .filter((c) => !statusId || c.statusId === statusId)
    .filter(
      (c) =>
        !q ||
        (c.title + " " + c.description).toLowerCase().includes(q.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "progress") return b.progress - a.progress;
      return b.updatedAt - a.updatedAt;
    });

  return (
    <>
      <SectionHead
        title="Learning center"
        sub={`${db.courses.length} course${db.courses.length === 1 ? "" : "s"} — everything you're learning, in one calm place`}
        actions={
          <div className="toolbar">
            <input
              className="input search-input"
              placeholder="Search courses…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <ViewSwitcher value={view} onChange={setView} />
            <button className="btn" onClick={() => setCreating(true)}>
              <Plus size={14} /> New course
            </button>
          </div>
        }
      />

      <FilterRow
        label="Status"
        value={statusId}
        onChange={setStatusId}
        items={db.courseStatuses.map((s) => ({ id: s.id, label: s.name }))}
        onManage={() => setManaging(true)}
      />
      <div className="chip-row">
        <span className="chip-label">Sort</span>
        {(
          [
            ["recent", "Recently active"],
            ["progress", "Progress"],
            ["az", "A–Z"],
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

      {shown.length === 0 ? (
        db.courses.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No courses yet"
            hint="Add a course you're taking — track progress, attach links and documents, and keep session notes."
            action={
              <button className="btn" onClick={() => setCreating(true)}>
                <Plus size={14} /> New course
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={Search}
            title="Nothing matches"
            hint="No courses match the current filters."
          />
        )
      ) : (
        <ItemsView
          view={view}
          onOpen={setOpenId}
          items={shown.map((c) => ({
            id: c.id,
            title: c.title,
            desc: c.description,
            badges: (
              <>
                {statusName(c.statusId) && (
                  <span className="badge">
                    <span className="b-dot" />
                    {statusName(c.statusId)}
                  </span>
                )}
                {c.links.length > 0 && (
                  <span className="badge neutral">
                    <LinkIcon size={11} /> {c.links.length}
                  </span>
                )}
              </>
            ),
            extra: (
              <div className="progress" title={`${c.progress}%`}>
                <div style={{ width: `${c.progress}%` }} />
              </div>
            ),
          }))}
        />
      )}

      {creating && (
        <CourseForm
          onClose={() => setCreating(false)}
          onSave={(course) => {
            update((d) => ({ ...d, courses: [...d.courses, course] }));
            setCreating(false);
            setOpenId(course.id);
          }}
        />
      )}

      {managing && (
        <Modal title="Edit statuses" onClose={() => setManaging(false)}>
          <LabelManager
            items={db.courseStatuses}
            addPlaceholder="New status name…"
            deleteHint="Deleting a status leaves its courses without a status — nothing else is lost."
            onAdd={(name) =>
              update((d) => ({
                ...d,
                courseStatuses: [
                  ...d.courseStatuses,
                  { id: uid(), brainId: "learning", name },
                ],
              }))
            }
            onRename={(id, name) =>
              update((d) => ({
                ...d,
                courseStatuses: patchById(d.courseStatuses, id, { name }),
              }))
            }
            onDelete={(id) =>
              update((d) => ({
                ...d,
                courseStatuses: removeById(d.courseStatuses, id),
                courses: d.courses.map((c) =>
                  c.statusId === id ? { ...c, statusId: null } : c
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

function CourseForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (c: Course) => void;
}) {
  const [db] = useDb();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState<string | null>(
    db.courseStatuses[0]?.id ?? null
  );

  const save = () => {
    if (!title.trim()) return;
    onSave({
      id: uid(),
      title: title.trim(),
      description: description.trim(),
      statusId,
      progress: 0,
      links: [],
      createdAt: now(),
      updatedAt: now(),
    });
  };

  return (
    <Modal title="New course" onClose={onClose}>
      <Field label="Title">
        <input
          className="input"
          autoFocus
          value={title}
          placeholder="What are you learning?"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
      </Field>
      <Field label="Status">
        <select
          className="input"
          value={statusId ?? ""}
          onChange={(e) => setStatusId(e.target.value || null)}
        >
          <option value="">No status</option>
          {db.courseStatuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Description">
        <textarea
          className="input"
          value={description}
          placeholder="What's this course about? Where does it live?"
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <div className="m-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn" onClick={save} disabled={!title.trim()}>
          Create course
        </button>
      </div>
    </Modal>
  );
}

/* ---------- workspace: one course, full focus ---------- */

function normalizeUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return "";
  return /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
}

function CourseWorkspace({
  course,
  onBack,
}: {
  course: Course;
  onBack: () => void;
}) {
  const [db, update] = useDb();
  const [confirmDel, setConfirmDel] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const patch = (p: Partial<Course>) =>
    update((d) => ({
      ...d,
      courses: patchById(d.courses, course.id, { ...p, updatedAt: now() }),
    }));

  const addLink = () => {
    const url = normalizeUrl(linkUrl);
    if (!url) return;
    patch({
      links: [
        ...course.links,
        { id: uid(), title: linkTitle.trim() || url, url },
      ],
    });
    setLinkTitle("");
    setLinkUrl("");
  };

  const del = () => {
    update((d) => ({
      ...d,
      courses: removeById(d.courses, course.id),
      notes: d.notes.filter((n) => n.ownerId !== course.id),
    }));
    onBack();
  };

  return (
    <>
      <div className="ws-head">
        <button className="ws-back" onClick={onBack}>
          <ArrowLeft size={14} /> All courses
        </button>
        <div className="toolbar">
          <button className="btn danger small" onClick={() => setConfirmDel(true)}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      <input
        className="ws-title"
        value={course.title}
        placeholder="Course title"
        onChange={(e) => patch({ title: e.target.value })}
      />

      <div className="ws-meta">
        <select
          className="input"
          value={course.statusId ?? ""}
          onChange={(e) => patch({ statusId: e.target.value || null })}
        >
          <option value="">No status</option>
          {db.courseStatuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <Field label="Progress">
        <div className="progress-edit">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={course.progress}
            onChange={(e) => patch({ progress: Number(e.target.value) })}
          />
          <span className="pct">{course.progress}%</span>
        </div>
      </Field>

      <Field label="Description">
        <textarea
          className="input"
          value={course.description}
          placeholder="What's this course about? Where does it live?"
          onChange={(e) => patch({ description: e.target.value })}
        />
      </Field>

      <div className="ws-section">
        <h4>Links &amp; documents</h4>
        {course.links.map((l) => (
          <div className="link-row" key={l.id}>
            <a href={l.url} target="_blank" rel="noreferrer">
              <ExternalLink size={12} style={{ verticalAlign: -1.5, marginRight: 5 }} />
              {l.title}
            </a>
            <span className="link-url">{l.url}</span>
            <IconBtn
              title="Remove link"
              danger
              onClick={() => patch({ links: course.links.filter((x) => x.id !== l.id) })}
            >
              <Trash2 size={13} />
            </IconBtn>
          </div>
        ))}
        <div className="link-add">
          <input
            className="input"
            style={{ maxWidth: 220 }}
            placeholder="Name (optional)"
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLink()}
          />
          <input
            className="input"
            placeholder="URL — course page, video, document, Drive file…"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLink()}
          />
          <button className="btn small" onClick={addLink} disabled={!linkUrl.trim()}>
            <Plus size={13} /> Add
          </button>
        </div>
      </div>

      <div className="ws-section">
        <h4>Notes for this course</h4>
        <NotesPanel brainId="learning" ownerId={course.id} />
      </div>

      {confirmDel && (
        <Confirm
          message={`Delete "${course.title}" and all its notes? This can't be undone.`}
          onConfirm={del}
          onCancel={() => setConfirmDel(false)}
        />
      )}
    </>
  );
}
