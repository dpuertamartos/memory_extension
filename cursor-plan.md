# 🧠 Project Plan: Local-First PWA 2nd Brain (Browser SQLite)

## 🎯 Architectural Strategy
Build a local-first note-taking app that users access via a URL, but where all data remains locally on their device. 
- **Frontend:** React 19, Tailwind CSS v4, Vite (PWA).
- **Database:** SQLite compiled to WASM running in the browser via OPFS (Origin Private File System).
- **ORM:** Drizzle ORM (browser-compatible).
- **Mobile:** Responsive PWA (Installable to Home Screen, works offline).

---

## 🛠 Phase 1: Boilerplate Pruning & PWA Setup
*Objective: Strip the server infrastructure and convert the client into a local-first PWA.*

- [ ] **1.1 Prune the Monorepo**
  - Delete the `server` package completely (no Fastify/tRPC needed).
  - Remove tRPC dependencies from `client/package.json` (`@trpc/client`, `@trpc/react-query`, etc.).
  - Remove `better-auth` from all packages.
  - Delete `client/src/lib/trpc.ts` and remove tRPC providers from `App.tsx`.

- [ ] **1.2 Install Browser Database Dependencies**
  - In `client/package.json`, install: `pnpm add @sqlite.org/sqlite-wasm drizzle-orm`
  - Ensure `vite.config.ts` is configured to serve WASM files correctly (requires setting HTTP headers `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` for OPFS to work).

- [ ] **1.3 Setup PWA**
  - Install `vite-plugin-pwa`.
  - Configure `vite.config.ts` to generate a manifest (name, icons, theme color) and register a service worker for offline support.

---

## 🗄 Phase 2: In-Browser SQLite & Drizzle Configuration
*Objective: Set up a real SQLite database inside the browser's isolated file system.*

- [ ] **2.1 Initialize OPFS SQLite**
  - Create `client/src/lib/db.ts`.
  - Write logic to initialize `@sqlite.org/sqlite-wasm`.
  - Connect it to the OPFS so data persists across page reloads.

- [ ] **2.2 Define Drizzle Schema (`client/src/db/schema.ts`)**
  - Move the schema definitions from the old `packages/drizzle` into the client.
  - **`notes`**: `id` (string/ULID), `title`, `content` (Markdown), `created_at`, `updated_at`.
  - **`tags`**: `id`, `name`, `color`.
  - **`note_tags`**: Many-to-many join table.

- [ ] **2.3 FTS5 (Full-Text Search) Setup**
  - Write a raw SQL migration script that runs on app initialization if tables don't exist.
  - Include the FTS5 virtual table setup:
    ```sql
    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(title, content, content='notes', content_rowid='id');
    ```
  - Create SQLite `AFTER INSERT`, `AFTER UPDATE`, `AFTER DELETE` triggers to sync `notes` to `notes_fts`.

- [ ] **2.4 Connect Drizzle to Browser SQLite**
  - Export the initialized Drizzle instance: `export const db = drizzle(sqliteWasmClient, { schema });`

---

## ⚙️ Phase 3: Core App Logic (Replacing tRPC with Hooks)
*Objective: Build custom React hooks that talk directly to the local Drizzle instance.*

- [ ] **3.1 Create Data Access Layer (`client/src/hooks/useNotes.ts`)**
  - `useCreateNote`: Inserts into `db`.
  - `useUpdateNote`: Updates `db` with debounce.
  - `useDeleteNote`: Deletes from `db`.
  - Wrap these Drizzle queries in TanStack Query (`useQuery` / `useMutation`) so the UI still caches and updates responsively, just like it did with tRPC.

- [ ] **3.2 Create Search Layer (`client/src/hooks/useSearch.ts`)**
  - `useGlobalSearch(query)`: Executes a raw SQL query against `notes_fts` using the `MATCH` operator.
  - Use SQLite's `snippet()` function to return highlighted text fragments.

---

## 🖥 Phase 4: UI Development (Mobile-First & Responsive)
*Objective: Build an interface that works as a desktop web app and a mobile PWA.*

- [ ] **4.1 Responsive Layout Shell**
  - Modify `LayoutApp.tsx`.
  - **Desktop:** Sidebar (tags) + Note List (search) + Editor (3 panes).
  - **Mobile:** Bottom navigation bar or hamburger menu. Only show one pane at a time with smooth sliding transitions.

- [ ] **4.2 The "Omnibox" (Search Engine)**
  - A global search input at the top of the app.
  - As the user types, instantly query the local SQLite FTS table.
  - Because it's local WASM, search will take < 5ms. Update UI instantly without debounce delays needed for network requests.

- [ ] **4.3 Note Editor**
  - Use a mobile-friendly Markdown editor (e.g., standard `textarea` with auto-resize, or a lightweight block editor).
  - Implement a fast tag selector UI (typing `#` to open a tag list).

---

## 📦 Phase 5: Exportability & File Management
*Objective: Give the user absolute control over their local data.*

- [ ] **5.1 Database Export (SQLite File)**
  - Create an "Export" settings page.
  - Use the HTML5 File API or OPFS API to read the raw `local-brain.sqlite` file.
  - Create a Blob and trigger a browser download so the user gets the `.sqlite` file on their local disk.

- [ ] **5.2 Markdown Export**
  - Add a "Download as Markdown" button.
  - Query all notes via Drizzle.
  - Loop through and create a `.zip` file (using `jszip`) where every note is a `.md` file with tags in the YAML frontmatter. Trigger download.

- [ ] **5.3 Database Import (Restore)**
  - Allow the user to upload a previously exported `.sqlite` file.
  - Overwrite the OPFS file and reload the page to restore the backup.

---

## ☁️ Phase 6: Future Cloud Sync Architecture (Prep)
*Objective: Architect data so it can be synced to a cloud later without redesigning.*

- [ ] **6.1 Use ULIDs**
  - Instead of Auto-Increment IDs or standard UUIDs, use **ULIDs** for all table Primary Keys. ULIDs are timestamp-sortable, which prevents massive conflicts when merging databases from two offline devices later.
- [ ] **6.2 Timestamping**
  - Ensure every table has `created_at` and `updated_at`.
- [ ] **6.3 Soft Deletes**
  - Instead of hard `DELETE FROM notes`, set `is_deleted = true`. This ensures that when the user eventually connects to a cloud, the cloud knows the note was deleted and can delete it on other devices.