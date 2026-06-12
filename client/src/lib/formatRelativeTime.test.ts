import { afterEach, describe, expect, it, vi } from "vitest"
import { formatRelativeTime } from "./formatRelativeTime"

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns empty string for invalid dates", () => {
    expect(formatRelativeTime("not-a-date")).toBe("")
  })

  it("formats recent past in seconds", () => {
    const now = new Date(2026, 5, 11, 12, 0, 0)
    vi.setSystemTime(now)
    const thirtySecondsAgo = new Date(now.getTime() - 30_000)
    expect(formatRelativeTime(thirtySecondsAgo, "en")).toMatch(/second/i)
  })

  it("formats older dates in days", () => {
    const now = new Date(2026, 5, 11, 12, 0, 0)
    vi.setSystemTime(now)
    const threeDaysAgo = new Date(now.getTime() - 3 * 86_400_000)
    expect(formatRelativeTime(threeDaysAgo, "en")).toMatch(/day/i)
  })
})
