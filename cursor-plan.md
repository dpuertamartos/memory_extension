# Project Plan: Local-First PWA 2nd Brain (Browser SQLite)

## Current Status (June 2026)

**Phases 1–10 are complete.** The app is a client-only PWA with in-browser SQLite (OPFS), Drizzle ORM, full-text search, a responsive 3-pane UI, export/import, advanced markdown editing, cloud-sync preparation, advanced discovery filters, and a calendar memory view.

| Phase | Status |
| ----- | ------ |
| 1. Boilerplate pruning & PWA setup | Done |
| 2. In-browser SQLite & Drizzle | Done |
| 3. Core app logic (hooks) | Done |
| 4. UI (mobile-first) | Done |
| 5. Export & import | Done |
| 6. Cloud-sync prep (ULIDs, timestamps, soft deletes) | Done |
| 7. Stability & Core UX Fixes | Done |
| 8. Advanced Search & Polish | Done |
| 9. Cloud Sync Preparation | Done |
| 10. Advanced Discovery & Calendar Memory | Done |
| 13. Internationalization (i18n) | Partial (en + es) |

### What shipped

- **Monorepo pruned** — `server` package removed; no Fastify, tRPC, Postgres, or Better Auth.
- **OPFS SQLite** — `@sqlite.org/sqlite-wasm` runs in a dedicated Web Worker (`client/src/db/sqlite.worker.ts`) with Drizzle via `sqlite-proxy` (`client/src/lib/db.ts`).
- **PWA** — `vite-plugin-pwa` with manifest, service worker, and offline asset caching. COOP/COEP headers configured for OPFS.
- **Schema** — `notes`, `tags`, `note_tags` with ULID primary keys, timestamps, and soft deletes (`is_deleted`).
- **FTS5** — `notes_fts` virtual table with insert/update/delete triggers (`client/src/db/migrate.ts`).
- **Data layer** — `useNotes`, `useTags`, `useGlobalSearch` backed by TanStack Query.
- **UI** — 3-pane desktop layout (tags / list / editor), single-pane mobile with bottom nav, omnibox search, Markdown WYSIWYG editor via Tiptap.
- **Settings** — SQLite export, Markdown zip export (YAML frontmatter), SQLite import with page reload.
- **Sync Architecture** — ULID-based Last-Write-Wins deterministic merging strategy for eventual cloud/peer synchronization.
- **i18n** — `i18next` + `react-i18next` with English and Spanish locale files; language picker in Settings; browser-language detection on first visit.

---

## Architectural Strategy

Build a local-first note-taking app that users access via a URL, but where all data remains locally on their device.

- **Frontend:** React 19, Tailwind CSS v4, Vite (PWA).
- **Database:** SQLite compiled to WASM running in the browser via OPFS (Origin Private File System).
- **ORM:** Drizzle ORM (browser-compatible, `sqlite-proxy` driver).
- **Mobile:** Responsive PWA (installable to home screen, works offline).

---

## Phase 1: Boilerplate Pruning & PWA Setup

*Objective: Strip the server infrastructure and convert the client into a local-first PWA.*

- [x] **1.1 Prune the Monorepo**
  - Delete the `server` package completely (no Fastify/tRPC needed).
  - Remove tRPC dependencies from `client/package.json`.
  - Remove `better-auth` from all packages.
  - Delete `client/src/lib/trpc.ts` and remove tRPC providers from `App.tsx`.

- [x] **1.2 Install Browser Database Dependencies**
  - Installed `@sqlite.org/sqlite-wasm` and `drizzle-orm` in `client/package.json`.
  - Configured `vite.config.ts` with COOP/COEP headers and a WASM worker transform plugin.

- [x] **1.3 Setup PWA**
  - Installed and configured `vite-plugin-pwa` with manifest, icons, and Workbox caching.

---

## Phase 2: In-Browser SQLite & Drizzle Configuration

*Objective: Set up a real SQLite database inside the browser's isolated file system.*

- [x] **2.1 Initialize OPFS SQLite**
  - `client/src/lib/db.ts` — Drizzle proxy and worker message bridge.
  - `client/src/db/sqlite.worker.ts` — OPFS-backed `OpfsDb` with init/export/import.

- [x] **2.2 Define Drizzle Schema (`client/src/db/schema.ts`)**
  - `notes`: `id` (ULID), `title`, `content`, `is_deleted`, `created_at`, `updated_at`.
  - `tags`: `id`, `name`, `color`, `created_at`, `updated_at`.
  - `note_tags`: many-to-many join table.

- [x] **2.3 FTS5 (Full-Text Search) Setup**
  - `client/src/db/migrate.ts` runs on worker init.
  - `notes_fts` virtual table with `AFTER INSERT`, `AFTER UPDATE`, `AFTER DELETE` triggers.

