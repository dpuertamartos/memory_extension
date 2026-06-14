import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { and, desc, eq, inArray } from "drizzle-orm"
import { useCallback, useRef, useState } from "react"
import { ulid } from "ulid"
import { noteTagsTable, notesTable, tagsTable, type Note, type Tag } from "../db/schema"
import { db, initDb } from "../lib/db"
import { inclusionFingerprint, useAppStore } from "../store/useAppStore"
import { useIncludedDivisionIds } from "./useDivisions"

export type NoteWithTags = Note & { tags: Tag[] }

function chunkIds(ids: string[], size = 500): string[][] {
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size))
  }
  return chunks
}

function notesKey(inclusionKey: string, tagId?: string) {
  return tagId
    ? (["notes", inclusionKey, tagId] as const)
    : (["notes", inclusionKey] as const)
}

const noteKey = (id: string) => ["notes", "detail", id] as const

async function fetchNotesForChunk(
  divisionIds: string[],
  tagId?: string,
): Promise<NoteWithTags[]> {
  const baseWhere = and(
    eq(notesTable.isDeleted, false),
    inArray(notesTable.divisionId, divisionIds),
  )

  const notes = tagId
    ? await db
        .select({ note: notesTable })
        .from(notesTable)
        .innerJoin(noteTagsTable, eq(noteTagsTable.noteId, notesTable.id))
        .where(and(baseWhere, eq(noteTagsTable.tagId, tagId)))
        .orderBy(desc(notesTable.updatedAt))
        .then((rows) => rows.map((row) => row.note))
    : await db
        .select()
        .from(notesTable)
        .where(baseWhere)
        .orderBy(desc(notesTable.updatedAt))

  if (notes.length === 0) return []

  const noteIds = notes.map((note) => note.id)
  const noteTags = await db
    .select({
      noteId: noteTagsTable.noteId,
      tag: tagsTable,
    })
    .from(noteTagsTable)
    .innerJoin(tagsTable, eq(noteTagsTable.tagId, tagsTable.id))
    .where(
      and(inArray(noteTagsTable.noteId, noteIds), inArray(tagsTable.divisionId, divisionIds)),
    )

  const tagsByNote = new Map<string, Tag[]>()
  for (const row of noteTags) {
    const existing = tagsByNote.get(row.noteId) ?? []
    existing.push(row.tag)
    tagsByNote.set(row.noteId, existing)
  }

  return notes.map((note) => ({
    ...note,
    tags: tagsByNote.get(note.id) ?? [],
  }))
}

