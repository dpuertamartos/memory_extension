import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { and, asc, eq, isNull, sql } from "drizzle-orm"
import { useCallback, useEffect, useMemo } from "react"
import { ulid } from "ulid"
import { divisionsTable, notesTable, type Division } from "../db/schema"
import { db, initDb } from "../lib/db"
import {
  buildChildrenMap,
  buildDivisionTree,
  getDefaultIncludedDivisionIds,
  getDescendantIds,
  getDivisionAncestors,
  type DivisionTreeNode,
} from "../lib/divisionTree"
import { getStoredSubBrainsEnabled, ROOT_DIVISION_ID, setStoredSubBrainsEnabled } from "../lib/divisions"
import { useAppStore } from "../store/useAppStore"

export type { DivisionTreeNode }
export {
  buildChildrenMap,
  buildDivisionTree,
  computeCheckboxState,
  getAncestorChain,
  getDefaultIncludedDivisionIds,
  getDescendantIds,
  getDivisionAncestors,
  getDivisionDescendants,
} from "../lib/divisionTree"

const divisionsKey = ["divisions"] as const

async function fetchDivisions(): Promise<Division[]> {
  await initDb()
  return db
    .select()
    .from(divisionsTable)
    .where(eq(divisionsTable.isDeleted, false))
    .orderBy(asc(divisionsTable.sortOrder), asc(divisionsTable.name))
}

export function useDivisions() {
  const showInactive = useAppStore((s) => s.showInactiveDivisions)

  return useQuery({
    queryKey: [...divisionsKey, showInactive],
    queryFn: fetchDivisions,
    select: (divisions) =>
      showInactive ? divisions : divisions.filter((d) => d.isActive),
  })
}

export function useAllDivisions() {
  return useQuery({
    queryKey: [...divisionsKey, "all"],
    queryFn: fetchDivisions,
  })
}

export function useDivisionTree() {
  const { data: divisions = [], ...rest } = useDivisions()

  const childrenMap = useMemo(() => buildChildrenMap(divisions), [divisions])
  const tree = useMemo(() => buildDivisionTree(divisions), [divisions])

  return { tree, divisions, childrenMap, ...rest }
}

export function useDivisionAncestors(divisionId: string | null) {
  const { data: divisions = [] } = useAllDivisions()

  return useMemo(() => {
    if (!divisionId) return []
    return getDivisionAncestors(divisions, divisionId)
  }, [divisions, divisionId])
}

/** Ensure persisted active sub-brain still exists after divisions load. */
export function useBootstrapDivisionState() {
  const focusDivisionId = useAppStore((s) => s.focusDivisionId)
  const setFocusDivision = useAppStore((s) => s.setFocusDivision)
  const { data: divisions = [] } = useAllDivisions()

  useEffect(() => {
    if (divisions.length === 0) return

    const validIds = new Set(divisions.map((d) => d.id))
    if (!validIds.has(focusDivisionId)) {
      setFocusDivision(ROOT_DIVISION_ID)
    }
  }, [divisions, focusDivisionId, setFocusDivision])
}

/** Bootstrap sub-brains enabled: stored value wins; else on if any child division exists. */
export function useBootstrapSubBrainsEnabled() {
  const subBrainsEnabled = useAppStore((s) => s.subBrainsEnabled)
  const setSubBrainsEnabled = useAppStore((s) => s.setSubBrainsEnabled)
  const { data: divisions = [] } = useAllDivisions()

  useEffect(() => {
    if (getStoredSubBrainsEnabled() !== null) return
    if (divisions.length === 0) return

    const hasChildDivisions = divisions.some((d) => !d.isDeleted && d.parentId !== null)
    if (hasChildDivisions !== subBrainsEnabled) {
      setStoredSubBrainsEnabled(hasChildDivisions)
      setSubBrainsEnabled(hasChildDivisions)
    }
  }, [divisions, subBrainsEnabled, setSubBrainsEnabled])
}

export function useFocusDivision() {
  const focusDivisionId = useAppStore((s) => s.focusDivisionId)
  const setFocusDivision = useAppStore((s) => s.setFocusDivision)

  const focusDivision = useCallback((id: string) => setFocusDivision(id), [setFocusDivision])

  return { focusDivisionId, focusDivision }
}

