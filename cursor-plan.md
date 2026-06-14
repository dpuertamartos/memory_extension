# Project Plan: Local-First PWA 2nd Brain (Browser SQLite)

## Current Status (June 2026)

**Phases 1–13 are complete (except Playwright Chromium E2E in 12.5). Phase 14 is planned.** The app is a client-only PWA with in-browser SQLite (OPFS), Drizzle ORM, full-text search, a responsive 3-pane UI, export/import, advanced markdown editing, cloud-sync preparation, advanced discovery filters, and a calendar memory view.

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
| 11. Internationalization (i18n) | Partial (en + es) |
| 12. UX Polish, App Install & Tech Debt | Partial (E2E pending) |
| 13. Tag & Calendar UX Enhancements | Done |
| 14. Sub Brains (Hierarchical Divisions) | Planned (redesign — explicit inclusion tree) |

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

---

## Phase 11: Internationalization (i18n)

*Objective: Make the app accessible in multiple languages, starting with Spanish, with an architecture that scales to additional locales.*

- [x] **11.1 i18n Infrastructure**
  - Add `i18next` and `react-i18next` to the client package.
  - Create `client/src/i18n/` with locale JSON files (`en`, `es`) and a central init module.
  - Detect browser language on first visit; persist user choice in `localStorage`.
- [x] **11.2 UI String Extraction**
  - Replace hardcoded UI strings across pages and components with `useTranslation()` keys.
  - Localize relative timestamps (`formatRelativeTime`), calendar labels, and date-filter presets via `Intl` + locale-aware helpers.
- [x] **11.3 Language Selector**
  - Add a language picker in Settings so users can switch between English and Spanish at runtime.

---

## Phase 12: UX Polish, App Install & Tech Debt

*Objective: Improve mobile usability, fix UI glitches, allow explicit app installation, and pay down technical debt.*

- [x] **12.1 Search Bar UI & Mobile UX**
  - Fix the aesthetics of the search bar (magnifying glass icon overlapping the input text).
  - Improve mobile search interaction (make it more obvious how to search without relying exclusively on the "Enter" key; e.g., add a visible submit/search button).
- [x] **12.2 Calendar Interactivity**
  - Make the notes clickable directly within the calendar view so users can navigate to and edit them.
- [x] **12.3 PWA Installation**
  - Create an explicit "Install App" (Add to Home Screen) button to make the PWA easily accessible as a native-like app on mobile devices.
- [x] **12.4 Codebase Refactoring**
  - Conduct a comprehensive refactor to address technical debt, improving overall maintainability and extensibility of the codebase.
- [ ] **12.5 Chromium End-to-End Tests**
  - Playwright specs exist in `tests-e2e/tests/` (smoke, note CRUD, tags, search); `webServer` is configured to start the dev server from the repo root.
  - Install browsers (`cd tests-e2e && pnpm run install:browsers`) and verify `pnpm test:e2e` passes on a non-WSL environment (native Linux, macOS, or Windows host). Chromium downloads often hang or extract incompletely on WSL.
  - Until E2E is green in CI or locally, rely on Vitest integration tests in `client/src/integration/userFlows.test.tsx` (`pnpm test`) for the same user flows without a real browser.
  - Optional follow-up: add a GitHub Actions workflow that runs `pnpm test:e2e` on `ubuntu-latest` after `playwright install chromium`.

---

## Phase 13: Tag & Calendar UX Enhancements

*Objective: Improve tag management on individual notes and make calendar insights more useful across scopes.*

- [x] **13.1 Remove Tags from Notes**
  - Allow users to remove an assigned tag from the current note (e.g., × button on tag chips in `NoteEditor.tsx` via existing `TagChip` `onRemove` support).
  - Wire removal through `useSetNoteTags` so the note–tag join is updated without deleting the tag globally.
- [x] **13.2 Fix Calendar Keyword Truncation**
  - When a selected day has many notes, top keywords in the calendar sidebar are clipped or cut off.
  - Improve layout in `CalendarView.tsx` (overflow, wrapping, scroll, or expandable list) so top keywords remain readable on busy days.
- [x] **13.3 Scope-Level Tags & Keywords in Calendar**
  - Extend `useCalendarNotes` so top tags and keywords aggregate over the active scope (week, month, year), not only the selected day.
  - Surface period-level insights in the calendar sidebar alongside per-day stats when a broader scope is selected.

