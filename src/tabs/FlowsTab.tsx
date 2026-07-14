import { PlaceholderHint, SectionHead } from "./shared";

const MOCK_FLOWS = [
  {
    name: "Novel production process",
    desc: "My standard path from idea to published book.",
    steps: ["Idea", "Outline", "First draft", "Self-edit", "Beta readers", "Final edit", "Publish"],
    current: 2,
  },
  {
    name: "Chapter revision loop",
    desc: "Repeatable checklist for each chapter revision.",
    steps: ["Read aloud", "Fix pacing", "Tighten prose", "Continuity check"],
    current: 0,
  },
];

export function FlowsTab({ brainId }: { brainId: string }) {
  return (
    <>
      <SectionHead
        title="Process flows"
        sub={`Step-by-step processes for the ${brainId} brain — always know what's next`}
        actions={<button className="btn">+ New flow</button>}
      />
      {MOCK_FLOWS.map((f) => (
        <div className="flow-card" key={f.name}>
          <div className="flow-head">
            <div>
              <h3>{f.name}</h3>
              <div className="sub" style={{ color: "var(--text-2)", fontSize: 13 }}>
                {f.desc}
              </div>
            </div>
            <span className="badge">
              Step {f.current + 1} of {f.steps.length}
            </span>
          </div>
          <div className="flow-steps">
            {f.steps.map((s, i) => (
              <div className="flow-step" key={s}>
                {i > 0 && <div className="flow-link" />}
                <div
                  className={`flow-node ${
                    i < f.current ? "done" : i === f.current ? "current" : ""
                  }`}
                >
                  {i < f.current && <span className="n-check">✓</span>}
                  {s}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <PlaceholderHint>
        Phase 2: add / reorder / check off steps, attach notes to each step,
        and track several projects through the same flow.
      </PlaceholderHint>
    </>
  );
}
