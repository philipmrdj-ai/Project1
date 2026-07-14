import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { ChipRow, PlaceholderHint, SectionHead } from "./shared";

const MOCK_PROMPTS = [
  {
    title: "Chapter deep-edit",
    desc: "Line-edits a chapter while preserving my voice.",
    category: "Editing",
    body: "You are my line editor. Keep my voice and rhythm intact. Tighten prose, cut filler words, flag pacing issues. Never rewrite dialogue wholesale...",
    pipeline: ["Summarize chapter", "Deep-edit", "Consistency check"],
  },
  {
    title: "Character interview",
    desc: "Interviews a character to find their hidden motivations.",
    category: "Characters",
    body: "Act as an interviewer speaking with {character}. Ask probing questions about their childhood, fears, and what they would never admit out loud...",
    pipeline: [],
  },
  {
    title: "Worldbuilding expander",
    desc: "Takes one detail of the world and expands it into lore.",
    category: "Worldbuilding",
    body: "Given this detail from my world: {detail} — expand it into history, rumors ordinary people believe, and one way it could drive a plot...",
    pipeline: ["Expand lore", "Extract plot hooks"],
  },
];

export function PromptsTab({ brainId }: { brainId: string }) {
  return (
    <>
      <SectionHead
        title="Prompts"
        sub={`Prompt library for the ${brainId} brain — copy with one click`}
        actions={<button className="btn">+ New prompt</button>}
      />
      <ChipRow
        label="Category"
        chips={["All", "Editing", "Characters", "Worldbuilding", "Plotting", "+ new category"]}
      />
      <ChipRow label="Sort" chips={["Recently used", "A–Z", "Most used"]} />
      {MOCK_PROMPTS.map((p) => (
        <PromptCard key={p.title} {...p} />
      ))}
      <PlaceholderHint>
        Phase 2: the Copy button copies the prompt instantly. <b>Pipelines</b>{" "}
        chain prompts together so you can run a sequence (e.g. summarize →
        edit → check) step by step, copying each stage as you go.
      </PlaceholderHint>
    </>
  );
}

function PromptCard({
  title,
  desc,
  category,
  body,
  pipeline,
}: (typeof MOCK_PROMPTS)[number]) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable — ignore in preview */
    }
  };
  return (
    <div className="prompt-card">
      <div className="prompt-top">
        <div>
          <h3>{title}</h3>
          <p>{desc}</p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span className="badge neutral">{category}</span>
          <button className="btn small" onClick={copy}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <div className="prompt-body">{body}</div>
      {pipeline.length > 0 && (
        <div className="pipeline-strip">
          <Link2 size={13} /> Pipeline:
          {pipeline.map((s, i) => (
            <span key={s} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {i > 0 && "→"}
              <span className="p-step">{s}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
