# 🧠 Brains — Personal Organizer

A personal browser app for sorting everything you work on, split into four
completely separate **brains** so you can focus 100% on one thing at a time:

| Brain | Colour | What lives there |
| --- | --- | --- |
| 📚 Books | Violet | Books you're writing, prompts, kanban boards, process flows, notes |
| 🎓 Learning | Teal | Courses you're taking, boards, flows, notes |
| 🚀 Projects | Amber | Active projects, prompts, boards, flows, notes |
| 🔒 Private | Rose | Infinite nested personal notes |

Design (v3, from the owner's reference): Space Grotesk + Instrument Sans,
one oklch hue per brain (gold / cyan / violet / rose), per-brain sidebar with
focus timer, cover-style cards. Two modes: **Glass** (dark, ambient) and
**Focus** (light, flat, minimal) — toggle in the sidebar.

Beyond the four brains: a global **Links** library (categories + notes per
link), a global **Inbox** for quick capture with one-at-a-time sorting into
any brain, **To-do lists** per brain, kanban card colours, typed genres
(fiction/non-fiction), book/course progress bars, and ⌘K search.

All data is stored locally in your browser (localStorage). No server, no
account, no tracking.

## Run it

```bash
npm install
npm run dev      # development server → http://localhost:5173
```

Or build a static version you can host anywhere / open locally:

```bash
npm run build    # output in dist/
npm run preview  # serve the built version
```

## Roadmap

- [x] **Phase 1** — design system + app shell, all brains & tabs as placeholders
- [x] **Phase 2** — Books brain fully working + nested notes engine; Prompts,
      Boards, Flows and Notes are brain-scoped modules, live in every brain
- [x] **Phase 3** — Learning center (courses with progress, links & documents,
      notes), Projects brain, and card/list/compact view switching
- [x] **Phase 3.5** — design v3 from the owner's reference (sidebar layout,
      cover cards, focus timer), prompts views, genre types, scroll-fade
      workspaces, kanban card colours, To-dos, global Links, and the Inbox
      with one-at-a-time sorting
- [ ] **Phase 4** — polish: global cross-brain search, export/import backup,
      shortcuts
