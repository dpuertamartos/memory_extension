import { describe, expect, it } from "vitest"
import { ROOT_DIVISION_ID } from "../lib/divisions"
import { mergeSyncSnapshots, pickSyncWinner } from "./merge"
import type { SyncSnapshot } from "./types"
import { SYNC_SNAPSHOT_VERSION } from "./types"

const rootDivision = {
  id: ROOT_DIVISION_ID,
  parentId: null,
  name: "Main Brain",
  description: "",
  isActive: true,
  sortOrder: 0,
  isDeleted: false,
  createdAt: 100,
  updatedAt: 100,
}

const snapshot = (
  partial: Partial<SyncSnapshot> & Pick<SyncSnapshot, "notes">,
): SyncSnapshot => ({
  version: SYNC_SNAPSHOT_VERSION,
  exportedAt: 1_700_000_000_000,
  divisions: [rootDivision],
  tags: [],
  noteTags: [],
  ...partial,
})

describe("pickSyncWinner", () => {
  it("prefers the newer updatedAt timestamp", () => {
    const local = { id: "01NOTE", updatedAt: 100 }
    const remote = { id: "01NOTE", updatedAt: 200 }

    expect(pickSyncWinner(local, remote)).toEqual({ winner: remote, side: "remote" })
    expect(pickSyncWinner(local, remote).winner.updatedAt).toBe(200)
  })

  it("breaks ties deterministically in favor of remote", () => {
    const local = { id: "01LOCAL", updatedAt: 100 }
    const remote = { id: "01REMOTE", updatedAt: 100 }

    expect(pickSyncWinner(local, remote)).toEqual({ winner: remote, side: "remote" })
  })
})

describe("mergeSyncSnapshots", () => {
  it("keeps the newer note revision", () => {
    const local = snapshot({
      notes: [
        {
          id: "01NOTE",
          divisionId: ROOT_DIVISION_ID,
          title: "Local title",
          content: "Local body",
          isDeleted: false,
          createdAt: 100,
          updatedAt: 100,
        },
      ],
    })
    const remote = snapshot({
      notes: [
        {
          id: "01NOTE",
          divisionId: ROOT_DIVISION_ID,
          title: "Remote title",
          content: "Remote body",
          isDeleted: false,
          createdAt: 100,
          updatedAt: 200,
        },
      ],
    })

    const result = mergeSyncSnapshots(local, remote)

    expect(result.merged.notes).toHaveLength(1)
    expect(result.merged.notes[0]?.title).toBe("Remote title")
    expect(result.stats.notes.remoteWins).toBe(1)
    expect(result.conflicts).toHaveLength(1)
  })

  it("propagates soft-delete tombstones when they are newer", () => {
    const local = snapshot({
      notes: [
        {
          id: "01NOTE",
          divisionId: ROOT_DIVISION_ID,
          title: "Still here",
          content: "Body",
          isDeleted: false,
          createdAt: 100,
          updatedAt: 100,
        },
      ],
    })
    const remote = snapshot({
      notes: [
        {
          id: "01NOTE",
          divisionId: ROOT_DIVISION_ID,
          title: "Still here",
          content: "Body",
          isDeleted: true,
          createdAt: 100,
          updatedAt: 300,
        },
      ],
    })

    const result = mergeSyncSnapshots(local, remote)

    expect(result.merged.notes[0]?.isDeleted).toBe(true)
    expect(result.merged.noteTags).toEqual([])
  })

  it("includes entities that exist on only one device", () => {
    const local = snapshot({
      notes: [
        {
          id: "01LOCAL",
          divisionId: ROOT_DIVISION_ID,
          title: "Only local",
          content: "",
          isDeleted: false,
          createdAt: 100,
          updatedAt: 100,
        },
      ],
    })
    const remote = snapshot({
      notes: [
        {
          id: "01REMOTE",
          divisionId: ROOT_DIVISION_ID,
          title: "Only remote",
          content: "",
          isDeleted: false,
          createdAt: 100,
          updatedAt: 100,
        },
      ],
    })

    const result = mergeSyncSnapshots(local, remote)

    expect(result.merged.notes.map((note) => note.id).sort()).toEqual(["01LOCAL", "01REMOTE"])
  })

  it("takes note tag links from the winning note revision", () => {
    const tagLocal = {
      id: "01TAGLOCAL",
      divisionId: ROOT_DIVISION_ID,
      name: "local",
      color: "#000000",
      createdAt: 100,
      updatedAt: 100,
    }
    const tagRemote = {
      id: "01TAGREMOTE",
      divisionId: ROOT_DIVISION_ID,
      name: "remote",
      color: "#ffffff",
      createdAt: 100,
      updatedAt: 100,
    }

    const local = snapshot({
      notes: [
        {
          id: "01NOTE",
          divisionId: ROOT_DIVISION_ID,
          title: "Note",
          content: "",
          isDeleted: false,
          createdAt: 100,
          updatedAt: 500,
        },
      ],
      tags: [tagLocal, tagRemote],
      noteTags: [{ noteId: "01NOTE", tagId: "01TAGLOCAL" }],
    })
    const remote = snapshot({
      notes: [
        {
          id: "01NOTE",
          divisionId: ROOT_DIVISION_ID,
          title: "Note",
          content: "edited remotely",
          isDeleted: false,
          createdAt: 100,
          updatedAt: 100,
        },
      ],
      tags: [tagLocal, tagRemote],
      noteTags: [{ noteId: "01NOTE", tagId: "01TAGREMOTE" }],
    })

    const result = mergeSyncSnapshots(local, remote)

    expect(result.merged.notes[0]?.content).toBe("")
    expect(result.merged.noteTags).toEqual([{ noteId: "01NOTE", tagId: "01TAGLOCAL" }])
  })

  it("resolves tag conflicts with last-write-wins", () => {
    const local = snapshot({
      notes: [],
      tags: [
        {
          id: "01TAG",
          divisionId: ROOT_DIVISION_ID,
          name: "dogs",
          color: "#111111",
          createdAt: 100,
          updatedAt: 100,
        },
      ],
    })
    const remote = snapshot({
      notes: [],
      tags: [
        {
          id: "01TAG",
          divisionId: ROOT_DIVISION_ID,
          name: "cats",
          color: "#222222",
          createdAt: 100,
          updatedAt: 250,
        },
      ],
    })

    const result = mergeSyncSnapshots(local, remote)

    expect(result.merged.tags[0]?.name).toBe("cats")
    expect(result.stats.tags.remoteWins).toBe(1)
  })

  it("resolves division rename conflicts with last-write-wins", () => {
    const local = snapshot({
      notes: [],
      divisions: [{ ...rootDivision, name: "Local Brain", updatedAt: 100 }],
    })
    const remote = snapshot({
      notes: [],
      divisions: [{ ...rootDivision, name: "Remote Brain", updatedAt: 250 }],
    })

    const result = mergeSyncSnapshots(local, remote)

    expect(result.merged.divisions[0]?.name).toBe("Remote Brain")
    expect(result.stats.divisions.remoteWins).toBe(1)
  })
})
