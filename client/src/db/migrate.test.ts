import { describe, expect, it } from "vitest"
import { LEGACY_ROOT_DIVISION_NAME, ROOT_DIVISION_ID, ROOT_DIVISION_NAME } from "../lib/divisions"
import { runMigrations, type MigrationDb } from "./migrate"

function createInMemoryMigrationDb(): MigrationDb & { version: number } {
  const tables = new Map<string, Map<string, Record<string, unknown>>>()
  const indexes = new Set<string>()
  let version = 0

  const ensureTable = (name: string) => {
    if (!tables.has(name)) tables.set(name, new Map())
  }

  const exec = (sql: string) => {
    const trimmed = sql.trim()

    if (trimmed.startsWith("PRAGMA user_version =")) {
      version = Number(trimmed.split("=")[1]?.trim())
      return
    }

    if (trimmed.startsWith("CREATE TABLE")) {
      const match = trimmed.match(/CREATE TABLE(?: IF NOT EXISTS)? (\w+)/i)
      if (match?.[1]) ensureTable(match[1])
      return
    }

    if (trimmed.startsWith("CREATE INDEX")) return
    if (trimmed.startsWith("CREATE VIRTUAL TABLE")) {
      ensureTable("notes_fts")
      return
    }
    if (trimmed.startsWith("CREATE TRIGGER")) return

    if (trimmed.startsWith("ALTER TABLE") && trimmed.includes("ADD COLUMN")) {
      const match = trimmed.match(/ALTER TABLE (\w+) ADD COLUMN (\w+)/i)
      if (match?.[1] && match?.[2]) ensureTable(match[1])
      return
    }

    if (trimmed.startsWith("UPDATE divisions SET name")) {
      ensureTable("divisions")
      const divisions = tables.get("divisions")!
      const root = divisions.get(ROOT_DIVISION_ID)
      if (root && root.name === LEGACY_ROOT_DIVISION_NAME) {
        divisions.set(ROOT_DIVISION_ID, { ...root, name: ROOT_DIVISION_NAME })
      }
      return
    }

    if (trimmed.startsWith("INSERT OR IGNORE INTO divisions")) {
      ensureTable("divisions")
      const divisions = tables.get("divisions")!
      if (!divisions.has(ROOT_DIVISION_ID)) {
        divisions.set(ROOT_DIVISION_ID, {
          id: ROOT_DIVISION_ID,
          parent_id: null,
          name: ROOT_DIVISION_NAME,
        })
      }
      return
    }

    if (trimmed.startsWith("UPDATE notes SET division_id")) {
      ensureTable("notes")
      const notes = tables.get("notes")!
      for (const [id, row] of notes) {
        notes.set(id, { ...row, division_id: ROOT_DIVISION_ID })
      }
      return
    }

    if (trimmed.includes("INSERT INTO tags_new")) {
      ensureTable("tags")
      const tags = tables.get("tags")!
      for (const [id, row] of tags) {
        tags.set(id, { ...row, division_id: ROOT_DIVISION_ID })
      }
    }
  }

  return {
    get version() {
      return version
    },
    exec,
    setDivisionNameForTest(id: string, name: string) {
      ensureTable("divisions")
      const divisions = tables.get("divisions")!
      const row = divisions.get(id)
      if (row) divisions.set(id, { ...row, name })
    },
    getDivisionName(id: string) {
      return tables.get("divisions")?.get(id)?.name as string | undefined
    },
    prepare: (sql: string) => ({
      bind: (params: unknown[]) => {
        if (sql.includes("INSERT OR IGNORE INTO divisions")) {
          exec(sql)
          void params
        }
      },
      step: () => false,
      stepFinalize: () => undefined,
      finalize: () => undefined,
      get: () => ({}),
    }),
    selectObjects: (sql: string) => {
      if (sql === "PRAGMA user_version") return [{ user_version: version }]
      if (sql.startsWith("PRAGMA table_info")) {
        const table = sql.match(/PRAGMA table_info\((\w+)\)/)?.[1]
        if (table === "notes") {
          const notes = tables.get("notes")
          const hasDivision = notes && [...notes.values()].some((row) => "division_id" in row)
          const cols = [
            { name: "id" },
            { name: "title" },
            { name: "content" },
            { name: "is_deleted" },
            { name: "created_at" },
            { name: "updated_at" },
          ]
          if (hasDivision || indexes.has("notes_division_added")) cols.push({ name: "division_id" })
          return cols
        }
        if (table === "tags") {
          const tags = tables.get("tags")
          const hasDivision = tags && [...tags.values()].some((row) => "division_id" in row)
          return hasDivision
            ? [{ name: "id" }, { name: "division_id" }, { name: "name" }]
            : [{ name: "id" }, { name: "name" }]
        }
        return []
      }
      if (sql.includes("sqlite_master")) {
        return [...tables.keys()].map((name) => ({ name }))
      }
      return []
    },
  }
}

describe("runMigrations", () => {
  it("advances schema version to 3", () => {
    const db = createInMemoryMigrationDb()
    runMigrations(db)
    expect(db.selectObjects("PRAGMA user_version")[0]?.user_version).toBe(3)
  })

  it("is idempotent when already at version 3", () => {
    const db = createInMemoryMigrationDb()
    runMigrations(db)
    runMigrations(db)
    expect(db.selectObjects("PRAGMA user_version")[0]?.user_version).toBe(3)
  })

  it("renames legacy Main Brain root division to Main", () => {
    const db = createInMemoryMigrationDb()
    runMigrations(db)
    db.setDivisionNameForTest(ROOT_DIVISION_ID, LEGACY_ROOT_DIVISION_NAME)
    expect(db.getDivisionName(ROOT_DIVISION_ID)).toBe(LEGACY_ROOT_DIVISION_NAME)

    runMigrations(db)

    expect(db.getDivisionName(ROOT_DIVISION_ID)).toBe(ROOT_DIVISION_NAME)
  })
})
