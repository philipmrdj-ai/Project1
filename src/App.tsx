import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Inbox as InboxIcon,
  Link as LinkIcon,
  MoonStar,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sun,
} from "lucide-react";
import { BRAINS, BrainDef, TabId } from "./brains";
import { DbProvider, useDb } from "./state/store";
import { BooksTab } from "./tabs/BooksTab";
import { PromptsTab } from "./tabs/PromptsTab";
import { BoardsTab } from "./tabs/BoardsTab";
import { FlowsTab } from "./tabs/FlowsTab";
import { NotesTab } from "./tabs/NotesTab";
import { CoursesTab } from "./tabs/CoursesTab";
import { ProjectsTab } from "./tabs/ProjectsTab";
import { TodosTab } from "./tabs/TodosTab";
import { LinksView } from "./tabs/LinksView";
import { InboxView } from "./tabs/InboxView";

const NAV_KEY = "brains.nav.v1";

type Mode = "glass" | "focus";
type SpecialView = "links" | "inbox" | null;

interface NavState {
  brain: BrainDef["id"];
  tab: Partial<Record<BrainDef["id"], TabId>>;
  mode?: Mode;
}

function loadNav(): NavState {
  try {
    const raw = localStorage.getItem(NAV_KEY);
    if (raw) return JSON.parse(raw) as NavState;
  } catch {
    /* corrupted or unavailable state — fall back to defaults */
  }
  return { brain: "books", tab: {}, mode: "glass" };
}

/* topbar search, shared with whatever view is open */
const SearchCtx = createContext<{ q: string }>({ q: "" });
export const useSearch = () => useContext(SearchCtx).q;

const HUES: Record<BrainDef["id"], number> = {
  books: 70,
  learning: 195,
  projects: 288,
  private: 12,
};

export default function App() {
  return (
    <DbProvider>
      <Shell />
    </DbProvider>
  );
}

