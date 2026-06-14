/// <reference lib="webworker" />
import sqlite3InitModule from "@sqlite.org/sqlite-wasm"
import { runMigrations, type MigrationDb } from "./migrate"

const DB_PATH = "/local-brain.sqlite3"

type QueryMethod = "run" | "all" | "values" | "get" | "allObjects"

type WorkerRequest =
  | {
      id: number
      type: "query"
      sql: string
      params: unknown[]
      method: QueryMethod
    }
  | { id: number; type: "init" }
  | { id: number; type: "export" }
  | { id: number; type: "import"; data: ArrayBuffer }

type WorkerResponse = {
  id: number
  rows?: unknown
  data?: ArrayBuffer
  error?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capi: any = null

function getMigrationDb(): MigrationDb {
  if (!db) throw new Error("Database not initialized")
  return {
    exec: (sql: string) => db.exec(sql),
    prepare: (sql: string) => db.prepare(sql),
    selectObjects: (sql: string, params: unknown[] = []) => {
      const stmt = db.prepare(sql)
      if (params.length > 0) stmt.bind(params)
      const rows: Record<string, unknown>[] = []
      while (stmt.step()) {
        rows.push(stmt.get({}))
      }
      stmt.finalize()
      return rows
    },
  }
}

function runMigration() {
  if (!db) return
  runMigrations(getMigrationDb())
}

function executeQuery(sql: string, params: unknown[], method: QueryMethod): unknown {
  if (!db) throw new Error("Database not initialized")

  if (method === "run") {
    if (params.length === 0) {
      db.exec(sql)
      return []
    }

    const stmt = db.prepare(sql)
    stmt.bind(params)
    stmt.stepFinalize()
    return []
  }

  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params)

  if (method === "get") {
    const row = stmt.step() ? stmt.get([]) : undefined
    stmt.finalize()
    return row
  }

  if (method === "allObjects") {
    const rows: Record<string, unknown>[] = []
    while (stmt.step()) {
      rows.push(stmt.get({}))
    }
    stmt.finalize()
    return rows
  }

  if (method === "all" || method === "values") {
    const rows: unknown[][] = []
    while (stmt.step()) {
      rows.push(stmt.get([]))
    }
    stmt.finalize()
    return rows
  }

  stmt.finalize()
  return []
}

async function initDb() {
  if (db) return

  const sqlite3 = await sqlite3InitModule()
  capi = sqlite3.capi
  db =
    "opfs" in sqlite3 && sqlite3.opfs
      ? new sqlite3.oo1.OpfsDb(DB_PATH)
      : new sqlite3.oo1.DB(DB_PATH, "ct")

  runMigration()
}

function exportDatabase(): ArrayBuffer {
  if (!db || !capi) throw new Error("Database not initialized")

  const bytes = capi.sqlite3_js_db_export(db, "main")
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function importDatabase(data: ArrayBuffer) {
  if (!db || !capi) throw new Error("Database not initialized")
  if (!db.pointer) throw new Error("Database pointer unavailable")

  const bytes = new Uint8Array(data)
  const rc = capi.sqlite3_deserialize(
    db.pointer,
    "main",
    bytes,
    bytes.byteLength,
    bytes.byteLength,
    capi.SQLITE_DESERIALIZE_RESIZEABLE,
  )

  if (rc !== capi.SQLITE_OK) {
    throw new Error(`Failed to import database (code ${rc})`)
  }

  runMigration()
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data

  try {
    if (message.type === "init") {
      await initDb()
      self.postMessage({ id: message.id } satisfies WorkerResponse)
      return
    }

    if (!db) await initDb()

    if (message.type === "query") {
      const rows = executeQuery(message.sql, message.params, message.method)
      self.postMessage({ id: message.id, rows } satisfies WorkerResponse)
      return
    }

    if (message.type === "export") {
      const exported = exportDatabase()
      self.postMessage({ id: message.id, data: exported } satisfies WorkerResponse, [exported])
      return
    }

    if (message.type === "import") {
      importDatabase(message.data)
      self.postMessage({ id: message.id } satisfies WorkerResponse)
    }
  } catch (error) {
    self.postMessage({
      id: message.id,
      error: error instanceof Error ? error.message : "Unknown worker error",
    } satisfies WorkerResponse)
  }
}
