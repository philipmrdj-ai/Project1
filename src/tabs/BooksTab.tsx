import { ChipRow, PlaceholderHint, SectionHead } from "./shared";

const MOCK_BOOKS = [
  {
    title: "The Hollow Crown",
    desc: "Epic fantasy about a kingdom whose throne devours its rulers' memories.",
    genre: "Fantasy",
    status: "Writing",
    kind: "Fiction",
  },
  {
    title: "Midnight in Reval",
    desc: "A noir mystery set in 1930s Tallinn — a detective who can't sleep.",
    genre: "Mystery",
    status: "Editing",
    kind: "Fiction",
  },
  {
    title: "Deep Focus",
    desc: "A practical guide to working with an ADHD brain instead of against it.",
    genre: "Self-help",
    status: "Research",
    kind: "Non-fiction",
  },
  {
    title: "Letters to Nobody",
    desc: "Literary fiction told entirely through unsent letters.",
    genre: "Literary",
    status: "Idea",
    kind: "Fiction",
  },
  {
    title: "The Cartographer's Daughter",
    desc: "YA adventure across maps that redraw themselves at night.",
    genre: "Fantasy",
    status: "Writing",
    kind: "Fiction",
  },
  {
    title: "Kitchen Table Economics",
    desc: "Plain-language economics for everyday decisions.",
    genre: "Economics",
    status: "Outlining",
    kind: "Non-fiction",
  },
];

export function BooksTab() {
  return (
    <>
      <SectionHead
        title="Books"
        sub="6 active · 2 archived"
        actions={
          <>
            <button className="btn ghost">Show archived</button>
            <button className="btn">+ New book</button>
          </>
        }
      />
      <ChipRow label="Type" chips={["All", "Fiction", "Non-fiction"]} />
      <ChipRow
        label="Status"
        chips={["All", "Idea", "Research", "Outlining", "Writing", "Editing", "Done", "+ edit statuses"]}
      />
      <ChipRow
        label="Genre"
        chips={["All", "Fantasy", "Mystery", "Literary", "Self-help", "+ new genre"]}
      />
      <div className="card-grid">
        {MOCK_BOOKS.map((b) => (
          <div className="card" key={b.title}>
            <div className="stripe" />
            <h3>{b.title}</h3>
            <p>{b.desc}</p>
            <div className="meta-row">
              <span className="badge">
                <span className="b-dot" />
                {b.status}
              </span>
              <span className="badge neutral">{b.genre}</span>
              <span className="badge neutral">{b.kind}</span>
            </div>
          </div>
        ))}
      </div>
      <PlaceholderHint>
        Phase 2: clicking a book opens its <b>workspace</b> — description,
        nested notes, chapters, and everything for that one book in full-focus
        view. Archiving hides a book without deleting anything.
      </PlaceholderHint>
    </>
  );
}
