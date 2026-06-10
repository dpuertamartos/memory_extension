export const SYNC_SNAPSHOT_VERSION = 1

export type SyncNote = {
  id: string
  title: string
  content: string
  isDeleted: boolean
  createdAt: number
  updatedAt: number
}

export type SyncTag = {
  id: string
  name: string
  color: string
  createdAt: number
  updatedAt: number
}

export type SyncNoteTag = {
  noteId: string
  tagId: string
}

export type SyncSnapshot = {
  version: typeof SYNC_SNAPSHOT_VERSION
  exportedAt: number
  notes: SyncNote[]
  tags: SyncTag[]
  noteTags: SyncNoteTag[]
}

export type SyncSide = "local" | "remote"

export type SyncConflict = {
  entityType: "note" | "tag"
  id: string
  localUpdatedAt: number
  remoteUpdatedAt: number
  winner: SyncSide
}

export type SyncMergeStats = {
  notes: { localWins: number; remoteWins: number; total: number }
  tags: { localWins: number; remoteWins: number; total: number }
}

export type SyncMergeResult = {
  merged: SyncSnapshot
  noteWinners: Record<string, SyncSide>
  conflicts: SyncConflict[]
  stats: SyncMergeStats
}
