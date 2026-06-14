// @vitest-environment jsdom
/**
 * Integration tests replacing Playwright E2E for WSL/local dev.
 * Playwright needs a full Chromium install that often fails on WSL; these tests
 * exercise the same user flows in jsdom with mocked persistence.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { forwardRef, useImperativeHandle } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Division, Tag } from "../db/schema"
import type { NoteWithTags } from "../hooks/useNotes"
import type { SearchResult } from "../lib/searchEngine"
import type { SearchFilters } from "../lib/searchQuery"
import { ROOT_DIVISION_ID } from "../lib/divisions"
import { getDescendantIds, getDefaultIncludedDivisionIds } from "../lib/divisionTree"
import BrainPage from "../pages/BrainPage"
import { renderApp } from "../test/renderApp"
import { resetAppStore } from "../test/resetAppStore"
import { useAppStore } from "../store/useAppStore"

const testState = vi.hoisted(() => ({
  notes: [] as NoteWithTags[],
  tags: [] as Tag[],
  divisions: [] as Division[],
  nextNoteId: 1,
  nextTagId: 1,
  nextDivisionId: 1,
}))

const rootDivision = vi.hoisted(() => ({
  id: "01MAINBRAIN00000000000000",
  parentId: null,
  name: "Main Brain",
  description: "",
  isActive: true,
  sortOrder: 0,
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
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

function getIncludedIds(): string[] {
  return useAppStore.getState().includedDivisionIds
}

function focusDivisionInTest(id: string) {
  const cascade = getDescendantIds(testState.divisions, id)
  useAppStore.getState().setFocusDivision(id, cascade)
}

vi.mock("../hooks/useDivisions", async () => {
  const tree = await import("../lib/divisionTree")
  return {
    ...tree,
    useDivisions: () => ({ data: testState.divisions }),
    useAllDivisions: () => ({ data: testState.divisions }),
    useDivisionTree: () => {
      const childrenMap = tree.buildChildrenMap(testState.divisions)
      return {
        tree: tree.buildDivisionTree(testState.divisions),
        divisions: testState.divisions,
        childrenMap,
      }
    },
    useDivisionAncestors: (divisionId: string | null) =>
      divisionId ? tree.getDivisionAncestors(testState.divisions, divisionId) : [],
    useIncludedDivisionIds: () => getIncludedIds(),
    useFocusDivision: () => ({
      focusDivisionId: useAppStore.getState().focusDivisionId,
      focusDivision: focusDivisionInTest,
    }),
    useBootstrapDivisionState: () => undefined,
    useCreateDivision: () => ({
      mutateAsync: vi.fn(async ({ parentId, name }: { parentId: string | null; name: string }) => {
        const division: Division = {
          id: `div-${testState.nextDivisionId++}`,
          parentId,
          name,
          description: "",
          isActive: true,
          sortOrder: testState.divisions.length,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        testState.divisions.push(division)
        return division
      }),
      isPending: false,
    }),
    useUpdateDivision: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeleteDivision: () => ({ mutateAsync: vi.fn(), isPending: false }),
  }
})

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

      const includedDivisionIds = getIncludedIds()
      const keyword = filters.keywords[0]?.toLowerCase()
      const matches = testState.notes.filter((note) => {
        if (!includedDivisionIds.includes(note.divisionId)) return false
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
  useTags: () => {
    const included = getIncludedIds()
    return { data: testState.tags.filter((tag) => included.includes(tag.divisionId)) }
  },
  useCreateTag: () => ({
    mutateAsync: vi.fn(async ({ name, color }: { name: string; color?: string }) => {
      const tag: Tag = {
        id: `tag-${testState.nextTagId++}`,
        divisionId: useAppStore.getState().focusDivisionId,
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
    const included = getIncludedIds()
    const scoped = testState.notes.filter((note) => included.includes(note.divisionId))
    const notes = tagId
      ? scoped.filter((note) => note.tags.some((tag) => tag.id === tagId))
      : scoped
    return { data: notes, isLoading: false }
  },
  useNote: (id: string | null) => {
    const included = getIncludedIds()
    const note = id
      ? testState.notes.find((item) => item.id === id && included.includes(item.divisionId))
      : null
    return { data: note ?? null }
  },
  useCreateNote: () => ({
    mutateAsync: vi.fn(async (input?: { title?: string; content?: string }) => {
      const note: NoteWithTags = {
        id: `note-${testState.nextNoteId++}`,
        divisionId: useAppStore.getState().focusDivisionId,
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
    testState.divisions = [{ ...rootDivision }]
    testState.nextNoteId = 1
    testState.nextTagId = 1
    testState.nextDivisionId = 1
    resetAppStore(testState.divisions)
    useAppStore.getState().setFocusDivision(
      ROOT_DIVISION_ID,
      getDefaultIncludedDivisionIds(testState.divisions, ROOT_DIVISION_ID),
    )
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
        divisionId: ROOT_DIVISION_ID,
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
        divisionId: ROOT_DIVISION_ID,
        name: "ideas",
        color: "#6366f1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    testState.notes = [
      {
        id: "note-1",
        divisionId: ROOT_DIVISION_ID,
        title: "Tagged note",
        content: "body",
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [testState.tags[0]!],
      },
      {
        id: "note-2",
        divisionId: ROOT_DIVISION_ID,
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

  it("scopes notes to explicitly included sub-brains", async () => {
    const workDivision: Division = {
      id: "div-work",
      parentId: ROOT_DIVISION_ID,
      name: "Work",
      description: "",
      isActive: true,
      sortOrder: 1,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const projectDivision: Division = {
      id: "div-project",
      parentId: "div-work",
      name: "Project",
      description: "",
      isActive: true,
      sortOrder: 0,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    testState.divisions.push(workDivision, projectDivision)
    testState.notes = [
      {
        id: "note-root",
        divisionId: ROOT_DIVISION_ID,
        title: "Personal note",
        content: "",
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      },
      {
        id: "note-work",
        divisionId: "div-work",
        title: "Work note",
        content: "",
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      },
      {
        id: "note-project",
        divisionId: "div-project",
        title: "Project note",
        content: "",
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      },
    ]

    focusDivisionInTest(ROOT_DIVISION_ID)
    const { rerender } = renderApp(<BrainPage />)
    expect(screen.getByText("Personal note")).toBeInTheDocument()
    expect(screen.getByText("Work note")).toBeInTheDocument()
    expect(screen.getByText("Project note")).toBeInTheDocument()

    focusDivisionInTest("div-project")
    rerender(<BrainPage />)

    await waitFor(() => {
      expect(useAppStore.getState().focusDivisionId).toBe("div-project")
      expect(screen.getByText("Project note")).toBeInTheDocument()
    })
    expect(screen.queryByText("Work note")).not.toBeInTheDocument()
    expect(screen.queryByText("Personal note")).not.toBeInTheDocument()

    focusDivisionInTest("div-work")
    rerender(<BrainPage />)

    await waitFor(() => {
      expect(useAppStore.getState().focusDivisionId).toBe("div-work")
    })
    expect(screen.getByText("Work note")).toBeInTheDocument()
    expect(screen.getByText("Project note")).toBeInTheDocument()
    expect(screen.queryByText("Personal note")).not.toBeInTheDocument()
  })
})
