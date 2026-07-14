/** Static definition of the four brains and their tabs (Phase 1). */
import {
  BookOpen,
  GraduationCap,
  Library,
  Lock,
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
  | "projects";

export interface TabDef {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

export interface BrainDef {
  id: "books" | "learning" | "projects" | "private";
  label: string;
  icon: LucideIcon;
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
    icon: Library,
    tagline: "Everything you're writing — nothing else.",
    tabs: [
      t("books", "Books", BookOpen),
      t("prompts", "Prompts", Sparkles),
      t("boards", "Boards", SquareKanban),
      t("flows", "Flows", Waypoints),
      t("notes", "Notes", StickyNote),
    ],
  },
  {
    id: "learning",
    label: "Learning",
    icon: GraduationCap,
    tagline: "Courses and skills you're building right now.",
    tabs: [
      t("courses", "Courses", GraduationCap),
      t("boards", "Boards", SquareKanban),
      t("flows", "Flows", Waypoints),
      t("notes", "Notes", StickyNote),
    ],
  },
  {
    id: "projects",
    label: "Projects",
    icon: Rocket,
    tagline: "Active projects, one focus at a time.",
    tabs: [
      t("projects", "Projects", Rocket),
      t("prompts", "Prompts", Sparkles),
      t("boards", "Boards", SquareKanban),
      t("flows", "Flows", Waypoints),
      t("notes", "Notes", StickyNote),
    ],
  },
  {
    id: "private",
    label: "Private",
    icon: Lock,
    tagline: "Your personal space for any kind of note.",
    tabs: [t("notes", "Notes", StickyNote)],
  },
];
