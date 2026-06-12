import { describe, expect, it, vi } from "vitest"

vi.mock("../lib/db", () => ({
  db: {},
  initDb: vi.fn(),
}))

import { parseSyncSnapshotJson, serializeSyncSnapshot } from "./snapshot"
import { SYNC_SNAPSHOT_VERSION, type SyncSnapshot } from "./types"

const sampleSnapshot: SyncSnapshot = {
  version: SYNC_SNAPSHOT_VERSION,
  exportedAt: 1_700_000_000_000,
  notes: [
    {
      id: "note-1",
      title: "Test",
      content: "Body",
      isDeleted: false,
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_000_000,
    },
  ],
  tags: [
    {
      id: "tag-1",
      name: "ideas",
      color: "#6366f1",
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_000_000,
    },
  ],
  noteTags: [{ noteId: "note-1", tagId: "tag-1" }],
}

describe("serializeSyncSnapshot", () => {
  it("round-trips through JSON", () => {
    const json = serializeSyncSnapshot(sampleSnapshot)
    const parsed = parseSyncSnapshotJson(json)
    expect(parsed).toEqual(sampleSnapshot)
  })
})

describe("parseSyncSnapshotJson", () => {
  it("rejects unsupported versions", () => {
    const invalid = JSON.stringify({ ...sampleSnapshot, version: 99 })
    expect(() => parseSyncSnapshotJson(invalid)).toThrow(/Unsupported sync snapshot version/)
  })

  it("rejects malformed payloads", () => {
    expect(() => parseSyncSnapshotJson(JSON.stringify({ version: SYNC_SNAPSHOT_VERSION }))).toThrow(
      /Invalid sync snapshot payload/,
    )
  })
})
