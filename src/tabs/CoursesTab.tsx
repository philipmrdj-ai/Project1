import { ChipRow, PlaceholderHint, SectionHead } from "./shared";

const MOCK_COURSES = [
  {
    title: "Advanced Storytelling",
    desc: "Brandon Sanderson's lecture series on plot, character and setting.",
    status: "In progress",
    progress: 62,
    links: 4,
    docs: 2,
  },
  {
    title: "Spanish A2",
    desc: "Daily practice + weekly conversation classes.",
    status: "In progress",
    progress: 35,
    links: 2,
    docs: 5,
  },
  {
    title: "Book Marketing 101",
    desc: "Self-publishing marketing course — launch strategies and ads.",
    status: "Not started",
    progress: 0,
    links: 1,
    docs: 0,
  },
  {
    title: "Typing speed bootcamp",
    desc: "Get from 70 to 100 WPM for faster drafting.",
    status: "Completed",
    progress: 100,
    links: 1,
    docs: 1,
  },
];

export function CoursesTab() {
  return (
    <>
      <SectionHead
        title="Learning center"
        sub="Every course you're taking, in one calm place"
        actions={<button className="btn">+ New course</button>}
      />
      <ChipRow
        label="Status"
        chips={["All", "In progress", "Not started", "Completed", "Paused"]}
      />
      <ChipRow label="Sort" chips={["Recently active", "Progress", "A–Z"]} />
      <div className="card-grid">
        {MOCK_COURSES.map((c) => (
          <div className="card" key={c.title}>
            <div className="stripe" />
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <div className="meta-row">
              <span className="badge">
                <span className="b-dot" />
                {c.status}
              </span>
              <span className="badge neutral">🔗 {c.links} links</span>
              <span className="badge neutral">📎 {c.docs} docs</span>
            </div>
            <div className="progress">
              <div style={{ width: `${c.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
      <PlaceholderHint>
        Phase 3: open a course to add descriptions, attach links and
        documents, track modules, and keep session notes — all inside the
        Learning brain only.
      </PlaceholderHint>
    </>
  );
}
