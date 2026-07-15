import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { BrainId, DB, Label } from "./types";

const DB_KEY = "brains.db.v1";

export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const now = () => Date.now();

const label = (brainId: BrainId, name: string): Label => ({
  id: uid(),
  brainId,
  name,
});

/** Sensible starting labels + one ready-made board per brain, so nothing starts as a blank wall. */
function seed(): DB {
  const board = (brainId: BrainId) => ({
    id: uid(),
    brainId,
    name: "Main board",
    columns: [
      { id: uid(), name: "Backlog", cards: [] },
      { id: uid(), name: "This week", cards: [] },
      { id: uid(), name: "In progress", cards: [] },
      { id: uid(), name: "Done", cards: [] },
    ],
  });
  return {
    version: 1,
    books: [],
    statuses: ["Idea", "Research", "Outlining", "Writing", "Editing", "Done"].map(
      (n) => label("books", n)
    ),
    genres: ["Fantasy", "Sci-fi", "Mystery", "Romance", "Self-help"].map((n) =>
      label("books", n)
    ),
    courses: [],
    courseStatuses: ["Not started", "In progress", "Paused", "Completed"].map(
      (n) => label("learning", n)
    ),
    projects: [],
    projectStatuses: ["Idea", "Planning", "Building", "Done"].map((n) =>
      label("projects", n)
    ),
    projectCategories: ["General"].map((n) => label("projects", n)),
    prompts: [],
    promptCategories: [
      ...["Editing", "Characters", "Worldbuilding", "Plotting"].map((n) =>
        label("books", n)
      ),
      label("projects", "General"),
    ],
    boards: [board("books"), board("learning"), board("projects")],
    flows: [],
    notes: [],
  };
}

function loadDb(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DB>;
      // merge over a fresh seed's shape so new collections added in later
      // versions get defaults instead of being undefined
      const base = seed();
      return { ...base, ...parsed, version: base.version } as DB;
    }
  } catch {
    /* corrupted or unavailable storage — start fresh */
  }
  return seed();
}

export type Update = (fn: (db: DB) => DB) => void;

const DbContext = createContext<[DB, Update] | null>(null);

export function DbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(loadDb);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
      } catch {
        /* storage unavailable — keep running in memory */
      }
    }, 250);
    return () => window.clearTimeout(timer.current);
  }, [db]);

  const update: Update = useCallback((fn) => setDb((d) => fn(d)), []);

  return (
    <DbContext.Provider value={[db, update]}>{children}</DbContext.Provider>
  );
}

export function useDb(): [DB, Update] {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error("useDb must be used inside DbProvider");
  return ctx;
}

/* ---------- small list helpers used across tabs ---------- */

export function patchById<T extends { id: string }>(
  list: T[],
  id: string,
  patch: Partial<T>
): T[] {
  return list.map((x) => (x.id === id ? { ...x, ...patch } : x));
}

export function removeById<T extends { id: string }>(
  list: T[],
  id: string
): T[] {
  return list.filter((x) => x.id !== id);
}

/** Copy text to the clipboard, with a fallback for restricted contexts. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