---

## Phase 14: Sub Brains (Hierarchical Divisions)

*Objective: Let users partition their brain into a nestable tree of sub-brains, then **choose exactly which subdivisions contribute notes/tags to the current view** via checkboxes — without duplicating data and while staying fast at 1 000+ divisions.*

> **Note (June 2026):** An initial Phase 14 implementation exists in the codebase (schema, divisions table, tree UI). It used automatic ancestor/descendant visibility and must be **reimplemented** against the explicit inclusion model below before this phase is considered done.

### Design principles

1. **One tree, many namespaces** — A single `divisions` table forms an arbitrarily deep hierarchy (Main Brain → Football / Basketball → Real Madrid / Barcelona → …). Depth is unbounded; 1 000+ nodes must remain fast on in-browser SQLite.
2. **Ownership vs inclusion (split concerns)** — Every note/tag still belongs to **exactly one** `division_id` (where it was created). What the user sees is controlled by a separate **inclusion set** (`includedDivisionIds`), not by implicit parent/child bubbling.
3. **Explicit inclusion, downward cascade by default** — The sidebar tree shows checkboxes. Checking a subdivision includes it **and all descendants by default**. The user can then uncheck individual children (or check siblings on other branches) at will. **Parents are never auto-included** — notes created in a parent division do not appear unless that parent is explicitly checked.
4. **Focus vs filter** — `focusDivisionId` (navigation / breadcrumb / create target) and `includedDivisionIds` (query filter) are distinct state. New notes and tags are always created in `focusDivisionId`, regardless of which divisions are checked for display.
5. **Opt-in activation** — Divisions can be created but left inactive (`is_active = false`); inactive branches are hidden from the tree unless the user enables "Show inactive" in Settings. Their data is preserved.
6. **Sync-compatible** — Divisions get ULIDs, timestamps, and soft deletes. Inclusion preferences are local UI state (persisted in `localStorage`), not synced — same pattern as locale or theme.

### Inclusion semantics (product rules)

Example tree:

```
Main Brain
├─ Football
│  ├─ Real Madrid
│  └─ Barcelona
└─ Basketball
```

| User action | Default inclusion result |
| ----------- | ------------------------ |
| Focus **Football** (first visit) | `{ Football, Real Madrid, Barcelona }` — **not** Main Brain |
| Check **Barcelona** manually | `{ Barcelona }` only (unless user also checks descendants) |
| Check **Football** | `{ Football, Real Madrid, Barcelona }` (all descendants checked) |
| Uncheck **Barcelona** after checking Football | `{ Football, Real Madrid }` — parent stays checked, one child removed |
| Focus **Main Brain** | `{ Main Brain, Football, Real Madrid, Barcelona, Basketball }` (focus node + all descendants) |

**Hard rules:**

- Checking division `D` → add `D` and all descendants to `includedDivisionIds` (one-shot cascade downward).
- Unchecking `D` → remove `D` from the set; descendants stay as-is unless the UI offers "uncheck subtree" (optional; not required for v1).
- **Never** auto-add ancestors when focusing or checking a child.
- Notes/tags query: `WHERE division_id IN (includedDivisionIds)` — only explicitly included divisions, no notes from unchecked parents or siblings.

**Checkbox UI states (tri-state):**

| State | Meaning |
| ----- | ------- |
| Checked | Division is in `includedDivisionIds`. |
| Unchecked | Division is not included. |
| Indeterminate | Division is not included, but at least one descendant is. |

### 14.0 Data model

#### New table: `divisions`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | TEXT PK | ULID |
| `parent_id` | TEXT NULL | FK → `divisions.id` ON DELETE CASCADE. `NULL` = root ("Main Brain"). |
| `name` | TEXT | Display name (`UNIQUE(parent_id, name)`). |
| `description` | TEXT | Optional. Default `''`. |
| `is_active` | INTEGER | Boolean. Inactive = hidden from tree (unless setting on). |
| `sort_order` | INTEGER | Sibling ordering. |
| `is_deleted` | INTEGER | Soft delete for sync. |
| `created_at` / `updated_at` | INTEGER | ms timestamps. |

**Indexes:**

```sql
CREATE INDEX idx_divisions_parent       ON divisions(parent_id);
CREATE INDEX idx_divisions_parent_sort  ON divisions(parent_id, sort_order);
CREATE INDEX idx_divisions_active       ON divisions(parent_id, is_active, is_deleted);
```

