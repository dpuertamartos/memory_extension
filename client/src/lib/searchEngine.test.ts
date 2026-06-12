import { beforeEach, describe, expect, it, vi } from "vitest"
import { searchNotes } from "./searchEngine"
import { emptySearchFilters } from "./searchQuery"

vi.mock("./db", () => ({
  initDb: vi.fn().mockResolvedValue(undefined),
  runRawQuery: vi.fn(),
}))

import { runRawQuery } from "./db"

const mockRunRawQuery = vi.mocked(runRawQuery)

describe("searchNotes", () => {
  beforeEach(() => {
    mockRunRawQuery.mockReset()
  })

  it("returns empty array when search is inactive", async () => {
    await expect(searchNotes(emptySearchFilters())).resolves.toEqual([])
    expect(mockRunRawQuery).not.toHaveBeenCalled()
  })

  it("returns FTS matches with snippets", async () => {
    mockRunRawQuery.mockImplementation(async (sql: string) => {
      if (sql.includes("notes_fts MATCH") && sql.includes("snippet")) {
        return [
          {
            note_id: "note-1",
            title: "Hello",
            content: "Hello world",
            title_snippet: "<mark>Hello</mark>",
            content_snippet: "<mark>Hello</mark> world",
          },
        ]
      }
      if (sql.includes("notes_fts MATCH")) {
        return [{ note_id: "note-1" }]
      }
      return []
    })

    const results = await searchNotes({
      ...emptySearchFilters(),
      keywords: ["hello"],
    })
    expect(results).toHaveLength(1)
    expect(results[0]?.note_id).toBe("note-1")
    expect(results[0]?.title_snippet).toContain("<mark>")
  })

  it("intersects keyword and tag filters", async () => {
    mockRunRawQuery.mockImplementation(async (sql: string) => {
      if (sql.includes("GROUP BY note_id")) {
        return [{ note_id: "note-1" }]
      }
      if (sql.includes("t.name AS tag_name")) {
        return []
      }
      if (sql.includes("notes_fts MATCH") && sql.includes("snippet")) {
        return [
          {
            note_id: "note-1",
            title: "Hello",
            content: "Hello world",
            title_snippet: "Hello",
            content_snippet: "Hello world",
          },
        ]
      }
      if (sql.includes("notes_fts MATCH")) {
        return [{ note_id: "note-1" }, { note_id: "note-2" }]
      }
      if (sql.includes("t.name AS tag_name")) {
        return []
      }
      return []
    })

    const results = await searchNotes({
      ...emptySearchFilters(),
      keywords: ["hello"],
      tagIds: ["tag-1"],
    })
    expect(results).toHaveLength(1)
    expect(mockRunRawQuery).toHaveBeenCalledWith(
      expect.stringContaining("note_tags"),
      expect.arrayContaining(["tag-1", 1]),
    )
  })
})
