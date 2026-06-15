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
import { ROOT_DIVISION_ID, ROOT_DIVISION_NAME } from "../lib/divisions"
import { getDescendantIds } from "../lib/divisionTree"
import BrainPage from "../pages/BrainPage"
import AppNav from "../components/notes/AppNav"
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
  name: "Main",
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

function getVisibleDivisionIds(): string[] {
  const state = useAppStore.getState()
  if (!state.subBrainsEnabled) {
    return testState.divisions.filter((d) => !d.isDeleted).map((d) => d.id)
  }
  return getDescendantIds(testState.divisions, state.focusDivisionId)
}

function focusDivisionInTest(id: string) {
  useAppStore.getState().setFocusDivision(id)
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
    useIncludedDivisionIds: () => getVisibleDivisionIds(),
    useFocusDivision: () => ({
      focusDivisionId: useAppStore.getState().focusDivisionId,
      focusDivision: focusDivisionInTest,
    }),
    useBootstrapDivisionState: () => undefined,
    useBootstrapSubBrainsEnabled: () => undefined,
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

      const visibleDivisionIds = getVisibleDivisionIds()
      const keyword = filters.keywords[0]?.toLowerCase()
      const matches = testState.notes.filter((note) => {
        if (!visibleDivisionIds.includes(note.divisionId)) return false
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
    const visible = getVisibleDivisionIds()
    const scoped = testState.notes.filter((note) => visible.includes(note.divisionId))
    const notes = tagId
      ? scoped.filter((note) => note.tags.some((tag) => tag.id === tagId))
      : scoped
    return { data: notes, isLoading: false }
  },
  useNote: (id: string | null) => {
    const visible = getVisibleDivisionIds()
    const note = id
      ? testState.notes.find((item) => item.id === id && visible.includes(item.divisionId))
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
  useMoveNoteDivision: () => ({
    mutateAsync: vi.fn(async ({
      noteId,
      targetDivisionId,
    }: {
      noteId: string
      targetDivisionId: string
    }) => {
      const note = testState.notes.find((item) => item.id === noteId)
      if (!note) return
      note.divisionId = targetDivisionId
      note.updatedAt = new Date()
    }),
    isPending: false,
  }),
}))

describe("user flows (integration)", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: query.includes("min-width: 768px"),
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    })

    testState.notes = []
    testState.tags = []
    testState.divisions = [{ ...rootDivision }]
    testState.nextNoteId = 1
    testState.nextTagId = 1
    testState.nextDivisionId = 1
    resetAppStore()
    useAppStore.getState().setFocusDivision(ROOT_DIVISION_ID)
    useAppStore.getState().setSubBrainsEnabled(true)
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

  it("filters notes by tag from tags tab", async () => {
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

    renderApp(
      <>
        <BrainPage />
        <AppNav />
      </>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Tags" }))
    fireEvent.click(screen.getByRole("button", { name: "ideas" }))

    await waitFor(() => {
      expect(screen.getByText("Filtered")).toBeInTheDocument()
    })
    expect(useAppStore.getState().activePane).toBe("list")
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

  it("shows all notes flat when sub-brains are disabled", async () => {
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
    testState.divisions.push(workDivision)
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
    ]

    focusDivisionInTest("div-work")
    useAppStore.getState().setSubBrainsEnabled(false)
    const { rerender } = renderApp(<BrainPage />)
    rerender(<BrainPage />)

    await waitFor(() => {
      expect(screen.getByText("Personal note")).toBeInTheDocument()
      expect(screen.getByText("Work note")).toBeInTheDocument()
    })
  })

  it("shows sub-brains pane from unified bottom nav", () => {
    useAppStore.getState().setSubBrainsEnabled(true)
    renderApp(
      <>
        <BrainPage />
        <AppNav />
      </>,
    )
    fireEvent.click(screen.getByRole("button", { name: "Sub-brains" }))
    expect(screen.getByText(ROOT_DIVISION_NAME)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: ROOT_DIVISION_NAME })).toBeInTheDocument()
  })

  it("uses unified bottom nav tabs", () => {
    useAppStore.getState().setSubBrainsEnabled(true)
    renderApp(<AppNav />)
    expect(screen.getByRole("button", { name: "Notes" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Calendar" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sub-brains" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tags" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Editor" })).not.toBeInTheDocument()
  })

  it("opens editor from note selection while staying on notes tab", async () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: !query.includes("min-width: 768px"),
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    })

    testState.notes = [
      {
        id: "note-1",
        divisionId: ROOT_DIVISION_ID,
        title: "Context note",
        content: "body",
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      },
    ]

    renderApp(
      <>
        <BrainPage />
        <AppNav />
      </>,
    )

    fireEvent.click(screen.getByText("Context note"))

    await waitFor(() => {
      expect(useAppStore.getState().activePane).toBe("list")
      expect(useAppStore.getState().selectedNoteId).toBe("note-1")
      expect(screen.getByDisplayValue("Context note")).toBeInTheDocument()
    })
    expect(screen.getByRole("navigation").querySelector('[aria-current="page"]')).toHaveAttribute(
      "aria-label",
      "Notes",
    )
  })

  it("shows note ownership in editor when sub-brains enabled", async () => {
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
    testState.divisions.push(workDivision)
    testState.notes = [
      {
        id: "note-work",
        divisionId: "div-work",
        title: "Work note",
        content: "body",
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      },
    ]

    focusDivisionInTest("div-work")
    useAppStore.getState().setSubBrainsEnabled(true)
    useAppStore.getState().setSelectedNoteId("note-work")
    renderApp(<BrainPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue("Work note")).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /Main › Work/i })).toBeInTheDocument()
  })
})
