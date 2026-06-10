import { notInArray } from "drizzle-orm"
import { noteTagsTable, notesTable, tagsTable, type Note, type Tag } from "../db/schema"
import { db, initDb } from "../lib/db"
import { mergeSyncSnapshots } from "./merge"
import type { SyncMergeResult, SyncNote, SyncSnapshot, SyncTag } from "./types"
import { SYNC_SNAPSHOT_VERSION } from "./types"

function toSyncNote(note: Note): SyncNote {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    isDeleted: note.isDeleted,
    createdAt: note.createdAt.getTime(),
    updatedAt: note.updatedAt.getTime(),
  }
}

function toSyncTag(tag: Tag): SyncTag {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt.getTime(),
    updatedAt: tag.updatedAt.getTime(),
  }
}

function fromSyncNote(note: SyncNote) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    isDeleted: note.isDeleted,
    createdAt: new Date(note.createdAt),
    updatedAt: new Date(note.updatedAt),
  }
}

function fromSyncTag(tag: SyncTag) {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    createdAt: new Date(tag.createdAt),
    updatedAt: new Date(tag.updatedAt),
  }
}

export async function exportSyncSnapshot(): Promise<SyncSnapshot> {
  await initDb()

  const [notes, tags, noteTags] = await Promise.all([
    db.select().from(notesTable),
    db.select().from(tagsTable),
    db.select().from(noteTagsTable),
  ])

  return {
    version: SYNC_SNAPSHOT_VERSION,
    exportedAt: Date.now(),
    notes: notes.map(toSyncNote),
    tags: tags.map(toSyncTag),
    noteTags: noteTags.map((link) => ({ noteId: link.noteId, tagId: link.tagId })),
  }
}

export async function applySyncSnapshot(snapshot: SyncSnapshot): Promise<void> {
  await initDb()

  const tagIds = snapshot.tags.map((tag) => tag.id)
  const noteIds = snapshot.notes.map((note) => note.id)

  for (const tag of snapshot.tags) {
    await db
      .insert(tagsTable)
      .values(fromSyncTag(tag))
      .onConflictDoUpdate({
        target: tagsTable.id,
        set: {
          name: tag.name,
          color: tag.color,
          updatedAt: new Date(tag.updatedAt),
        },
      })
  }

  if (tagIds.length > 0) {
    await db.delete(tagsTable).where(notInArray(tagsTable.id, tagIds))
  } else {
    await db.delete(tagsTable)
  }

  for (const note of snapshot.notes) {
    await db
      .insert(notesTable)
      .values(fromSyncNote(note))
      .onConflictDoUpdate({
        target: notesTable.id,
        set: {
          title: note.title,
          content: note.content,
          isDeleted: note.isDeleted,
          updatedAt: new Date(note.updatedAt),
        },
      })
  }

  if (noteIds.length > 0) {
    await db.delete(notesTable).where(notInArray(notesTable.id, noteIds))
  } else {
    await db.delete(notesTable)
  }

  await db.delete(noteTagsTable)
  if (snapshot.noteTags.length > 0) {
    await db.insert(noteTagsTable).values(snapshot.noteTags)
  }
}

export async function mergeAndApplyRemoteSnapshot(remote: SyncSnapshot): Promise<SyncMergeResult> {
  const local = await exportSyncSnapshot()
  const result = mergeSyncSnapshots(local, remote)
  await applySyncSnapshot(result.merged)
  return result
}

export function parseSyncSnapshotJson(raw: string): SyncSnapshot {
  const parsed = JSON.parse(raw) as Partial<SyncSnapshot>

  if (parsed.version !== SYNC_SNAPSHOT_VERSION) {
    throw new Error(`Unsupported sync snapshot version: ${String(parsed.version)}`)
  }
  if (
    typeof parsed.exportedAt !== "number" ||
    !Array.isArray(parsed.notes) ||
    !Array.isArray(parsed.tags) ||
    !Array.isArray(parsed.noteTags)
  ) {
    throw new Error("Invalid sync snapshot payload")
  }

  return parsed as SyncSnapshot
}

export function serializeSyncSnapshot(snapshot: SyncSnapshot): string {
  return JSON.stringify(snapshot, null, 2)
}