async function fetchNotes(includedDivisionIds: string[], tagId?: string): Promise<NoteWithTags[]> {
  await initDb()
  if (includedDivisionIds.length === 0) return []

  const chunks = chunkIds(includedDivisionIds)
  const results = await Promise.all(chunks.map((chunk) => fetchNotesForChunk(chunk, tagId)))

  const byId = new Map<string, NoteWithTags>()
  for (const batch of results) {
    for (const note of batch) {
      const existing = byId.get(note.id)
      if (!existing || note.updatedAt > existing.updatedAt) {
        byId.set(note.id, note)
      }
    }
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

async function fetchNote(id: string, includedDivisionIds: string[]): Promise<NoteWithTags | null> {
  await initDb()
  if (includedDivisionIds.length === 0) return null

  const [note] = await db
    .select()
    .from(notesTable)
    .where(
      and(
        eq(notesTable.id, id),
        eq(notesTable.isDeleted, false),
        inArray(notesTable.divisionId, includedDivisionIds),
      ),
    )

  if (!note) return null

  const tags = await db
    .select({ tag: tagsTable })
    .from(noteTagsTable)
    .innerJoin(tagsTable, eq(noteTagsTable.tagId, tagsTable.id))
    .where(and(eq(noteTagsTable.noteId, id), inArray(tagsTable.divisionId, includedDivisionIds)))

  return { ...note, tags: tags.map((row) => row.tag) }
}

export function useNotes(tagId?: string) {
  const focusDivisionId = useAppStore((s) => s.focusDivisionId)
  const includedDivisionIds = useIncludedDivisionIds()
  const inclusionKey = inclusionFingerprint(includedDivisionIds)

  return useQuery({
    queryKey: notesKey(inclusionKey, tagId),
    queryFn: () => fetchNotes(includedDivisionIds, tagId),
    meta: { focusDivisionId },
  })
}

export function useNote(id: string | null) {
  const includedDivisionIds = useIncludedDivisionIds()
  const inclusionKey = inclusionFingerprint(includedDivisionIds)

  return useQuery({
    queryKey: id ? [...noteKey(id), inclusionKey] : ["notes", "none"],
    queryFn: () => (id ? fetchNote(id, includedDivisionIds) : null),
    enabled: Boolean(id),
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  const focusDivisionId = useAppStore((s) => s.focusDivisionId)
  const includedDivisionIds = useIncludedDivisionIds()
  const inclusionKey = inclusionFingerprint(includedDivisionIds)

  return useMutation({
    mutationFn: async (input?: { title?: string; content?: string }) => {
      await initDb()
      const now = new Date()
      const id = ulid()

      await db.insert(notesTable).values({
        id,
        divisionId: focusDivisionId,
        title: input?.title ?? "Untitled",
        content: input?.content ?? "",
        createdAt: now,
        updatedAt: now,
      })

      const note = await fetchNote(id, [focusDivisionId])
      if (!note) throw new Error("Failed to create note")
      return note
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", inclusionKey] })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  const includedDivisionIds = useIncludedDivisionIds()
  const inclusionKey = inclusionFingerprint(includedDivisionIds)
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const saveGeneration = useRef(0)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")

  const mutate = useCallback(
    (id: string, patch: Partial<Pick<Note, "title" | "content">>) => {
      const existing = timers.current.get(id)
      if (existing) clearTimeout(existing)

      const generation = ++saveGeneration.current
      setSaveStatus("saving")
      if (savedTimer.current) clearTimeout(savedTimer.current)

      const timer = setTimeout(async () => {
        timers.current.delete(id)
        try {
          await initDb()
          await db
            .update(notesTable)
            .set({ ...patch, updatedAt: new Date() })
            .where(eq(notesTable.id, id))

          queryClient.invalidateQueries({ queryKey: ["notes", inclusionKey] })
          queryClient.invalidateQueries({ queryKey: noteKey(id) })

          if (generation === saveGeneration.current) {
            setSaveStatus("saved")
            savedTimer.current = setTimeout(() => {
              if (generation === saveGeneration.current) setSaveStatus("idle")
            }, 2000)
          }
        } catch {
          if (generation === saveGeneration.current) setSaveStatus("idle")
        }
      }, 300)

      timers.current.set(id, timer)
    },
    [queryClient, inclusionKey],
  )

  return { updateNote: mutate, saveStatus }
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  const includedDivisionIds = useIncludedDivisionIds()
  const inclusionKey = inclusionFingerprint(includedDivisionIds)

  return useMutation({
    mutationFn: async (id: string) => {
      await initDb()
      await db
        .update(notesTable)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(notesTable.id, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", inclusionKey] })
    },
  })
}

export function useSetNoteTags() {
  const queryClient = useQueryClient()
  const includedDivisionIds = useIncludedDivisionIds()
  const inclusionKey = inclusionFingerprint(includedDivisionIds)

  return useMutation({
    mutationFn: async ({ noteId, tagIds }: { noteId: string; tagIds: string[] }) => {
      await initDb()
      await db.delete(noteTagsTable).where(eq(noteTagsTable.noteId, noteId))

      if (tagIds.length > 0) {
        await db.insert(noteTagsTable).values(tagIds.map((tagId) => ({ noteId, tagId })))
      }

      await db.update(notesTable).set({ updatedAt: new Date() }).where(eq(notesTable.id, noteId))
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes", inclusionKey] })
      queryClient.invalidateQueries({ queryKey: noteKey(variables.noteId) })
    },
  })
}