**Why adjacency list?** Sufficient for ≤ few thousand nodes. Build an in-memory `childrenByParentId` map once per divisions fetch — O(1) child lookup, O(subtree) for cascade toggles. Do **not** add closure table or materialized path unless profiling proves tree walks are a bottleneck.

#### Extend existing tables

| Table | Change |
| ----- | ------ |
| `notes` | `division_id TEXT NOT NULL` FK → `divisions.id`. Index `(division_id, is_deleted, updated_at)`. |
| `tags` | `division_id TEXT NOT NULL` FK → `divisions.id`. `UNIQUE(division_id, name)`. Index `(division_id)`. |
| `note_tags` | No change — scoping via note/tag FKs. |
| `notes_fts` | No schema change — filter via `notes.division_id IN (includedIds)`. |

#### Root division & migration

- Insert root row (`parent_id = NULL`, `name = 'Main Brain'`) on migration.
- Backfill legacy `notes` / `tags` to root ULID.
- Versioned step in `client/src/db/migrate.ts` (e.g. `MIGRATION_V2`).

```
divisions (tree)                notes / tags (owned)
─────────────────               ────────────────────
NULL  → Main Brain              division_id = root
  ├─ Football                   division_id = football
  │    ├─ Real Madrid           division_id = madrid
  │    └─ Barcelona             division_id = barcelona
  └─ Basketball                 division_id = basketball
```

A note created while focused on **Barcelona** always has `division_id = barcelona`. It appears in the list only if **Barcelona** (or an ancestor that was **explicitly checked** — rare) is in `includedDivisionIds`. By default, focusing Football shows it; focusing Basketball does not.

### 14.1 State & data access

#### 14.1.1 Division tree index (in-memory, not in DB)

`client/src/lib/divisionTree.ts`:

- `buildChildrenMap(divisions)` → `Map<parentId, Division[]>`
- `getDescendantIds(divisions, id)` → `string[]` (for cascade-on-check)
- `getAncestorChain(divisions, id)` → breadcrumb only; **not** used for query filtering
- `computeCheckboxState(id, includedIds, childrenMap)` → `checked | unchecked | indeterminate`

Rebuild the children map when the divisions query updates — not on every render.

#### 14.1.2 App store (`useAppStore`)

| Field | Purpose |
| ----- | ------- |
| `focusDivisionId` | Navigation target, breadcrumb, **create** scope for new notes/tags. Persisted. |
| `includedDivisionIds` | `string[]` — explicit filter for reads. Persisted. |
| `setFocusDivision(id)` | Set focus; **reset** `includedDivisionIds` to `[id, ...descendantIds(id)]`; clear note/tag/search selection. |
| `toggleDivisionIncluded(id, checked)` | If checking: union `id + descendants`. If unchecking: delete `id` only. Recompute indeterminate states. |
| `setIncludedDivisionIds(ids)` | Bulk replace (e.g. "select all visible", "clear all"). |

**Query key shape:** `["notes", focusDivisionId, includedIds.join(","), tagId?]` — inclusion must be part of the cache key so toggling checkboxes invalidates correctly.

#### 14.1.3 Division hooks (`useDivisions.ts`)

- `useDivisions()` — all non-deleted divisions (full list for index build).
- `useDivisionTree()` — tree + children map for sidebar.
- CRUD: `useCreateDivision`, `useUpdateDivision`, `useDeleteDivision` (block if children/notes/tags), `useSetDivisionActive`.
- **Remove** `getVisibleDivisionIds()` / ancestor-based visibility — replaced by `includedDivisionIds` from store.

#### 14.1.4 Scope existing hooks

