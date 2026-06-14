import { eq, notInArray } from "drizzle-orm"
import {
  divisionsTable,
  noteTagsTable,
  notesTable,
  tagsTable,
  type Division,
  type Note,
  type Tag,
} from "../db/schema"
import { getDivisionAncestors } from "../lib/divisionTree"
import { ROOT_DIVISION_ID } from "../lib/divisions"
import { db, initDb } from "../lib/db"
import { mergeSyncSnapshots } from "./merge"
import type { SyncDivision, SyncMergeResult, SyncNote, SyncSnapshot, SyncTag } from "./types"
import { SYNC_SNAPSHOT_VERSION } from "./types"

function toSyncDivision(division: Division): SyncDivision {
  return {
    id: division.id,
    parentId: division.parentId,
    name: division.name,
    description: division.description,
    isActive: division.isActive,
    sortOrder: division.sortOrder,
    isDeleted: division.isDeleted,
    createdAt: division.createdAt.getTime(),
    updatedAt: division.updatedAt.getTime(),
  }
}

function toSyncNote(note: Note): SyncNote {
  return {
    id: note.id,
    divisionId: note.divisionId,
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
    divisionId: tag.divisionId,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt.getTime(),
    updatedAt: tag.updatedAt.getTime(),
  }
}

function fromSyncDivision(division: SyncDivision) {
  return {
    id: division.id,
    parentId: division.parentId,
    name: division.name,
    description: division.description,
    isActive: division.isActive,
    sortOrder: division.sortOrder,
    isDeleted: division.isDeleted,
    createdAt: new Date(division.createdAt),
    updatedAt: new Date(division.updatedAt),
  }
}

function fromSyncNote(note: SyncNote) {
  return {
    id: note.id,
    divisionId: note.divisionId,
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
    divisionId: tag.divisionId,
    name: tag.name,
    color: tag.color,
    createdAt: new Date(tag.createdAt),
    updatedAt: new Date(tag.updatedAt),
  }
}

export async function exportSyncSnapshot(): Promise<SyncSnapshot> {
  await initDb()

  const [divisions, notes, tags, noteTags] = await Promise.all([
    db.select().from(divisionsTable).where(eq(divisionsTable.isDeleted, false)),
    db.select().from(notesTable),
    db.select().from(tagsTable),
    db.select().from(noteTagsTable),
  ])

  return {
    version: SYNC_SNAPSHOT_VERSION,
    exportedAt: Date.now(),
    divisions: divisions.map(toSyncDivision),
    notes: notes.map(toSyncNote),
    tags: tags.map(toSyncTag),
    noteTags: noteTags.map((link) => ({ noteId: link.noteId, tagId: link.tagId })),
  }
}

export async function applySyncSnapshot(snapshot: SyncSnapshot): Promise<void> {
  await initDb()

  const divisionIds = snapshot.divisions.map((d) => d.id)
  const tagIds = snapshot.tags.map((tag) => tag.id)
  const noteIds = snapshot.notes.map((note) => note.id)

  for (const division of snapshot.divisions) {
    await db
      .insert(divisionsTable)
      .values(fromSyncDivision(division))
      .onConflictDoUpdate({
        target: divisionsTable.id,
        set: {
          parentId: division.parentId,
          name: division.name,
          description: division.description,
          isActive: division.isActive,
          sortOrder: division.sortOrder,
          isDeleted: division.isDeleted,
          updatedAt: new Date(division.updatedAt),
        },
      })
  }

  if (divisionIds.length > 0) {
    await db.delete(divisionsTable).where(notInArray(divisionsTable.id, divisionIds))
  }

  for (const tag of snapshot.tags) {
    const divisionId = divisionIds.includes(tag.divisionId) ? tag.divisionId : ROOT_DIVISION_ID
    await db
      .insert(tagsTable)
      .values(fromSyncTag({ ...tag, divisionId }))
      .onConflictDoUpdate({
        target: tagsTable.id,
        set: {
          divisionId,
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
    const divisionId = divisionIds.includes(note.divisionId) ? note.divisionId : ROOT_DIVISION_ID
    await db
      .insert(notesTable)
      .values(fromSyncNote({ ...note, divisionId }))
      .onConflictDoUpdate({
        target: notesTable.id,
        set: {
          divisionId,
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
    !Array.isArray(parsed.divisions) ||
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

export function buildDivisionPath(divisions: Division[], divisionId: string): string {
  return getDivisionAncestors(divisions, divisionId)
    .map((d) => d.name)
    .join(" / ")
}
