# Local Brain

A local-first, installable PWA for personal note-taking. All data stays in your browser — no server, no account, no network required after the first load.

## Status

Phases 1–6 of the [project plan](cursor-plan.md) are complete. The app runs as a client-only PWA with in-browser SQLite, full-text search, tags, and backup export/import.

## Features

- **Local-first** — notes stored in SQLite via WASM, persisted to OPFS (Origin Private File System)
- **Offline-capable PWA** — installable, service worker caches assets
- **Full-text search** — FTS5 with instant local queries and highlighted snippets
- **Tags** — organize notes with tags; type `#` in the editor to add or create tags
- **Responsive UI** — 3-pane desktop layout (tags / list / editor), single-pane mobile with bottom navigation
- **Export & import** — download the raw `.sqlite` database or all notes as Markdown (`.zip`); restore from a SQLite backup
- **Cloud-sync ready** — ULID primary keys, timestamps, and soft deletes for future multi-device sync

## Stack

| Technology | Role |
| ---------- | ---- |
| [React 19](https://react.dev) | UI |
| [Vite 7](https://vitejs.dev) | Build tooling |
| [Tailwind CSS v4](https://tailwindcss.com) | Styling |
| [TanStack Query](https://tanstack.com/query) | Client-side caching |
| [Drizzle ORM](https://orm.drizzle.team) | Type-safe queries (`sqlite-proxy`) |
| [@sqlite.org/sqlite-wasm](https://sqlite.org/wasm) | In-browser SQLite with OPFS |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app) | PWA manifest & service worker |
| [React Router v7](https://reactrouter.com) | Routing |
| [Playwright](https://playwright.dev) | E2E tests |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io/installation)

### Install & run

```bash
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000). No database setup, `.env` file, or backend server is required — the SQLite database is created automatically in the browser on first load.

### Build for production

```bash
pnpm run build
pnpm run start   # serves the production build at http://localhost:3000
```

### E2E tests

Start the dev server, then in another terminal:

```bash
pnpm run test
```

## Project layout

```
client/
  src/
    db/           # Schema, migrations, SQLite Web Worker
    hooks/        # useNotes, useTags, useSearch
    components/   # NoteList, NoteEditor, Omnibox, TagSidebar, etc.
    pages/        # BrainPage, SettingsPage
    lib/db.ts     # Drizzle proxy ↔ worker bridge
tests-e2e/      # Playwright smoke tests
```

## Architecture

```
Browser (main thread)          Web Worker
─────────────────────          ──────────
React UI                       @sqlite.org/sqlite-wasm
  ↕ TanStack Query               ↕ OPFS (local-brain.sqlite3)
Drizzle (sqlite-proxy)  ←→   SQLite + FTS5 + triggers
```

COOP/COEP headers (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`) are required for OPFS-backed SQLite and are configured in `client/vite.config.ts`.

## Data ownership

Your notes never leave the device unless you explicitly export them from **Settings**. Back up regularly by downloading the SQLite file or Markdown archive.

## License

See [LICENSE](LICENSE).