- [x] **2.4 Connect Drizzle to Browser SQLite**
  - `export const db = drizzle(runWorkerQuery, { schema })` via `sqlite-proxy`.

---

## Phase 3: Core App Logic (Replacing tRPC with Hooks)

*Objective: Build custom React hooks that talk directly to the local Drizzle instance.*

- [x] **3.1 Create Data Access Layer (`client/src/hooks/useNotes.ts`, `useTags.ts`)**
  - `useCreateNote`, `useUpdateNote` (300ms debounce), `useDeleteNote` (soft delete).
  - `useSetNoteTags`, `useCreateTag`, `useDeleteTag`.
  - Wrapped in TanStack Query for caching and invalidation.

- [x] **3.2 Create Search Layer (`client/src/hooks/useSearch.ts`)**
  - `useGlobalSearch(query)` — FTS `MATCH` with `snippet()` for highlighted fragments.

---

## Phase 4: UI Development (Mobile-First & Responsive)

*Objective: Build an interface that works as a desktop web app and a mobile PWA.*

- [x] **4.1 Responsive Layout Shell**
  - `BrainPage.tsx` — desktop: sidebar + list + editor; mobile: single pane via `MobileNav`.

- [x] **4.2 The "Omnibox" (Search Engine)**
  - `Omnibox.tsx` — instant local FTS search wired into `NoteList`.

- [x] **4.3 Note Editor**
  - Auto-resizing Markdown `textarea` in `NoteEditor.tsx`.
  - `#` tag selector via `TagSelector.tsx`.

---

## Phase 5: Exportability & File Management

*Objective: Give the user absolute control over their local data.*

- [x] **5.1 Database Export (SQLite File)**
  - `SettingsPage.tsx` — `exportDatabaseFile()` downloads `local-brain.sqlite`.

- [x] **5.2 Markdown Export**
  - All notes exported as `.md` files in a `.zip` with YAML frontmatter (via `jszip`).

- [x] **5.3 Database Import (Restore)**
  - Upload `.sqlite` backup, deserialize into OPFS, reload page.

---

## Phase 6: Future Cloud Sync Architecture (Prep)

*Objective: Architect data so it can be synced to a cloud later without redesigning.*

- [x] **6.1 Use ULIDs** — all primary keys are ULIDs (`ulid` package).
- [x] **6.2 Timestamping** — `created_at` and `updated_at` on every table.
- [x] **6.3 Soft Deletes** — `is_deleted` flag on notes instead of hard deletes.

---

## Phase 7: Stability & Core UX Fixes

*Objective: Ensure the core typing and reading experience is absolutely flawless.*

- [x] **7.1 Fix Editor Race Conditions**
  - Fix the "text rollback" bug in `NoteEditor.tsx` where debounced saves trigger an invalidation that overwrites the user's active typing state.
  - Implement a stable local state that only hydrates on initial note load.
- [x] **7.2 Inline Tag Extraction**
  - When a user types `#tag` and selects it, automatically strip the `#tag` text from the document content and add it to the structured tags list to keep the UI clean.
- [x] **7.3 Tag-Aware Full-Text Search**
  - Modify the search query so searching for a term like "DOG" returns all notes tagged with `#DOG`, even if "DOG" isn't in the note body.
- [x] **7.4 Rich Text Markdown Editor**
  - Replace the plain `textarea` with a visual WYSIWYG editor (e.g., Tiptap, Lexical, or Milkdown) compatible with React 19.
  - Allow users to click and format text without knowing Markdown, while the underlying storage remains standard Markdown for exportability and full-text search.

---

## Phase 8: Advanced Search & Polish

*Objective: Augment how users categorize, retrieve, and perceive their memory.*

- [x] **8.1 Advanced Searchability & Memory Aids**
  - Add contextual timestamps to notes (e.g., "Updated 2 hours ago").
  - Introduce sorting options (by created, updated, alphabetical).
  - Provide rich highlighting for search terms in the note list to easily spot the context.
- [x] **8.2 UI/UX Polish**
  - Improve typography, spacing, and contrast (dark mode optimizations).
  - Make pane transitions smoother and more native-like.
  - Add visual feedback for saves (e.g., "All changes saved locally").
- [x] **8.3 Tag Management UI**
  - Add ability to rename tags, change tag colors with a picker, and delete tags with a confirmation dialog.

---

## Phase 9: Cloud Sync Preparation

*Objective: Architect data to optionally sync to a personal cloud (e.g., WebDAV, iCloud, or a lightweight custom sync server).*

- [x] **9.1 Conflict Resolution Strategy**
  - Leverage ULIDs, `updated_at`, and `is_deleted` to build a simple "last-write-wins" sync logic.

---

## Phase 10: Advanced Discovery & Calendar Memory

*Objective: Expand the tools for retrieving and visualizing memory (multi-term searches, date filters, calendar visualization) and fix lingering UX inconsistencies.*