/** Effective ids for note/search queries: active sub-brain + descendants when enabled, all when disabled. */
export function useEffectiveDivisionIds(): string[] {
  const subBrainsEnabled = useAppStore((s) => s.subBrainsEnabled)
  const focusDivisionId = useAppStore((s) => s.focusDivisionId)
  const { data: divisions = [] } = useAllDivisions()

  return useMemo(() => {
    if (!subBrainsEnabled) {
      return divisions.filter((d) => !d.isDeleted).map((d) => d.id)
    }
    if (divisions.length === 0) return [focusDivisionId]
    const childrenMap = buildChildrenMap(divisions)
    return getDescendantIds(divisions, focusDivisionId, childrenMap)
  }, [subBrainsEnabled, focusDivisionId, divisions])
}

/** Division id used when creating new notes/tags. */
export function useCreateDivisionId(): string {
  const subBrainsEnabled = useAppStore((s) => s.subBrainsEnabled)
  const focusDivisionId = useAppStore((s) => s.focusDivisionId)
  return subBrainsEnabled ? focusDivisionId : ROOT_DIVISION_ID
}

export function useIncludedDivisionIds(): string[] {
  return useEffectiveDivisionIds()
}

export function useCreateDivision() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      parentId: string | null
      name: string
      description?: string
    }) => {
      await initDb()
      const now = new Date()
      const id = ulid()

      const siblings = await db
        .select({ sortOrder: divisionsTable.sortOrder })
        .from(divisionsTable)
        .where(
          input.parentId
            ? eq(divisionsTable.parentId, input.parentId)
            : isNull(divisionsTable.parentId),
        )

      const maxSort = siblings.reduce((max, row) => Math.max(max, row.sortOrder), -1)

      await db.insert(divisionsTable).values({
        id,
        parentId: input.parentId,
        name: input.name.trim(),
        description: input.description?.trim() ?? "",
        isActive: true,
        sortOrder: maxSort + 1,
        createdAt: now,
        updatedAt: now,
      })

      const [division] = await db.select().from(divisionsTable).where(eq(divisionsTable.id, id))
      if (!division) throw new Error("Failed to create division")
      return division
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: divisionsKey })
    },
  })
}

export function useUpdateDivision() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      id: string
      name?: string
      description?: string
      isActive?: boolean
      parentId?: string | null
      sortOrder?: number
    }) => {
      await initDb()
      const patch: Partial<typeof divisionsTable.$inferInsert> = {
        updatedAt: new Date(),
      }
      if (input.name !== undefined) patch.name = input.name.trim()
      if (input.description !== undefined) patch.description = input.description.trim()
      if (input.isActive !== undefined) patch.isActive = input.isActive
      if (input.parentId !== undefined) patch.parentId = input.parentId
      if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder

      await db.update(divisionsTable).set(patch).where(eq(divisionsTable.id, input.id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: divisionsKey })
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      queryClient.invalidateQueries({ queryKey: ["tags"] })
    },
  })
}

export function useDeleteDivision() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await initDb()

      const [child] = await db
        .select({ id: divisionsTable.id })
        .from(divisionsTable)
        .where(and(eq(divisionsTable.parentId, id), eq(divisionsTable.isDeleted, false)))
        .limit(1)

      if (child) {
        throw new Error("DIVISION_HAS_CHILDREN")
      }

      const [note] = await db
        .select({ id: notesTable.id })
        .from(notesTable)
        .where(and(eq(notesTable.divisionId, id), eq(notesTable.isDeleted, false)))
        .limit(1)

      if (note) {
        throw new Error("DIVISION_HAS_NOTES")
      }

      await db
        .update(divisionsTable)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(divisionsTable.id, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: divisionsKey })
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      queryClient.invalidateQueries({ queryKey: ["tags"] })
    },
  })
}

export function useDivisionChildCount(parentId: string | null) {
  return useQuery({
    queryKey: [...divisionsKey, "childCount", parentId],
    queryFn: async () => {
      await initDb()
      const rows = await db
        .select({ count: sql<number>`count(*)` })
        .from(divisionsTable)
        .where(
          and(
            eq(divisionsTable.isDeleted, false),
            parentId ? eq(divisionsTable.parentId, parentId) : isNull(divisionsTable.parentId),
          ),
        )
      return Number(rows[0]?.count ?? 0)
    },
  })
}
