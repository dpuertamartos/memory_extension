// @vitest-environment jsdom
/**
 * Integration tests replacing Playwright E2E for WSL/local dev.
 * Playwright needs a full Chromium install that often fails on WSL; these tests
 * exercise the same user flows in jsdom with mocked persistence.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { forwardRef, useImperativeHandle } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Tag } from "../db/schema"
import type { NoteWithTags } from "../hooks/useNotes"
import type { SearchResult } from "../lib/searchEngine"
import type { SearchFilters } from "../lib/searchQuery"
import BrainPage from "../pages/BrainPage"
import { renderApp } from "../test/renderApp"
import { resetAppStore } from "../test/resetAppStore"
import { useAppStore } from "../store/useAppStore"

const testState = vi.hoisted(() => ({
  notes: [] as NoteWithTags[],
  tags: [] as Tag[],
  nextNoteId: 1,
  nextTagId: 1,
}))

vi.mock("../lib/db", () => ({
  initDb: vi.fn().mockResolvedValue(undefined),
  db: {},
}))

vi.mock("../components/notes/MarkdownEditor", () => ({
  default: forwardRef<
    { removeTagTrigger: () => void },
    {
      content: string
      onChange: (value: string) => void
      onTagTrigger?: (query: string, anchor: { top: number; left: number }) => void
    }
  >(({ content, onChange, onTagTrigger }, ref) => {
    useImperativeHandle(ref, () => ({ removeTagTrigger: () => undefined }))
    return (
      <textarea
        data-testid="markdown-editor"
        aria-label="Write"
        value={content}
        onChange={(event) => {
          const value = event.target.value
          onChange(value)
          const match = value.match(/#([a-zA-Z0-9_-]*)$/)
          if (match) {
            onTagTrigger?.(match[1] ?? "", { top: 0, left: 0 })
          }
        }}
      />
    )
  }),
}))

vi.mock("../hooks/useCalendarNotes", () => ({
  useCalendarNotes: () => ({
    isLoading: false,
    activityByDay: new Map(),
    selectedDayNotes: [],
    scopeTopTags: [],
    scopeTopKeywords: [],
  }),
}))

vi.mock("../hooks/useSearch", async (importOriginal) => {
  const original = await importOriginal<typeof import("../hooks/useSearch")>()
  return {
    ...original,
    useGlobalSearch: (filters: SearchFilters) => {
      const active =
        filters.keywords.length > 0 ||
        filters.tagIds.length > 0 ||
        filters.datePreset !== null ||
        filters.dateFrom !== null ||
        filters.dateTo !== null

      if (!active) return { data: [] as SearchResult[] }

      const keyword = filters.keywords[0]?.toLowerCase()
      const matches = testState.notes.filter((note) => {
        const keywordMatch =
          !keyword ||
          note.title.toLowerCase().includes(keyword) ||
          note.content.toLowerCase().includes(keyword)
        const tagMatch =
          filters.tagIds.length === 0 ||
          note.tags.some((tag) => filters.tagIds.includes(tag.id))
        return keywordMatch && tagMatch
      })

      return {
        data: matches.map((note) => ({
          note_id: note.id,
          title: note.title,
          content: note.content,
          title_snippet: note.title,
          content_snippet: note.content.slice(0, 120),
        })),
      }
    },
  }
})

vi.mock("../hooks/useTags", () => ({
  useTags: () => ({ data: testState.tags }),
  useCreateTag: () => ({
    mutateAsync: vi.fn(async ({ name, color }: { name: string; color?: string }) => {
      const tag: Tag = {
        id: `tag-${testState.nextTagId++}`,
        name,
        color: color ?? "#6366f1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      testState.tags.push(tag)
      return tag
    }),
    isPending: false,
  }),
  useUpdateTag: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteTag: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock("../hooks/useNotes", () => ({
  useNotes: (tagId?: string) => {
    const notes = tagId
      ? testState.notes.filter((note) => note.tags.some((tag) => tag.id === tagId))
      : testState.notes
    return { data: notes, isLoading: false }
  },
  useNote: (id: string | null) => {
    const note = id ? testState.notes.find((item) => item.id === id) : null
    return { data: note ?? null }
  },
  useCreateNote: () => ({
    mutateAsync: vi.fn(async (input?: { title?: string; content?: string }) => {
      const note: NoteWithTags = {
        id: `note-${testState.nextNoteId++}`,
        title: input?.title ?? "Untitled",
        content: input?.content ?? "",
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      }
      testState.notes.unshift(note)
      return note
    }),
    isPending: false,
    error: null,
  }),
  useUpdateNote: () => ({
    updateNote: vi.fn((id: string, patch: Partial<Pick<NoteWithTags, "title" | "content">>) => {
      const note = testState.notes.find((item) => item.id === id)
      if (!note) return
      Object.assign(note, patch, { updatedAt: new Date() })
    }),
    saveStatus: "idle" as const,
  }),
  useDeleteNote: () => ({
    mutateAsync: vi.fn(async (id: string) => {
      testState.notes = testState.notes.filter((note) => note.id !== id)
    }),
    isPending: false,
  }),
  useSetNoteTags: () => ({
    mutateAsync: vi.fn(async ({ noteId, tagIds }: { noteId: string; tagIds: string[] }) => {
      const note = testState.notes.find((item) => item.id === noteId)
      if (!note) return
      note.tags = testState.tags.filter((tag) => tagIds.includes(tag.id))
      note.updatedAt = new Date()
    }),
    isPending: false,
  }),
}))

describe("user flows (integration)", () => {
  beforeEach(() => {
    testState.notes = []
    testState.tags = []
    testState.nextNoteId = 1
    testState.nextTagId = 1
    resetAppStore()
  })

  afterEach(() => {
    resetAppStore()
  })

  it("creates, edits, and deletes a note", async () => {
    renderApp(<BrainPage />)

    fireEvent.click(screen.getByRole("button", { name: /^new$/i }))
    await screen.findByText("New note")

    fireEvent.change(screen.getByPlaceholderText("Note title"), {
      target: { value: "Integration Test Note" },
    })
    fireEvent.change(screen.getByTestId("markdown-editor"), {
      target: { value: "Note body content" },
    })

    expect(screen.getByPlaceholderText("Note title")).toHaveValue("Integration Test Note")
    expect(testState.notes[0]?.title).toBe("Integration Test Note")

    fireEvent.click(screen.getByRole("button", { name: "Delete note" }))

    await waitFor(() => {
      expect(testState.notes).toHaveLength(0)
      expect(screen.queryByPlaceholderText("Note title")).not.toBeInTheDocument()
    })
  })

  it("creates a tag and assigns it via editor # trigger", async () => {
    renderApp(<BrainPage />)

    fireEvent.click(screen.getByRole("button", { name: /^new$/i }))
    await screen.findByText("New note")

    fireEvent.change(screen.getByTestId("markdown-editor"), {
      target: { value: "Tagged content #flowtag" },
    })

    fireEvent.click(screen.getByRole("button", { name: 'Create "flowtag"' }))

    await waitFor(() => {
      expect(screen.getByText("#flowtag")).toBeInTheDocument()
    })
  })

  it("finds notes via omnibox keyword", async () => {
    testState.notes = [
      {
        id: "note-1",
        title: "Searchable Alpha Note",
        content: "unique searchable phrase xyz",
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      },
    ]

    renderApp(<BrainPage />)

    const searchInput = screen.getByRole("textbox", { name: "Search notes" })
    fireEvent.change(searchInput, { target: { value: "searchable" } })
    fireEvent.keyDown(searchInput, { key: "Enter" })

    await waitFor(() => {
      expect(screen.getByText("Results")).toBeInTheDocument()
    })
    expect(screen.getByText("searchable")).toBeInTheDocument()
    expect(screen.getByText("Searchable Alpha Note")).toBeInTheDocument()
  })

  it("filters notes by tag selected in the sidebar", async () => {
    testState.tags = [
      {
        id: "tag-1",
        name: "ideas",
        color: "#6366f1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    testState.notes = [
      {
        id: "note-1",
        title: "Tagged note",
        content: "body",
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [testState.tags[0]!],
      },
      {
        id: "note-2",
        title: "Other note",
        content: "body",
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      },
    ]

    renderApp(<BrainPage />)

    fireEvent.click(screen.getByRole("button", { name: "ideas" }))

    await waitFor(() => {
      expect(screen.getByText("Filtered")).toBeInTheDocument()
    })
    expect(screen.getByText("Tagged note")).toBeInTheDocument()
    expect(screen.queryByText("Other note")).not.toBeInTheDocument()
    expect(useAppStore.getState().selectedTagId).toBe("tag-1")
  })
})
