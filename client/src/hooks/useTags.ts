import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { asc, eq, inArray } from "drizzle-orm"
import { ulid } from "ulid"
import { tagsTable } from "../db/schema"
import { db, initDb } from "../lib/db"
import { inclusionFingerprint, useAppStore } from "../store/useAppStore"
import { useIncludedDivisionIds } from "./useDivisions"

function tagsKey(inclusionKey: string) {
  return ["tags", inclusionKey] as const
}

async function fetchTags(includedDivisionIds: string[]) {
  await initDb()
  if (includedDivisionIds.length === 0) return []

  return db
    .select()
    .from(tagsTable)
    .where(inArray(tagsTable.divisionId, includedDivisionIds))
    .orderBy(asc(tagsTable.name))
}

export function useTags() {
  const includedDivisionIds = useIncludedDivisionIds()
  const inclusionKey = inclusionFingerprint(includedDivisionIds)

  return useQuery({
    queryKey: tagsKey(inclusionKey),
    queryFn: () => fetchTags(includedDivisionIds),
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  const focusDivisionId = useAppStore((s) => s.focusDivisionId)
  const includedDivisionIds = useIncludedDivisionIds()
  const inclusionKey = inclusionFingerprint(includedDivisionIds)

  return useMutation({
    mutationFn: async (input: { name: string; color?: string }) => {
      await initDb()
      const now = new Date()
      const id = ulid()
      await db.insert(tagsTable).values({
        id,
        divisionId: focusDivisionId,
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
      queryClient.invalidateQueries({ queryKey: tagsKey(inclusionKey) })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  const includedDivisionIds = useIncludedDivisionIds()
  const inclusionKey = inclusionFingerprint(includedDivisionIds)

  return useMutation({
    mutationFn: async (id: string) => {
      await initDb()
      await db.delete(tagsTable).where(eq(tagsTable.id, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKey(inclusionKey) })
      queryClient.invalidateQueries({ queryKey: ["notes", inclusionKey] })
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  const includedDivisionIds = useIncludedDivisionIds()
  const inclusionKey = inclusionFingerprint(includedDivisionIds)

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKey(inclusionKey) })
      queryClient.invalidateQueries({ queryKey: ["notes", inclusionKey] })
    },
  })
}
