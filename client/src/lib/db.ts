import { drizzle } from "drizzle-orm/sqlite-proxy"
import SqliteWorker from "../db/sqlite.worker?worker"
import { schema } from "../db/schema"

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

let requestId = 0
const worker = new SqliteWorker()
const pending = new Map<number, { resolve: (value: WorkerResponse) => void; reject: (error: Error) => void }>()

worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
  const { id, error, rows, data } = event.data
  const entry = pending.get(id)
  if (!entry) return
  pending.delete(id)
  if (error) {
    entry.reject(new Error(error))
    return
  }
  entry.resolve({ id, rows, data })
}

function postMessage<T extends WorkerRequest>(message: T): Promise<WorkerResponse> {
  const id = ++requestId
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    if (message.type === "import") {
      worker.postMessage({ ...message, id }, [message.data])
    } else {
      worker.postMessage({ ...message, id })
    }
  })
}

async function runWorkerQuery(sql: string, params: unknown[], method: QueryMethod) {
  const response = await postMessage({ id: 0, type: "query", sql, params, method })

  if (method === "get") {
    return { rows: response.rows as unknown[] }
  }

  if (method === "run") {
    return { rows: [] }
  }

  if (method === "allObjects") {
    return { rows: (Array.isArray(response.rows) ? response.rows : []) as unknown[] }
  }

  return { rows: (Array.isArray(response.rows) ? response.rows : []) as unknown[] }
}

export const db = drizzle(runWorkerQuery, { schema })

let initPromise: Promise<void> | null = null

export function initDb() {
  if (!initPromise) {
    initPromise = postMessage({ id: 0, type: "init" }).then(() => undefined)
  }
  return initPromise
}

export async function exportDatabaseFile(): Promise<Blob> {
  await initDb()
  const response = await postMessage({ id: 0, type: "export" })
  if (!response.data) throw new Error("Export returned no data")
  return new Blob([response.data], { type: "application/x-sqlite3" })
}

export async function importDatabaseFile(file: File) {
  await initDb()
  const buffer = await file.arrayBuffer()
  await postMessage({ id: 0, type: "import", data: buffer })
}

export async function runRawQuery<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const response = await postMessage({ id: 0, type: "query", sql, params, method: "allObjects" })
  return (response.rows ?? []) as T[]
}