function Shell() {
  const [db] = useDb();
  const [nav, setNav] = useState<NavState>(loadNav);
  const [special, setSpecial] = useState<SpecialView>(null);
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const mode: Mode = nav.mode ?? "glass";

  useEffect(() => {
    try {
      localStorage.setItem(NAV_KEY, JSON.stringify(nav));
    } catch {
      /* storage unavailable — nav just won't persist */
    }
    document.documentElement.setAttribute("data-brain", nav.brain);
    document.documentElement.setAttribute("data-mode", mode);
  }, [nav, mode]);

  // ⌘K / Ctrl+K focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const brain = BRAINS.find((b) => b.id === nav.brain) ?? BRAINS[0];
  const activeTab: TabId = nav.tab[brain.id] ?? brain.tabs[0].id;

  const switchBrain = (id: BrainDef["id"]) => {
    setNav((n) => ({ ...n, brain: id }));
    setSpecial(null);
    setQ("");
  };
  const switchTab = (id: TabId) => {
    setNav((n) => ({ ...n, tab: { ...n.tab, [n.brain]: id } }));
    setSpecial(null);
    setQ("");
  };
  const openSpecial = (v: Exclude<SpecialView, null>) => {
    setSpecial((s) => (s === v ? null : v));
    setQ("");
  };
  const setMode = (m: Mode) => setNav((n) => ({ ...n, mode: m }));

  const counts = tabCounts(db, brain.id);
  const crumbTab = special
    ? special === "links"
      ? "Links"
      : "Inbox"
    : brain.tabs.find((t) => t.id === activeTab)?.label ?? "";
  const searchScope = special
    ? crumbTab
    : `${brain.label} · ${crumbTab}`;

  return (
    <>
      <div className="bg-scene">
        <div className="orb a" />
        <div className="orb b" />
      </div>

      <div className="app">
        <aside className="sidebar">
          <div className="brain-tiles">
            {BRAINS.map((b) => (
              <button
                key={b.id}
                className={`brain-tile ${
                  b.id === brain.id && !special ? "active" : ""
                }`}
                style={{ "--hue": HUES[b.id] } as React.CSSProperties}
                title={b.label}
                onClick={() => switchBrain(b.id)}
              >
                {b.glyph}
              </button>
            ))}
          </div>

          <div className="brain-id">
            <div className="brain-glyph">{brain.glyph}</div>
            <div>
              <div className="b-name">{brain.label}</div>
              <div className="b-tag">{brain.tagline}</div>
            </div>
          </div>

          {brain.tabs.map((tab) => (
            <button
              key={tab.id}
              className={`side-tab ${
                tab.id === activeTab && !special ? "active" : ""
              }`}
              onClick={() => switchTab(tab.id)}
            >
              <span className="dot" />
              <span className="t-label">{tab.label}</span>
              <span className="t-count">{counts[tab.id] ?? ""}</span>
            </button>
          ))}

          <div className="side-spacer" />

          <button
            className={`side-util ${special === "links" ? "active" : ""}`}
            onClick={() => openSpecial("links")}
          >
            <LinkIcon size={15} />
            Links
            {db.links.length > 0 && (
              <span className="u-count">{db.links.length}</span>
            )}
          </button>
          <button
            className={`side-util ${special === "inbox" ? "active" : ""}`}
            onClick={() => openSpecial("inbox")}
          >
            <InboxIcon size={15} />
            Inbox
            {db.inbox.length > 0 && (
              <span className="u-count">{db.inbox.length}</span>
            )}
          </button>

          <div className="mode-toggle" role="group" aria-label="Visual mode">
            <button
              className={mode === "glass" ? "active" : ""}
              onClick={() => setMode("glass")}
              aria-pressed={mode === "glass"}
            >
              <MoonStar size={13} /> Glass
            </button>
            <button
              className={mode === "focus" ? "active" : ""}
              onClick={() => setMode("focus")}
              aria-pressed={mode === "focus"}
            >
              <Sun size={13} /> Focus
            </button>
          </div>

          <FocusTimer />
        </aside>

        <div className="workarea">
          <header className="topbar">
            <div className="crumb">
              {brain.label} / <b>{crumbTab}</b>
            </div>
            <div className="search-pill">
              <Search size={15} />
              <input
                ref={searchRef}
                placeholder={`Search ${searchScope}…`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <span className="kbd">⌘K</span>
            </div>
            <span className="phase-ribbon">V0.5</span>
          </header>

          <main
            className="content"
            key={special ?? `${brain.id}-${activeTab}`}
          >
            <SearchCtx.Provider value={{ q }}>
              {special === "links" ? (
                <LinksView />
              ) : special === "inbox" ? (
                <InboxView />
              ) : (
                <TabView brainId={brain.id} tab={activeTab} />
              )}
            </SearchCtx.Provider>
          </main>
        </div>
      </div>
    </>
  );
}

function tabCounts(
  db: ReturnType<typeof useDb>[0],
  brainId: BrainDef["id"]
): Partial<Record<TabId, number | string>> {
  return {
    books: db.books.filter((b) => !b.archived).length,
    courses: db.courses.length,
    projects: db.projects.filter((p) => !p.archived).length,
    prompts: db.prompts.filter((p) => p.brainId === brainId).length,
    boards: db.boards.filter((b) => b.brainId === brainId).length,
    flows: db.flows.filter((f) => f.brainId === brainId).length,
    todos: db.todoLists.filter((t) => t.brainId === brainId).length,
    notes: db.notes.filter((n) => n.brainId === brainId && n.ownerId === null)
      .length,
  };
}

function TabView({ brainId, tab }: { brainId: BrainDef["id"]; tab: TabId }) {
  switch (tab) {
    case "books":
      return <BooksTab />;
    case "prompts":
      return <PromptsTab brainId={brainId} />;
    case "boards":
      return <BoardsTab brainId={brainId} />;
    case "flows":
      return <FlowsTab brainId={brainId} />;
    case "notes":
      return <NotesTab brainId={brainId} />;
    case "courses":
      return <CoursesTab />;
    case "projects":
      return <ProjectsTab />;
    case "todos":
      return <TodosTab brainId={brainId} />;
  }
}

/* ---------- pomodoro focus timer ---------- */

const TIMER_MINUTES = 25;

function FocusTimer() {
  const [left, setLeft] = useState(TIMER_MINUTES * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const iv = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(iv);
  }, [running]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const pristine = !running && left === TIMER_MINUTES * 60;

  return (
    <div className="timer-card">
      <div className="t-cap">FOCUS TIMER</div>
      <div className="t-row">
        <div className={`t-time ${left === 0 ? "done" : ""}`}>
          {left === 0 ? "Done!" : `${mm}:${ss}`}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!pristine && (
            <button
              className="timer-btn subtle"
              title="Reset timer"
              onClick={() => {
                setRunning(false);
                setLeft(TIMER_MINUTES * 60);
              }}
            >
              <RotateCcw size={14} />
            </button>
          )}
          {left > 0 && (
            <button
              className="timer-btn"
              title={running ? "Pause" : "Start focus session"}
              onClick={() => setRunning((r) => !r)}
            >
              {running ? <Pause size={14} /> : <Play size={14} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
