import { describe, expect, it } from "vitest"
import {
  buildDivisionTree,
  buildChildrenMap,
  computeCheckboxState,
  getDefaultIncludedDivisionIds,
  getDescendantIds,
  getDivisionAncestors,
} from "../lib/divisionTree"
import { ROOT_DIVISION_ID } from "../lib/divisions"
import type { Division } from "../db/schema"

const now = new Date()

function division(
  partial: Partial<Division> & Pick<Division, "id" | "name" | "parentId">,
): Division {
  return {
    description: "",
    isActive: true,
    sortOrder: 0,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}

describe("buildDivisionTree", () => {
  it("nests children under parents", () => {
    const root = division({ id: ROOT_DIVISION_ID, name: "Main Brain", parentId: null })
    const child = division({ id: "child-1", name: "Work", parentId: ROOT_DIVISION_ID })

    const tree = buildDivisionTree([root, child])

    expect(tree).toHaveLength(1)
    expect(tree[0]?.children).toHaveLength(1)
    expect(tree[0]?.children[0]?.name).toBe("Work")
    expect(tree[0]?.children[0]?.depth).toBe(1)
  })
})

describe("getDivisionAncestors", () => {
  it("returns the breadcrumb chain from root to target", () => {
    const root = division({ id: ROOT_DIVISION_ID, name: "Main Brain", parentId: null })
    const mid = division({ id: "mid", name: "Red", parentId: ROOT_DIVISION_ID })
    const leaf = division({ id: "leaf", name: "Football", parentId: "mid" })

    expect(getDivisionAncestors([root, mid, leaf], "leaf").map((d) => d.name)).toEqual([
      "Main Brain",
      "Red",
      "Football",
    ])
  })
})

describe("explicit inclusion helpers", () => {
  const root = division({ id: ROOT_DIVISION_ID, name: "Main Brain", parentId: null })
  const football = division({ id: "football", name: "Football", parentId: ROOT_DIVISION_ID })
  const basketball = division({ id: "basketball", name: "Basketball", parentId: ROOT_DIVISION_ID })
  const realMadrid = division({ id: "madrid", name: "Real Madrid", parentId: "football" })
  const barcelona = division({ id: "barcelona", name: "Barcelona", parentId: "football" })
  const divisions = [root, football, basketball, realMadrid, barcelona]
  const childrenMap = buildChildrenMap(divisions)

  it("default focus on Football excludes Main Brain", () => {
    expect(getDefaultIncludedDivisionIds(divisions, "football", childrenMap).sort()).toEqual(
      ["football", "madrid", "barcelona"].sort(),
    )
  })

  it("default focus on root includes full tree", () => {
    expect(getDefaultIncludedDivisionIds(divisions, ROOT_DIVISION_ID, childrenMap).sort()).toEqual(
      [ROOT_DIVISION_ID, "football", "basketball", "madrid", "barcelona"].sort(),
    )
  })

  it("checking Football cascades to descendants", () => {
    const included = new Set(getDescendantIds(divisions, "football", childrenMap))
    expect(included.has("football")).toBe(true)
    expect(included.has("madrid")).toBe(true)
    expect(included.has("barcelona")).toBe(true)
    expect(included.has(ROOT_DIVISION_ID)).toBe(false)
  })

  it("unchecking Barcelona removes only Barcelona from inclusion set", () => {
    const included = new Set(getDescendantIds(divisions, "football", childrenMap))
    included.delete("barcelona")
    expect([...included].sort()).toEqual(["football", "madrid"].sort())
  })

  it("child-only inclusion makes parent indeterminate", () => {
    const included = new Set(["barcelona"])
    expect(computeCheckboxState("football", included, childrenMap)).toBe("indeterminate")
    expect(computeCheckboxState("barcelona", included, childrenMap)).toBe("checked")
    expect(computeCheckboxState(ROOT_DIVISION_ID, included, childrenMap)).toBe("indeterminate")
  })
})
