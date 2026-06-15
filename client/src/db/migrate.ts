import { ROOT_DIVISION_ID, ROOT_DIVISION_NAME } from "../lib/divisions"

export const SCHEMA_VERSION = 3

export const MIGRATION_V1_SQL = `
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  is_deleted INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS note_tags (
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
  note_id UNINDEXED,
  title,
  content
);

CREATE TRIGGER IF NOT EXISTS notes_fts_insert
AFTER INSERT ON notes
WHEN NEW.is_deleted = 0
BEGIN
  INSERT INTO notes_fts(note_id, title, content)
  VALUES (NEW.id, NEW.title, NEW.content);
END;

CREATE TRIGGER IF NOT EXISTS notes_fts_update
AFTER UPDATE ON notes
BEGIN
  DELETE FROM notes_fts WHERE note_id = OLD.id;
  INSERT INTO notes_fts(note_id, title, content)
  SELECT NEW.id, NEW.title, NEW.content
  WHERE NEW.is_deleted = 0;
END;

CREATE TRIGGER IF NOT EXISTS notes_fts_delete
AFTER DELETE ON notes
BEGIN
  DELETE FROM notes_fts WHERE note_id = OLD.id;
END;
`

const MIGRATION_V2_DIVISIONS_SQL = `
CREATE TABLE IF NOT EXISTS divisions (
  id TEXT PRIMARY KEY NOT NULL,
  parent_id TEXT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(parent_id, name)
);

CREATE INDEX IF NOT EXISTS idx_divisions_parent ON divisions(parent_id);
CREATE INDEX IF NOT EXISTS idx_divisions_parent_sort ON divisions(parent_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_divisions_active ON divisions(parent_id, is_active, is_deleted);
`

export type MigrationDb = {
  exec: (sql: string) => void
  prepare: (sql: string) => {
    bind: (params: unknown[]) => void
    step: () => boolean
    stepFinalize: () => void
    finalize: () => void
    get: (opts: Record<string, never>) => Record<string, unknown>
  }
  selectObjects: (sql: string, params?: unknown[]) => Record<string, unknown>[]
}

function columnExists(db: MigrationDb, table: string, column: string): boolean {
  const rows = db.selectObjects(`PRAGMA table_info(${table})`)
  return rows.some((row) => row.name === column)
}

function tableExists(db: MigrationDb, table: string): boolean {
  const rows = db.selectObjects(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    [table],
  )
  return rows.length > 0
}

function migrateToV2(db: MigrationDb) {
  db.exec(MIGRATION_V2_DIVISIONS_SQL)

  const now = Date.now()
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO divisions
     (id, parent_id, name, description, is_active, sort_order, is_deleted, created_at, updated_at)
     VALUES (?, NULL, ?, '', 1, 0, 0, ?, ?)`,
  )
  stmt.bind([ROOT_DIVISION_ID, ROOT_DIVISION_NAME, now, now])
  stmt.stepFinalize()

  if (!columnExists(db, "notes", "division_id")) {
    db.exec(`ALTER TABLE notes ADD COLUMN division_id TEXT REFERENCES divisions(id)`)
  }
  db.exec(`UPDATE notes SET division_id = '${ROOT_DIVISION_ID}' WHERE division_id IS NULL`)
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_notes_division ON notes(division_id, is_deleted, updated_at)`,
  )

  if (tableExists(db, "tags") && !columnExists(db, "tags", "division_id")) {
    db.exec(`
      CREATE TABLE tags_new (
        id TEXT PRIMARY KEY NOT NULL,
        division_id TEXT NOT NULL REFERENCES divisions(id),
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#6366f1',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(division_id, name)
      );

      INSERT INTO tags_new (id, division_id, name, color, created_at, updated_at)
      SELECT id, '${ROOT_DIVISION_ID}', name, color, created_at, updated_at FROM tags;

      DROP TABLE tags;
      ALTER TABLE tags_new RENAME TO tags;

      CREATE INDEX IF NOT EXISTS idx_tags_division ON tags(division_id);
    `)
  } else if (columnExists(db, "tags", "division_id")) {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_tags_division ON tags(division_id)`)
  }
}

function migrateToV3(db: MigrationDb) {
  if (!tableExists(db, "tags")) return

  const hasDivisionColumn = columnExists(db, "tags", "division_id")
  if (!hasDivisionColumn) return

  db.exec(`
    CREATE TABLE tags_canonical_map (
      old_id TEXT PRIMARY KEY NOT NULL,
      canonical_id TEXT NOT NULL
    );

    INSERT INTO tags_canonical_map (old_id, canonical_id)
    SELECT t.id,
      (
        SELECT t2.id FROM tags t2
        WHERE t2.name = t.name
        ORDER BY t2.created_at ASC, t2.id ASC
        LIMIT 1
      )
    FROM tags t;

    CREATE TABLE note_tags_new (
      note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (note_id, tag_id)
    );

    INSERT OR IGNORE INTO note_tags_new (note_id, tag_id)
    SELECT nt.note_id, m.canonical_id
    FROM note_tags nt
    INNER JOIN tags_canonical_map m ON m.old_id = nt.tag_id;

    DROP TABLE note_tags;
    ALTER TABLE note_tags_new RENAME TO note_tags;

    CREATE TABLE tags_global (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6366f1',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    INSERT INTO tags_global (id, name, color, created_at, updated_at)
    SELECT m.canonical_id, t.name, t.color, t.created_at, t.updated_at
    FROM tags_canonical_map m
    INNER JOIN tags t ON t.id = m.canonical_id
    GROUP BY m.canonical_id;

    DROP TABLE tags_canonical_map;
    DROP TABLE tags;
    ALTER TABLE tags_global RENAME TO tags;
  `)
}

export function runMigrations(db: MigrationDb): void {
  const versionRows = db.selectObjects("PRAGMA user_version")
  let version = Number(versionRows[0]?.user_version ?? 0)

  if (version < 1) {
    db.exec(MIGRATION_V1_SQL)
    version = 1
    db.exec(`PRAGMA user_version = 1`)
  }

  if (version < 2) {
    migrateToV2(db)
    db.exec(`PRAGMA user_version = 2`)
    version = 2
  }

  if (version < 3) {
    migrateToV3(db)
    db.exec(`PRAGMA user_version = 3`)
  }
}

/** @deprecated Use runMigrations — kept for tests that import the bootstrap SQL. */
export const MIGRATION_SQL = MIGRATION_V1_SQL
