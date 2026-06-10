import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { asc, eq } from "drizzle-orm"
import { ulid } from "ulid"
import { tagsTable } from "../db/schema"
import { db, initDb } from "../lib/db"

const tagsKey = ["tags"] as const

async function fetchTags() {
  await initDb()
  return db.select().from(tagsTable).orderBy(asc(tagsTable.name))
}

export function useTags() {
  return useQuery({
    queryKey: tagsKey,
    queryFn: fetchTags,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKey })
      queryClient.invalidateQueries({ queryKey: ["notes"] })
    },
  })
}
