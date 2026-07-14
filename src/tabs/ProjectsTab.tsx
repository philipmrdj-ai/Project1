import { ChipRow, PlaceholderHint, SectionHead } from "./shared";

const MOCK_PROJECTS = [
  {
    title: "Author website",
    desc: "Personal site with mailing list signup and book pages.",
    category: "Web",
    status: "Building",
  },
  {
    title: "Home office setup",
    desc: "Rebuild the writing corner: desk, light, sound panels.",
    category: "Home",
    status: "Planning",
  },
  {
    title: "Podcast pilot",
    desc: "3-episode pilot about writing with ADHD.",
    category: "Creative",
    status: "Idea",
  },
  {
    title: "Newsletter relaunch",
    desc: "Monthly letter to readers — new format and schedule.",
    category: "Marketing",
    status: "Building",
  },
];

export function ProjectsTab() {
  return (
    <>
      <SectionHead
        title="Projects"
        sub="4 active · 1 archived"
        actions={
          <>
            <button className="btn ghost">Show archived</button>
            <button className="btn">+ New project</button>
          </>
        }
      />
      <ChipRow
        label="Status"
        chips={["All", "Idea", "Planning", "Building", "Done", "+ edit statuses"]}
      />
      <ChipRow
        label="Category"
        chips={["All", "Web", "Home", "Creative", "Marketing", "+ new category"]}
      />
      <div className="card-grid">
        {MOCK_PROJECTS.map((p) => (
          <div className="card" key={p.title}>
            <div className="stripe" />
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
            <div className="meta-row">
              <span className="badge">
                <span className="b-dot" />
                {p.status}
              </span>
              <span className="badge neutral">{p.category}</span>
            </div>
          </div>
        ))}
      </div>
      <PlaceholderHint>
        Phase 3: like the Books brain but tuned for projects — open a project
        workspace with notes, attachments, and its own statuses and
        categories.
      </PlaceholderHint>
    </>
  );
}
