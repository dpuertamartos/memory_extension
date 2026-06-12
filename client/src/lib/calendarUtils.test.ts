import { describe, expect, it } from "vitest"
import {
  addDays,
  extractTopKeywords,
  getMonthGridDays,
  getScopeRange,
  getWeekDays,
  isSameDay,
  shiftAnchor,
  toDateKey,
} from "./calendarUtils"

describe("toDateKey", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(toDateKey(new Date(2026, 5, 11))).toBe("2026-06-11")
  })
})

describe("isSameDay", () => {
  it("compares calendar days ignoring time", () => {
    const morning = new Date(2026, 5, 11, 8, 0)
    const evening = new Date(2026, 5, 11, 20, 0)
    expect(isSameDay(morning, evening)).toBe(true)
    expect(isSameDay(morning, addDays(morning, 1))).toBe(false)
  })
})

describe("getScopeRange", () => {
  it("month range covers full calendar month", () => {
    const anchor = new Date(2026, 5, 15)
    const { from, to } = getScopeRange("month", anchor)
    expect(toDateKey(from)).toBe("2026-06-01")
    expect(toDateKey(to)).toBe("2026-06-30")
  })

  it("week range is seven days starting Sunday", () => {
    const anchor = new Date(2026, 5, 11)
    const { from, to } = getScopeRange("week", anchor)
    expect(toDateKey(from)).toBe("2026-06-07")
    expect(toDateKey(to)).toBe("2026-06-13")
  })
})

describe("shiftAnchor", () => {
  it("advances month scope by calendar months", () => {
    const anchor = new Date(2026, 5, 11)
    const next = shiftAnchor("month", anchor, 1)
    expect(next.getMonth()).toBe(6)
  })
})

describe("getMonthGridDays", () => {
  it("returns 42 days for a month grid", () => {
    expect(getMonthGridDays(new Date(2026, 5, 1))).toHaveLength(42)
  })
})

describe("getWeekDays", () => {
  it("returns 7 consecutive days", () => {
    const days = getWeekDays(new Date(2026, 5, 11))
    expect(days).toHaveLength(7)
    expect(isSameDay(days[0], days[6])).toBe(false)
  })
})

describe("extractTopKeywords", () => {
  it("ignores stop words and short tokens", () => {
    const result = extractTopKeywords(["the quick brown fox jumps over the lazy dog"], 3)
    expect(result.map((item) => item.word)).toEqual(["quick", "brown", "fox"])
  })

  it("counts repeated words across texts", () => {
    const result = extractTopKeywords(["memory notes", "more memory here"], 2)
    expect(result[0]).toEqual({ word: "memory", count: 2 })
  })
})
