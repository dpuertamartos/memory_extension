// @vitest-environment jsdom
import { fireEvent, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderWithI18n } from "../../test/renderWithI18n"
import Omnibox from "./Omnibox"

const mockUpdateSearchFilters = vi.fn()
const mockClearSearchFilters = vi.fn()

vi.mock("../../hooks/useTags", () => ({
  useTags: () => ({
    data: [{ id: "tag-1", name: "ideas", color: "#6366f1" }],
  }),
}))

vi.mock("../../store/useAppStore", () => ({
  useAppStore: () => ({
    searchFilters: {
      keywords: ["memory"],
      tagIds: [],
      dateField: "updated" as const,
      datePreset: null,
      dateFrom: null,
      dateTo: null,
    },
    updateSearchFilters: mockUpdateSearchFilters,
    clearSearchFilters: mockClearSearchFilters,
  }),
}))

describe("Omnibox", () => {
  beforeEach(() => {
    mockUpdateSearchFilters.mockReset()
    mockClearSearchFilters.mockReset()
  })

  it("shows active keyword chips", () => {
    renderWithI18n(<Omnibox />)
    expect(screen.getByText("memory")).toBeInTheDocument()
  })

  it("adds keyword on Enter", () => {
    renderWithI18n(<Omnibox />)
    const input = screen.getAllByRole("textbox", { name: /search notes/i })[0]!
    fireEvent.change(input, { target: { value: "brain" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(mockUpdateSearchFilters).toHaveBeenCalledWith({
      keywords: expect.arrayContaining(["memory", "brain"]),
    })
  })

  it("adds tag filter for #tag input", () => {
    renderWithI18n(<Omnibox />)
    const input = screen.getAllByRole("textbox", { name: /search notes/i })[0]!
    fireEvent.change(input, { target: { value: "#ideas" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(mockUpdateSearchFilters).toHaveBeenCalledWith({
      tagIds: ["tag-1"],
    })
  })
})