- [x] **10.1 Multiple Words Search & Advanced FTS**
  - Refactor FTS queries in `useSearch.ts` to support multiple independent words (e.g., matching `hello` AND `world` anywhere in the note, rather than as an exact phrase).
  - Maintain the tag-aware searching functionality alongside the multi-word logic.
- [x] **10.2 Advanced Search UI & Date Integration**
  - Build a rich UI for the Omnibox that allows visually adding/removing keywords, tags, and date filters.
  - Implement robust date-based search directly tied into the main search engine (e.g., "created last week", "updated in May 2026").
- [x] **10.3 Fix Editor Save State Indicators**
  - Debug and resolve the issue in `useNotes.ts` / `NoteEditor.tsx` where the `saveStatus` gets stuck on "Saving..." (likely due to orphaned timeouts or race conditions in the `useUpdateNote` hook). Ensure "Saved locally" consistently appears and vanishes cleanly.
- [x] **10.4 Tag Tab Search/Filtering**
  - Add a dedicated, slick search input within `TagSidebar.tsx` to instantly filter the list of tags, helping users with large numbers of tags find what they need.
- [x] **10.5 Calendar View Memory Organization**
  - Implement a new, integrated Calendar view (accessible via a tab or integrated nicely into the layout).
  - Provide Daily, Weekly, Monthly, and Yearly scopes.
  - Visualize note activity (creation/updates) on the calendar.
  - Surface top keywords, tags, or topics relevant to the selected timeframe to help users organize and recall their memory contextually.

## Phase 11: UX Polish, App Install & Tech Debt

*Objective: Improve mobile usability, fix UI glitches, allow explicit app installation, and pay down technical debt.*

- [x] **11.1 Search Bar UI & Mobile UX**
  - Fix the aesthetics of the search bar (magnifying glass icon overlapping the input text).
  - Improve mobile search interaction (make it more obvious how to search without relying exclusively on the "Enter" key; e.g., add a visible submit/search button).
- [x] **11.2 Calendar Interactivity**
  - Make the notes clickable directly within the calendar view so users can navigate to and edit them.
- [x] **11.3 PWA Installation**
  - Create an explicit "Install App" (Add to Home Screen) button to make the PWA easily accessible as a native-like app on mobile devices.
- [x] **11.4 Codebase Refactoring**
  - Conduct a comprehensive refactor to address technical debt, improving overall maintainability and extensibility of the codebase.
- [ ] **11.5 Chromium End-to-End Tests**
  - Playwright specs exist in `tests-e2e/tests/` (smoke, note CRUD, tags, search); `webServer` is configured to start the dev server from the repo root.
  - Install browsers (`cd tests-e2e && pnpm run install:browsers`) and verify `pnpm test:e2e` passes on a non-WSL environment (native Linux, macOS, or Windows host). Chromium downloads often hang or extract incompletely on WSL.
  - Until E2E is green in CI or locally, rely on Vitest integration tests in `client/src/integration/userFlows.test.tsx` (`pnpm test`) for the same user flows without a real browser.
  - Optional follow-up: add a GitHub Actions workflow that runs `pnpm test:e2e` on `ubuntu-latest` after `playwright install chromium`.

## Phase 12: SEO Landing Page (Astro)

*Objective: Build a marketing landing page optimized for search engines to drive traffic to the main application.*

- [ ] **12.1 Astro Setup**
  - Initialize a new Astro project (e.g., inside a `landing` package) optimized for Google SEO.
- [ ] **12.2 Custom Memory/Brain Aesthetic**
  - Design a unique, handcrafted visual identity centered around the concepts of memory, the brain, and local-first privacy (specifically avoiding generic "AI slop" aesthetics).
- [ ] **12.3 App Routing**
  - Provide clear calls-to-action (CTAs) linking the marketing landing page directly to the main PWA application.

## Phase 13: Internationalization (i18n)

*Objective: Make the app accessible in multiple languages, starting with Spanish, with an architecture that scales to additional locales.*

- [x] **13.1 i18n Infrastructure**
  - Add `i18next` and `react-i18next` to the client package.
  - Create `client/src/i18n/` with locale JSON files (`en`, `es`) and a central init module.
  - Detect browser language on first visit; persist user choice in `localStorage`.
- [x] **13.2 UI String Extraction**
  - Replace hardcoded UI strings across pages and components with `useTranslation()` keys.
  - Localize relative timestamps (`formatRelativeTime`), calendar labels, and date-filter presets via `Intl` + locale-aware helpers.
- [x] **13.3 Language Selector**
  - Add a language picker in Settings so users can switch between English and Spanish at runtime.
- [ ] **13.4 Additional Locales**
  - Add new locale files under `client/src/i18n/locales/` and register them in `SUPPORTED_LOCALES` to support more languages.