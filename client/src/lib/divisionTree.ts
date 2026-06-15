import type { Division } from "../db/schema"

export type DivisionTreeNode = Division & {
  children: DivisionTreeNode[]
  depth: number
}

export type CheckboxState = "checked" | "unchecked" | "indeterminate"

export function buildChildrenMap(divisions: Division[]): Map<string | null, Division[]> {
  const byParent = new Map<string | null, Division[]>()

  for (const division of divisions) {
    const parentKey = division.parentId ?? null
    const siblings = byParent.get(parentKey) ?? []
    siblings.push(division)
    byParent.set(parentKey, siblings)
  }

  for (const siblings of byParent.values()) {
    siblings.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  }

  return byParent
}

export function buildDivisionTree(divisions: Division[]): DivisionTreeNode[] {
  const byParent = buildChildrenMap(divisions)

  const build = (parentId: string | null, depth: number): DivisionTreeNode[] => {
    const siblings = byParent.get(parentId) ?? []
    return siblings.map((division) => ({
      ...division,
      depth,
      children: build(division.id, depth + 1),
    }))
  }

  return build(null, 0)
}

export function getDivisionAncestors(
  divisions: Division[],
  divisionId: string,
  maxDepth = 32,
): Division[] {
  const byId = new Map(divisions.map((d) => [d.id, d]))
  const chain: Division[] = []
  let current = byId.get(divisionId)

  for (let i = 0; i < maxDepth && current; i++) {
    chain.unshift(current)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }

  return chain
}

export function getExpandableDivisionIds(
  divisions: Division[],
  childrenMap?: Map<string | null, Division[]>,
): string[] {
  const byParent = childrenMap ?? buildChildrenMap(divisions)
  return divisions.filter((d) => (byParent.get(d.id)?.length ?? 0) > 0).map((d) => d.id)
}

export function getDescendantIds(
  divisions: Division[],
  divisionId: string,
  childrenMap?: Map<string | null, Division[]>,
  maxDepth = 32,
): string[] {
  const byParent = childrenMap ?? buildChildrenMap(divisions)
  const result: string[] = [divisionId]

  const walk = (id: string, depth: number) => {
    if (depth > maxDepth) return
    const children = byParent.get(id) ?? []
    for (const child of children) {
      result.push(child.id)
      walk(child.id, depth + 1)
    }
  }

  walk(divisionId, 0)
  return result
}

/** @deprecated Use getDescendantIds */
export function getDivisionDescendants(
  divisions: Division[],
  divisionId: string,
  maxDepth = 32,
): Division[] {
  const ids = new Set(getDescendantIds(divisions, divisionId, undefined, maxDepth))
  return divisions.filter((d) => ids.has(d.id))
}

/** Default inclusion when focusing a division: self + descendants (not ancestors). */
export function getDefaultIncludedDivisionIds(
  divisions: Division[],
  focusDivisionId: string,
  childrenMap?: Map<string | null, Division[]>,
): string[] {
  return getDescendantIds(divisions, focusDivisionId, childrenMap)
}

export function computeCheckboxState(
  divisionId: string,
  includedIds: ReadonlySet<string>,
  childrenMap: Map<string | null, Division[]>,
): CheckboxState {
  if (includedIds.has(divisionId)) return "checked"

  const hasIncludedDescendant = (id: string): boolean => {
    const children = childrenMap.get(id) ?? []
    for (const child of children) {
      if (includedIds.has(child.id) || hasIncludedDescendant(child.id)) {
        return true
      }
    }
    return false
  }

  return hasIncludedDescendant(divisionId) ? "indeterminate" : "unchecked"
}

export function getAncestorChain(divisions: Division[], id: string): Division[] {
  return getDivisionAncestors(divisions, id)
}
