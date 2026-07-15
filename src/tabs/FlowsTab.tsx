import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Pencil,
  Plus,
  Trash2,
  Waypoints,
  X,
} from "lucide-react";
import {
  Confirm,
  EmptyState,
  Field,
  IconBtn,
  Modal,
} from "../components/ui";
import { patchById, removeById, uid, useDb } from "../state/store";
import { BrainId, Flow, FlowStep } from "../state/types";
import { SectionHead } from "./shared";

export function FlowsTab({ brainId }: { brainId: BrainId }) {
  const [db, update] = useDb();
  const flows = db.flows.filter((f) => f.brainId === brainId);
  const [editing, setEditing] = useState<Flow | "new" | null>(null);
  const [confirmDel, setConfirmDel] = useState<Flow | null>(null);
  const [addingStepFor, setAddingStepFor] = useState<string | null>(null);
  const [stepDraft, setStepDraft] = useState("");

  const patchFlow = (id: string, p: Partial<Flow>) =>
    update((d) => ({ ...d, flows: patchById(d.flows, id, p) }));

  const toggleStep = (flow: Flow, stepId: string) =>
    patchFlow(flow.id, {
      steps: flow.steps.map((s) =>
        s.id === stepId ? { ...s, done: !s.done } : s
      ),
    });

  const addStep = (flow: Flow) => {
    const label = stepDraft.trim();
    if (label) {
      patchFlow(flow.id, {
        steps: [...flow.steps, { id: uid(), label, done: false }],
      });
    }
    setStepDraft("");
    setAddingStepFor(null);
  };

  return (
    <>
      <SectionHead
        title="Process flows"
        sub="Step-by-step processes — always know what's next"
        actions={
          <button className="btn" onClick={() => setEditing("new")}>
            <Plus size={14} /> New flow
          </button>
        }
      />

      {flows.length === 0 ? (
        <EmptyState
          icon={Waypoints}
          title="No flows yet"
          hint="A flow is a repeatable process — like idea → outline → draft → edit → publish. Check off steps as you go."
          action={
            <button className="btn" onClick={() => setEditing("new")}>
              <Plus size={14} /> New flow
            </button>
          }
        />
      ) : (
        flows.map((f) => {
          const doneCount = f.steps.filter((s) => s.done).length;
          const currentIdx = f.steps.findIndex((s) => !s.done);
          return (
            <div className="flow-card" key={f.id}>
              <div className="flow-head">
                <div>
                  <h3>{f.name}</h3>
                  {f.description && <div className="sub">{f.description}</div>}
                </div>
                <div className="toolbar">
                  <span className="badge">
                    {doneCount === f.steps.length && f.steps.length > 0
                      ? "Complete"
                      : `Step ${Math.min(currentIdx + 1, f.steps.length)} of ${
                          f.steps.length
                        }`}
                  </span>
                  <IconBtn title="Edit flow" onClick={() => setEditing(f)}>
                    <Pencil size={14} />
                  </IconBtn>
                  <IconBtn title="Delete flow" danger onClick={() => setConfirmDel(f)}>
                    <Trash2 size={14} />
                  </IconBtn>
                </div>
              </div>
              <div className="flow-steps">
                {f.steps.map((s, i) => (
                  <div className="flow-step" key={s.id}>
                    {i > 0 && <div className="flow-link" />}
                    <button
                      className={`flow-node clickable ${
                        s.done ? "done" : i === currentIdx ? "current" : ""
                      }`}
                      style={{ fontFamily: "inherit" }}
                      title={s.done ? "Mark as not done" : "Mark as done"}
                      onClick={() => toggleStep(f, s.id)}
                    >
                      {s.done && <Check size={12} />}
                      {s.label}
                    </button>
                  </div>
                ))}
                {addingStepFor === f.id ? (
                  <input
                    className="input"
                    style={{ width: 170, marginLeft: 10 }}
                    autoFocus
                    placeholder="Step name…"
                    value={stepDraft}
                    onChange={(e) => setStepDraft(e.target.value)}
                    onBlur={() => addStep(f)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addStep(f);
                      if (e.key === "Escape") {
                        setStepDraft("");
                        setAddingStepFor(null);
                      }
                    }}
                  />
                ) : (
                  <button
                    className="flow-add-step"
                    onClick={() => setAddingStepFor(f.id)}
                  >
                    <Plus size={12} /> Step
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {editing && (
        <FlowForm
          brainId={brainId}
          flow={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmDel && (
        <Confirm
          message={`Delete the flow "${confirmDel.name}"?`}
          onConfirm={() => {
            update((d) => ({ ...d, flows: removeById(d.flows, confirmDel.id) }));
            setConfirmDel(null);
          }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </>
  );
}

/* ---------- create / edit form ---------- */

function FlowForm({
  brainId,
  flow,
  onClose,
}: {
  brainId: BrainId;
  flow: Flow | null;
  onClose: () => void;
}) {
  const [, update] = useDb();
  const [name, setName] = useState(flow?.name ?? "");
  const [description, setDescription] = useState(flow?.description ?? "");
  const [steps, setSteps] = useState<FlowStep[]>(flow?.steps ?? []);

  const moveStep = (i: number, dir: -1 | 1) =>
    setSteps((ss) => {
      const j = i + dir;
      if (j < 0 || j >= ss.length) return ss;
      const copy = [...ss];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const save = () => {
    if (!name.trim()) return;
    const cleaned = steps.filter((s) => s.label.trim());
    if (flow) {
      update((d) => ({
        ...d,
        flows: patchById(d.flows, flow.id, {
          name: name.trim(),
          description: description.trim(),
          steps: cleaned,
        }),
      }));
    } else {
      update((d) => ({
        ...d,
        flows: [
          ...d.flows,
          {
            id: uid(),
            brainId,
            name: name.trim(),
            description: description.trim(),
            steps: cleaned,
          },
        ],
      }));
    }
    onClose();
  };

  return (
    <Modal title={flow ? "Edit flow" : "New flow"} onClose={onClose}>
      <Field label="Name">
        <input
          className="input"
          autoFocus
          value={name}
          placeholder="e.g. Novel production process"
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Description">
        <input
          className="input"
          value={description}
          placeholder="What is this process for?"
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field label="Steps">
        {steps.map((s, i) => (
          <div className="step-row" key={s.id}>
            <input
              className="input"
              value={s.label}
              placeholder={`Step ${i + 1}`}
              onChange={(e) =>
                setSteps((ss) =>
                  ss.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x))
                )
              }
            />
            <IconBtn title="Move up" onClick={() => moveStep(i, -1)}>
              <ArrowUp size={14} />
            </IconBtn>
            <IconBtn title="Move down" onClick={() => moveStep(i, 1)}>
              <ArrowDown size={14} />
            </IconBtn>
            <IconBtn
              title="Remove step"
              danger
              onClick={() => setSteps((ss) => ss.filter((x) => x.id !== s.id))}
            >
              <X size={14} />
            </IconBtn>
          </div>
        ))}
        <button
          className="btn ghost small"
          style={{ marginTop: 6 }}
          onClick={() =>
            setSteps((ss) => [...ss, { id: uid(), label: "", done: false }])
          }
        >
          <Plus size={13} /> Add step
        </button>
      </Field>
      <div className="m-actions">
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn" onClick={save} disabled={!name.trim()}>
          {flow ? "Save changes" : "Create flow"}
        </button>
      </div>
    </Modal>
  );
}
