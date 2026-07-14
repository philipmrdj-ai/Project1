import { ChipRow, PlaceholderHint, SectionHead } from "./shared";

const COLS = [
  {
    name: "Backlog",
    cards: [
      { text: "Outline act 3 twist", tags: ["Hollow Crown"] },
      { text: "Research 1930s tram lines", tags: ["Midnight"] },
      { text: "Name the river god", tags: ["Hollow Crown", "lore"] },
    ],
  },
  {
    name: "This week",
    cards: [
      { text: "Rewrite chapter 12 opening", tags: ["Hollow Crown"] },
      { text: "Beta-reader feedback pass", tags: ["Midnight"] },
    ],
  },
  {
    name: "In progress",
    cards: [{ text: "Chapter 13 draft", tags: ["Hollow Crown", "focus"] }],
  },
  {
    name: "Done",
    cards: [
      { text: "Chapter 11 draft", tags: ["Hollow Crown"] },
      { text: "Fix timeline in ch. 4", tags: ["Midnight"] },
    ],
  },
];

export function BoardsTab({ brainId }: { brainId: string }) {
  return (
    <>
      <SectionHead
        title="Boards"
        sub={`Kanban planning for the ${brainId} brain`}
        actions={
          <>
            <button className="btn ghost">Edit columns</button>
            <button className="btn">+ New board</button>
          </>
        }
      />
      <ChipRow
        label="Board"
        chips={["Writing pipeline", "Publishing", "Marketing ideas", "+ new"]}
      />
      <div className="kanban">
        {COLS.map((col) => (
          <div className="kanban-col" key={col.name}>
            <h4>
              {col.name} <span className="count">{col.cards.length}</span>
            </h4>
            {col.cards.map((c) => (
              <div className="kanban-card" key={c.text}>
                {c.text}
                <div className="k-tags">
                  {c.tags.map((t) => (
                    <span className="badge neutral" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <button className="kanban-add">+ Add card</button>
          </div>
        ))}
      </div>
      <PlaceholderHint>
        Phase 2: drag &amp; drop cards between columns, create as many boards
        as you want per brain, and customize columns and card categories.
      </PlaceholderHint>
    </>
  );
}
