/** Static definition of the four brains and their tabs (Phase 1). */

export type TabId =
  | "books"
  | "prompts"
  | "boards"
  | "flows"
  | "notes"
  | "courses"
  | "projects";

export interface TabDef {
  id: TabId;
  label: string;
  icon: string;
}

export interface BrainDef {
  id: "books" | "learning" | "projects" | "private";
  label: string;
  icon: string;
  tagline: string;
  tabs: TabDef[];
}

const t = (id: TabId, label: string, icon: string): TabDef => ({
  id,
  label,
  icon,
});

export const BRAINS: BrainDef[] = [
  {
    id: "books",
    label: "Books",
    icon: "📚",
    tagline: "Everything you're writing — nothing else.",
    tabs: [
      t("books", "Books", "📖"),
      t("prompts", "Prompts", "✨"),
      t("boards", "Boards", "🗂️"),
      t("flows", "Flows", "🧭"),
      t("notes", "Notes", "🗒️"),
    ],
  },
  {
    id: "learning",
    label: "Learning",
    icon: "🎓",
    tagline: "Courses and skills you're building right now.",
    tabs: [
      t("courses", "Courses", "🎓"),
      t("boards", "Boards", "🗂️"),
      t("flows", "Flows", "🧭"),
      t("notes", "Notes", "🗒️"),
    ],
  },
  {
    id: "projects",
    label: "Projects",
    icon: "🚀",
    tagline: "Active projects, one focus at a time.",
    tabs: [
      t("projects", "Projects", "🚀"),
      t("prompts", "Prompts", "✨"),
      t("boards", "Boards", "🗂️"),
      t("flows", "Flows", "🧭"),
      t("notes", "Notes", "🗒️"),
    ],
  },
  {
    id: "private",
    label: "Private",
    icon: "🔒",
    tagline: "Your personal space for any kind of note.",
    tabs: [t("notes", "Notes", "🗒️")],
  },
];
