import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { and, asc, count, eq } from "drizzle-orm"
import { ulid } from "ulid"
import { noteTagsTable, notesTable, tagsTable } from "../db/schema"
import { db, initDb } from "../lib/db"

const tagsKey = ["tags"] as const

export function tagNoteCountKey(tagId: string) {
  return ["tags", tagId, "noteCount"] as const
}

export function invalidateTagNoteCounts(queryClient: QueryClient, tagId?: string) {
  if (tagId) {
    void queryClient.invalidateQueries({ queryKey: tagNoteCountKey(tagId) })
    return
  }
  void queryClient.invalidateQueries({
    predicate: (query) => query.queryKey[0] === "tags" && query.queryKey[2] === "noteCount",
  })
}

async function fetchTags() {
  await initDb()
  return db.select().from(tagsTable).orderBy(asc(tagsTable.name))
}

async function fetchTagNoteCount(tagId: string) {
  await initDb()
  const [result] = await db
    .select({ count: count() })
    .from(noteTagsTable)
    .innerJoin(notesTable, eq(noteTagsTable.noteId, notesTable.id))
    .where(and(eq(noteTagsTable.tagId, tagId), eq(notesTable.isDeleted, false)))
  return result?.count ?? 0
}

export function useTags() {
  return useQuery({
    queryKey: tagsKey,
    queryFn: fetchTags,
  })
}

export function useTagNoteCount(tagId: string | null) {
  return useQuery({
    queryKey: tagId ? tagNoteCountKey(tagId) : ["tags", null, "noteCount"],
    queryFn: () => fetchTagNoteCount(tagId!),
    enabled: !!tagId,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; color?: string }) => {
      await initDb()
      const now = new Date()
      const id = ulid()
      await db.insert(tagsTable).values({
        id,
        name: input.name.trim(),
        color: input.color ?? "#6366f1",
        createdAt: now,
        updatedAt: now,
      })

      const [tag] = await db.select().from(tagsTable).where(eq(tagsTable.id, id))
      if (!tag) throw new Error("Failed to create tag")
      return tag
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKey })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await initDb()
      await db.delete(tagsTable).where(eq(tagsTable.id, id))
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: tagsKey })
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      invalidateTagNoteCounts(queryClient, id)
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; name?: string; color?: string }) => {
      await initDb()
      const patch: { name?: string; color?: string; updatedAt: Date } = {
        updatedAt: new Date(),
      }
      if (input.name !== undefined) patch.name = input.name.trim()
      if (input.color !== undefined) patch.color = input.color

      await db.update(tagsTable).set(patch).where(eq(tagsTable.id, input.id))
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: tagsKey })
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      invalidateTagNoteCounts(queryClient, input.id)
    },
  })
}
