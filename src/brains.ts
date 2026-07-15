/** Static definition of the four brains and their tabs. */
import {
  BookOpen,
  GraduationCap,
  ListChecks,
  LucideIcon,
  Rocket,
  Sparkles,
  SquareKanban,
  StickyNote,
  Waypoints,
} from "lucide-react";

export type TabId =
  | "books"
  | "prompts"
  | "boards"
  | "flows"
  | "notes"
  | "courses"
  | "projects"
  | "todos";

export interface TabDef {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

export interface BrainDef {
  id: "books" | "learning" | "projects" | "private";
  label: string;
  glyph: string;
  tagline: string;
  tabs: TabDef[];
}

const t = (id: TabId, label: string, icon: LucideIcon): TabDef => ({
  id,
  label,
  icon,
});

export const BRAINS: BrainDef[] = [
  {
    id: "books",
    label: "Books",
    glyph: "B",
    tagline: "Write, prompt, plan",
    tabs: [
      t("books", "Library", BookOpen),
      t("prompts", "Prompts", Sparkles),
      t("boards", "Workflow", SquareKanban),
      t("flows", "Process Flows", Waypoints),
      t("todos", "To-dos", ListChecks),
      t("notes", "Notes", StickyNote),
    ],
  },
  {
    id: "learning",
    label: "Learning",
    glyph: "L",
    tagline: "Courses & growth",
    tabs: [
      t("courses", "Courses", GraduationCap),
      t("boards", "Workflow", SquareKanban),
      t("flows", "Process Flows", Waypoints),
      t("todos", "To-dos", ListChecks),
      t("notes", "Notes", StickyNote),
    ],
  },
  {
    id: "projects",
    label: "Projects",
    glyph: "P",
    tagline: "Build & ship",
    tabs: [
      t("projects", "Projects", Rocket),
      t("prompts", "Prompts", Sparkles),
      t("boards", "Workflow", SquareKanban),
      t("flows", "Process Flows", Waypoints),
      t("todos", "To-dos", ListChecks),
      t("notes", "Notes", StickyNote),
    ],
  },
  {
    id: "private",
    label: "Private",
    glyph: "✦",
    tagline: "Notes & thoughts",
    tabs: [t("notes", "Notes", StickyNote), t("todos", "To-dos", ListChecks)],
  },
];
