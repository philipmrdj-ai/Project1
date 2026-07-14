import { ReactNode } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Lightbulb,
  Map,
  Users,
} from "lucide-react";
import { PlaceholderHint, SectionHead } from "./shared";

function TreeItem({
  icon,
  label,
  state,
  active,
}: {
  icon?: ReactNode;
  label: string;
  state?: "open" | "closed";
  active?: boolean;
}) {
  return (
    <div className={`tree-item ${active ? "active" : ""}`}>
      <span className="twisty">
        {state === "open" && <ChevronDown size={12} />}
        {state === "closed" && <ChevronRight size={12} />}
      </span>
      {icon && <span className="t-ico">{icon}</span>}
      {label}
    </div>
  );
}

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
          <TreeItem icon={<Folder size={14} />} label="Story ideas" state="closed" />
          <TreeItem
            icon={<BookOpen size={14} />}
            label="The Hollow Crown"
            state="open"
            active
          />
          <div className="tree-children">
            <TreeItem icon={<Users size={14} />} label="Characters" state="open" />
            <div className="tree-children">
              <TreeItem icon={<FileText size={14} />} label="Queen Maren" />
              <TreeItem icon={<FileText size={14} />} label="The Archivist" />
            </div>
            <TreeItem icon={<Map size={14} />} label="World lore" state="closed" />
            <TreeItem icon={<FileText size={14} />} label="Timeline" />
          </div>
          <TreeItem
            icon={<Lightbulb size={14} />}
            label="Random sparks"
            state="closed"
          />
        </div>
        <div className="note-editor">
          <div className="note-breadcrumb">Notes / The Hollow Crown</div>
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
