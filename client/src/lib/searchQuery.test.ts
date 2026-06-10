import { describe, expect, it, vi } from "vitest"
import { buildFtsMatchQuery, getEffectiveDateRange, resolveDateRange } from "./searchQuery"

describe("buildFtsMatchQuery", () => {
  it("returns null for empty input", () => {
    expect(buildFtsMatchQuery([])).toBeNull()
    expect(buildFtsMatchQuery(["", "  "])).toBeNull()
  })

  it("builds a single prefix term", () => {
    expect(buildFtsMatchQuery(["hello"])).toBe('"hello"*')
  })

  it("combines multiple words with AND", () => {
    expect(buildFtsMatchQuery(["hello", "world"])).toBe('"hello"* AND "world"*')
  })

  it("escapes double quotes in terms", () => {
    expect(buildFtsMatchQuery(['say "hi"'])).toBe('"say ""hi"""*')
  })
})

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

describe("resolveDateRange", () => {
  it("last_week spans seven days ending today", () => {
    const now = new Date(2026, 5, 11, 15, 0, 0)
    vi.setSystemTime(now)
    const { from, to } = resolveDateRange("last_week")
    expect(localDateKey(from)).toBe("2026-06-04")
    expect(to.getHours()).toBe(23)
    vi.useRealTimers()
  })
})

describe("getEffectiveDateRange", () => {
  it("prefers explicit from/to over preset", () => {
    const from = new Date(2026, 4, 1)
    const to = new Date(2026, 4, 31)
    const range = getEffectiveDateRange({
      keywords: [],
      tagIds: [],
      dateField: "created",
      datePreset: "last_week",
      dateFrom: from,
      dateTo: to,
    })
    expect(localDateKey(range!.from)).toBe("2026-05-01")
    expect(localDateKey(range!.to)).toBe("2026-05-31")
  })
})
