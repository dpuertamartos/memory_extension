import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { and, desc, eq, inArray } from "drizzle-orm"
import { useCallback, useRef } from "react"
import { ulid } from "ulid"
import { noteTagsTable, notesTable, tagsTable, type Note, type Tag } from "../db/schema"
import { db, initDb } from "../lib/db"

export type NoteWithTags = Note & { tags: Tag[] }

const notesKey = ["notes"] as const
const noteKey = (id: string) => ["notes", id] as const

async function fetchNotes(tagId?: string): Promise<NoteWithTags[]> {
  await initDb()

  const notes = await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.isDeleted, false))
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
    .where(inArray(noteTagsTable.noteId, noteIds))

  const tagsByNote = new Map<string, Tag[]>()
  for (const row of noteTags) {
    const existing = tagsByNote.get(row.noteId) ?? []
    existing.push(row.tag)
    tagsByNote.set(row.noteId, existing)
  }

  const withTags = notes.map((note) => ({
    ...note,
    tags: tagsByNote.get(note.id) ?? [],
  }))

  if (!tagId) return withTags
  return withTags.filter((note) => note.tags.some((tag) => tag.id === tagId))
}

async function fetchNote(id: string): Promise<NoteWithTags | null> {
  await initDb()
  const [note] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, id), eq(notesTable.isDeleted, false)))

  if (!note) return null

  const tags = await db
    .select({ tag: tagsTable })
    .from(noteTagsTable)
    .innerJoin(tagsTable, eq(noteTagsTable.tagId, tagsTable.id))
    .where(eq(noteTagsTable.noteId, id))

  return { ...note, tags: tags.map((row) => row.tag) }
}

export function useNotes(tagId?: string) {
  return useQuery({
    queryKey: tagId ? [...notesKey, tagId] : notesKey,
    queryFn: () => fetchNotes(tagId),
  })
}

export function useNote(id: string | null) {
  return useQuery({
    queryKey: id ? noteKey(id) : ["notes", "none"],
    queryFn: () => (id ? fetchNote(id) : null),
    enabled: Boolean(id),
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input?: { title?: string; content?: string }) => {
      await initDb()
      const now = new Date()
      const id = ulid()

      await db.insert(notesTable).values({
        id,
        title: input?.title ?? "Untitled",
        content: input?.content ?? "",
        createdAt: now,
        updatedAt: now,
      })

      const note = await fetchNote(id)
      if (!note) throw new Error("Failed to create note")
      return note
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKey })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const mutate = useCallback(
    (id: string, patch: Partial<Pick<Note, "title" | "content">>) => {
      const existing = timers.current.get(id)
      if (existing) clearTimeout(existing)

      const timer = setTimeout(async () => {
        timers.current.delete(id)
        await initDb()
        await db
          .update(notesTable)
          .set({ ...patch, updatedAt: new Date() })
          .where(eq(notesTable.id, id))

        queryClient.invalidateQueries({ queryKey: notesKey })
        queryClient.invalidateQueries({ queryKey: noteKey(id) })
      }, 300)

      timers.current.set(id, timer)
    },
    [queryClient],
  )

  return { updateNote: mutate }
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await initDb()
      await db
        .update(notesTable)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(notesTable.id, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKey })
    },
  })
}

export function useSetNoteTags() {
  const queryClient = useQueryClient()

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
      queryClient.invalidateQueries({ queryKey: notesKey })
      queryClient.invalidateQueries({ queryKey: noteKey(variables.noteId) })
    },
  })
}
