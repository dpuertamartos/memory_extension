// @vitest-environment jsdom
import { fireEvent, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../../lib/db", () => ({
  db: {},
  initDb: vi.fn(),
}))
import { renderWithI18n } from "../../test/renderWithI18n"
import NoteList from "./NoteList"

const mockSetSelectedNoteId = vi.fn()
const mockSetNewlyCreatedNoteId = vi.fn()
const mockSetNoteSort = vi.fn()
const mockCreateNote = vi.fn()

vi.mock("../../hooks/useNotes", () => ({
  useNotes: () => ({
    data: [
      {
        id: "note-1",
        title: "First note",
        content: "Hello",
        createdAt: new Date("2026-06-01"),
        updatedAt: new Date("2026-06-10"),
        isDeleted: false,
        tags: [{ id: "tag-1", name: "ideas", color: "#6366f1" }],
      },
    ],
    isLoading: false,
  }),
  useCreateNote: () => ({
    mutateAsync: mockCreateNote,
    isPending: false,
    error: null,
  }),
}))

vi.mock("../../hooks/useSearch", () => ({
  isSearchActive: () => false,
  useGlobalSearch: () => ({ data: [] }),
}))

vi.mock("../../hooks/useTags", () => ({
  useTags: () => ({ data: [] }),
}))

vi.mock("../../store/useAppStore", () => ({
  useAppStore: () => ({
    selectedTagId: null,
    selectedNoteId: null,
    newlyCreatedNoteId: null,
    searchFilters: {
      keywords: [],
      tagIds: [],
      dateField: "updated",
      datePreset: null,
      dateFrom: null,
      dateTo: null,
    },
    noteSort: "updated",
    setSelectedNoteId: mockSetSelectedNoteId,
    setNewlyCreatedNoteId: mockSetNewlyCreatedNoteId,
    setNoteSort: mockSetNoteSort,
  }),
}))

describe("NoteList", () => {
  beforeEach(() => {
    mockSetSelectedNoteId.mockReset()
    mockCreateNote.mockReset()
  })

  it("renders notes with title and tag", () => {
    renderWithI18n(<NoteList />)
    expect(screen.getByText("First note")).toBeInTheDocument()
    expect(screen.getByText("ideas")).toBeInTheDocument()
  })

  it("selects note on click", () => {
    renderWithI18n(<NoteList />)
    fireEvent.click(screen.getByRole("button", { name: /first note/i }))
    expect(mockSetSelectedNoteId).toHaveBeenCalledWith("note-1")
  })

  it("creates a new note from header button", async () => {
    mockCreateNote.mockResolvedValue({ id: "note-2" })
    renderWithI18n(<NoteList />)
    fireEvent.click(screen.getByRole("button", { name: /^new$/i }))
    expect(mockCreateNote).toHaveBeenCalled()
  })
})