- `useNotes`, `useTags`, `useGlobalSearch`, `useCalendarNotes` — read `includedDivisionIds` from store; query `division_id IN (...)`.
- Mutations (create) use `focusDivisionId` only.
- Mutations (update/delete) keyed by note/tag `id` (globally unique ULIDs) — no division guard needed on write.
- If `includedDivisionIds` is empty, return empty lists (don't fall back to all notes).

### 14.2 Sync & export

- [ ] **14.2.1** `SyncSnapshot` v2 — `divisions[]` + `divisionId` on notes/tags.
- [ ] **14.2.2** LWW merge for divisions; block delete if children exist.
- [ ] **14.2.3** Markdown export includes `division_id` + path; import maps unknown IDs to root.
- Inclusion preferences are **not** in the sync snapshot (device-local UX state).

### 14.3 UI

- [ ] **14.3.1 Inclusion tree** — Above tags in `TagSidebar`: collapsible tree with **checkbox** + label per division. Clicking the label sets `focusDivisionId` (highlight row); clicking the checkbox toggles inclusion only.
- [ ] **14.3.2 Breadcrumb** — `Main Brain › Football › Barcelona`; segments set `focusDivisionId` and apply the default inclusion reset for that node.
- [ ] **14.3.3 Division management** — Create / edit / activate / delete (existing dialog pattern). "New sub-brain" creates under `focusDivisionId`.
- [ ] **14.3.4 Scoped panes** — Note list, editor, Omnibox, calendar all respect `includedDivisionIds`. Optional: show a small chip on each note indicating its owning division when viewed from a parent focus.
- [ ] **14.3.5 i18n** — `divisions.*` keys in `en` / `es` (checkbox labels, indeterminate aria, inclusion help text).

### 14.4 Performance (1 000+ divisions)

| Concern | Mitigation |
| ------- | ---------- |
| Tree render | Virtualize if expanded nodes > ~200 (`@tanstack/react-virtual`). Lazy expand per node. |
| Children map | Build once per divisions query result; share via `useMemo` / query `select`. |
| Toggle cascade | O(subtree) set union on check — acceptable; subtrees are small in practice. |
| SQL `IN` clause | Indexed `division_id`; batch IDs (SQLite default max ~999 variables — stay under or chunk). |
| Query cache | Keys include sorted `includedDivisionIds` fingerprint. Invalidate `["notes"]` / `["tags"]` on inclusion change. |
| Persisted state | Store `includedDivisionIds` as sorted JSON array in `localStorage` for stable keys. |
| Search FTS | `JOIN notes ON … WHERE notes.division_id IN (includedIds)` — same pattern as list. |

**Do not** walk the full tree on every keystroke or search debounce — read the precomputed `includedDivisionIds` array from Zustand.

### 14.5 Verification

- [ ] Migration: legacy DB upgrades; all old notes/tags owned by root.
- [ ] Default inclusion: focus Football → sees Football + Real Madrid + Barcelona notes; **not** Main Brain or Basketball notes.
- [ ] Cascade: check Football → all children checked; uncheck Barcelona → Football + Real Madrid remain.
- [ ] Parents excluded: note created in Main Brain invisible when focused on Football (Main Brain unchecked).
- [ ] Create: note created while focused on Barcelona has `division_id = barcelona`; appears when Barcelona is included, even if Football is unchecked.
- [ ] Performance: 1 000 divisions + 5 000 notes — inclusion toggle and list query < 100 ms on dev hardware.
- [ ] Sync v2 round-trip preserves hierarchy; inclusion prefs stay local.
- [ ] i18n: inclusion UI in en and es.

### Implementation order (revised)

1. Revert or refactor ancestor-based visibility (`getVisibleDivisionIds`) → explicit `includedDivisionIds` in store (**14.1.2**).
2. Division tree index + checkbox state helpers (**14.1.1**).
3. Rewire hooks to `IN (includedDivisionIds)` + create on `focusDivisionId` (**14.1.4**).
4. Inclusion tree UI + breadcrumb focus behavior (**14.3.1–14.3.2**).
5. Division CRUD UI (**14.3.3**).
6. Sync snapshot v2 if not already complete (**14.2**).
7. i18n + verification (**14.3.5**, **14.5**).

Schema + migration from the first pass can be reused as-is; the redesign is primarily **state model + UI + query filter**.

---

## Last Phase: SEO Landing Page (Astro)

*Objective: Build a marketing landing page optimized for search engines to drive traffic to the main application.*

- [ ] **XX.1 Astro Setup**
  - Initialize a new Astro project (e.g., inside a `landing` package) optimized for Google SEO.
- [ ] **XX.2 Custom Memory/Brain Aesthetic**
  - Design a unique, handcrafted visual identity centered around the concepts of memory, the brain, and local-first privacy (specifically avoiding generic "AI slop" aesthetics).
- [ ] **XX.4.3 App Routing**
  - Provide clear calls-to-action (CTAs) linking the marketing landing page directly to the main PWA application.