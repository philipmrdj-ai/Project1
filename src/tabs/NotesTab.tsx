import { PlaceholderHint, SectionHead } from "./shared";

export function NotesTab({ brainId }: { brainId: string }) {
  return (
    <>
      <SectionHead
        title="Notes"
        sub={`Infinite nested notes for the ${brainId} brain`}
        actions={<button className="btn">+ New note</button>}
      />
      <div className="notes-layout">
        <div className="note-tree">
          <div className="tree-item">
            <span className="twisty">▸</span>🗂️ Story ideas
          </div>
          <div className="tree-item active">
            <span className="twisty">▾</span>📖 The Hollow Crown
          </div>
          <div className="tree-children">
            <div className="tree-item">
              <span className="twisty">▾</span>👤 Characters
            </div>
            <div className="tree-children">
              <div className="tree-item">
                <span className="twisty" />
                Queen Maren
              </div>
              <div className="tree-item">
                <span className="twisty" />
                The Archivist
              </div>
            </div>
            <div className="tree-item">
              <span className="twisty">▸</span>🗺️ World lore
            </div>
            <div className="tree-item">
              <span className="twisty" />
              Timeline
            </div>
          </div>
          <div className="tree-item">
            <span className="twisty">▸</span>💡 Random sparks
          </div>
        </div>
        <div className="note-editor">
          <div className="note-breadcrumb">
            Notes / The Hollow Crown
          </div>
          <div className="note-title">The Hollow Crown</div>
          <div className="note-body">
            {`Core premise: the throne itself is alive and feeds on the memories of whoever rules.

Each ruler slowly forgets why they wanted power — the kingdom's history is full of "mad kings" who were really just empty ones.

Open questions:
• Who built the throne, and what did they trade for it?
• Can Maren rule without sitting on it?`}
          </div>
        </div>
      </div>
      <PlaceholderHint>
        Phase 2: create notes inside notes — infinitely deep. Drag to
        re-nest, collapse branches, and every brain keeps its own fully
        separate tree.
      </PlaceholderHint>
    </>
  );
}
