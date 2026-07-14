import { useEffect, useState } from "react";
import { BRAINS, BrainDef, TabId } from "./brains";
import { BooksTab } from "./tabs/BooksTab";
import { PromptsTab } from "./tabs/PromptsTab";
import { BoardsTab } from "./tabs/BoardsTab";
import { FlowsTab } from "./tabs/FlowsTab";
import { NotesTab } from "./tabs/NotesTab";
import { CoursesTab } from "./tabs/CoursesTab";
import { ProjectsTab } from "./tabs/ProjectsTab";

const NAV_KEY = "brains.nav.v1";

interface NavState {
  brain: BrainDef["id"];
  tab: Partial<Record<BrainDef["id"], TabId>>;
}

function loadNav(): NavState {
  try {
    const raw = localStorage.getItem(NAV_KEY);
    if (raw) return JSON.parse(raw) as NavState;
  } catch {
    /* corrupted state — fall back to defaults */
  }
  return { brain: "books", tab: {} };
}

export default function App() {
  const [nav, setNav] = useState<NavState>(loadNav);

  useEffect(() => {
    localStorage.setItem(NAV_KEY, JSON.stringify(nav));
    document.documentElement.setAttribute("data-brain", nav.brain);
  }, [nav]);

  const brain = BRAINS.find((b) => b.id === nav.brain) ?? BRAINS[0];
  const activeTab: TabId = nav.tab[brain.id] ?? brain.tabs[0].id;

  const switchBrain = (id: BrainDef["id"]) =>
    setNav((n) => ({ ...n, brain: id }));
  const switchTab = (id: TabId) =>
    setNav((n) => ({ ...n, tab: { ...n.tab, [n.brain]: id } }));

  return (
    <>
      <div className="bg-scene">
        <div className="bg-blob a" />
        <div className="bg-blob b" />
      </div>

      <div className="shell">
        <nav className="rail" aria-label="Brains">
          <div className="rail-logo" title="Brains">
            🧠
          </div>
          {BRAINS.map((b) => (
            <button
              key={b.id}
              className={`brain-btn ${b.id === brain.id ? "active" : ""}`}
              onClick={() => switchBrain(b.id)}
            >
              <span className="ico">{b.icon}</span>
              {b.label}
            </button>
          ))}
          <div className="rail-spacer" />
          <div className="rail-foot">v0.1</div>
        </nav>

        <div className="main">
          <header className="topbar">
            <div className="brain-title">
              <span className="dot" />
              {brain.label}
            </div>
            <nav className="tabbar" aria-label="Tabs">
              {brain.tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-btn ${tab.id === activeTab ? "active" : ""}`}
                  onClick={() => switchTab(tab.id)}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
            <div style={{ flex: 1 }} />
            <span className="phase-ribbon">PHASE 1 · DESIGN PREVIEW</span>
          </header>

          <main className="content" key={`${brain.id}-${activeTab}`}>
            <TabView brainId={brain.id} tab={activeTab} />
          </main>
        </div>
      </div>
    </>
  );
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
  }
}
