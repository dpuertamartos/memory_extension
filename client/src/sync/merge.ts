import type {
  SyncConflict,
  SyncMergeResult,
  SyncMergeStats,
  SyncNote,
  SyncNoteTag,
  SyncSnapshot,
} from "./types"
import { SYNC_SNAPSHOT_VERSION } from "./types"

type TimestampedEntity = { id: string; updatedAt: number }

export function pickSyncWinner<T extends TimestampedEntity>(
  local: T,
  remote: T,
): { winner: T; side: "local" | "remote" } {
  if (remote.updatedAt > local.updatedAt) {
    return { winner: remote, side: "remote" }
  }
  if (remote.updatedAt < local.updatedAt) {
    return { winner: local, side: "local" }
  }
  return { winner: remote, side: "remote" }
}

function mergeEntityCollection<T extends TimestampedEntity>(
  local: T[],
  remote: T[],
  entityType: SyncConflict["entityType"],
): {
  merged: T[]
  winners: Record<string, "local" | "remote">
  conflicts: SyncConflict[]
  stats: { localWins: number; remoteWins: number; total: number }
} {
  const localById = new Map(local.map((item) => [item.id, item]))
  const remoteById = new Map(remote.map((item) => [item.id, item]))
  const ids = new Set([...localById.keys(), ...remoteById.keys()])

  const merged: T[] = []
  const winners: Record<string, "local" | "remote"> = {}
  const conflicts: SyncConflict[] = []
  let localWins = 0
  let remoteWins = 0

  for (const id of ids) {
    const localItem = localById.get(id)
    const remoteItem = remoteById.get(id)

    if (localItem && remoteItem) {
      const { winner, side } = pickSyncWinner(localItem, remoteItem)
      merged.push(winner)
      winners[id] = side
      if (side === "local") localWins += 1
      else remoteWins += 1

      if (localItem.updatedAt !== remoteItem.updatedAt) {
        conflicts.push({
          entityType,
          id,
          localUpdatedAt: localItem.updatedAt,
          remoteUpdatedAt: remoteItem.updatedAt,
          winner: side,
        })
      }
      continue
    }

    const sole = localItem ?? remoteItem
    if (!sole) continue

    const side: "local" | "remote" = localItem ? "local" : "remote"
    merged.push(sole)
    winners[id] = side
    if (side === "local") localWins += 1
    else remoteWins += 1
  }

  return {
    merged,
    winners,
    conflicts,
    stats: { localWins, remoteWins, total: merged.length },
  }
}

function mergeNoteTags(
  localNoteTags: SyncNoteTag[],
  remoteNoteTags: SyncNoteTag[],
  noteWinners: Record<string, "local" | "remote">,
  mergedNotes: SyncNote[],
): SyncNoteTag[] {
  const merged = new Map<string, SyncNoteTag>()

  for (const note of mergedNotes) {
    if (note.isDeleted) continue

    const source = noteWinners[note.id] ?? "local"
    const sourceTags = (source === "local" ? localNoteTags : remoteNoteTags).filter(
      (link) => link.noteId === note.id,
    )

    for (const link of sourceTags) {
      merged.set(`${link.noteId}:${link.tagId}`, link)
    }
  }

  return Array.from(merged.values())
}

export function mergeSyncSnapshots(local: SyncSnapshot, remote: SyncSnapshot): SyncMergeResult {
  const divisionMerge = mergeEntityCollection(local.divisions, remote.divisions, "division")
  const noteMerge = mergeEntityCollection(local.notes, remote.notes, "note")
  const tagMerge = mergeEntityCollection(local.tags, remote.tags, "tag")
  const mergedTagIds = new Set(tagMerge.merged.map((tag) => tag.id))
  const mergedDivisionIds = new Set(
    divisionMerge.merged.filter((d) => !d.isDeleted).map((d) => d.id),
  )

  const mergedNoteTags = mergeNoteTags(
    local.noteTags,
    remote.noteTags,
    noteMerge.winners,
    noteMerge.merged,
  ).filter((link) => mergedTagIds.has(link.tagId))

  const exportedAt = Math.max(local.exportedAt, remote.exportedAt)
  const stats: SyncMergeStats = {
    notes: noteMerge.stats,
    tags: tagMerge.stats,
    divisions: divisionMerge.stats,
  }

  const activeNotes = noteMerge.merged.filter((note) => mergedDivisionIds.has(note.divisionId))

  return {
    merged: {
      version: SYNC_SNAPSHOT_VERSION,
      exportedAt,
      divisions: divisionMerge.merged.filter((d) => !d.isDeleted),
      notes: activeNotes,
      tags: tagMerge.merged,
      noteTags: mergedNoteTags,
    },
    noteWinners: noteMerge.winners,
    conflicts: [...divisionMerge.conflicts, ...noteMerge.conflicts, ...tagMerge.conflicts],
    stats,
  }
}
