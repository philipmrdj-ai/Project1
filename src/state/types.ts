/** Data model. Everything is scoped to a brain so brains stay fully separate. */

export type BrainId = "books" | "learning" | "projects" | "private";

/** A named label owned by a brain (status, genre, prompt category, …). */
export interface Label {
  id: string;
  brainId: BrainId;
  name: string;
}

export interface Book {
  id: string;
  title: string;
  description: string;
  kind: "fiction" | "nonfiction";
  genreId: string | null;
  statusId: string | null;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PipelineStep {
  id: string;
  title: string;
  body: string;
}

export interface Prompt {
  id: string;
  brainId: BrainId;
  title: string;
  description: string;
  categoryId: string | null;
  body: string;
  pipeline: PipelineStep[];
  copiedCount: number;
  lastUsedAt: number;
  updatedAt: number;
}

export interface KanbanCard {
  id: string;
  text: string;
  tags: string[];
}

export interface KanbanColumn {
  id: string;
  name: string;
  cards: KanbanCard[];
}

export interface Board {
  id: string;
  brainId: BrainId;
  name: string;
  columns: KanbanColumn[];
}

export interface FlowStep {
  id: string;
  label: string;
  done: boolean;
}

export interface Flow {
  id: string;
  brainId: BrainId;
  name: string;
  description: string;
  steps: FlowStep[];
}

/**
 * A note in an infinitely nestable tree.
 * ownerId scopes a note to an entity (e.g. a book's workspace);
 * null means it lives in the brain's own Notes tab.
 */
export interface Note {
  id: string;
  brainId: BrainId;
  ownerId: string | null;
  parentId: string | null;
  title: string;
  body: string;
  collapsed: boolean;
  order: number;
  updatedAt: number;
}

export interface DB {
  version: number;
  books: Book[];
  genres: Label[];
  statuses: Label[];
  prompts: Prompt[];
  promptCategories: Label[];
  boards: Board[];
  flows: Flow[];
  notes: Note[];
}
