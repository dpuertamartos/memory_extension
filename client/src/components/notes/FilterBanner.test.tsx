// @vitest-environment jsdom
import { fireEvent, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderWithI18n } from "../../test/renderWithI18n"
import FilterBanner from "./FilterBanner"

const mockSetSelectedTagId = vi.fn()

vi.mock("../../hooks/useTags", () => ({
  useTags: () => ({
    data: [{ id: "tag-1", name: "ideas", color: "#6366f1" }],
  }),
}))

vi.mock("../../store/useAppStore", () => ({
  useAppStore: () => ({
    selectedTagId: "tag-1",
    setSelectedTagId: mockSetSelectedTagId,
  }),
}))

describe("FilterBanner", () => {
  beforeEach(() => {
    mockSetSelectedTagId.mockReset()
  })

  it("shows active tag filter and note count", () => {
    renderWithI18n(<FilterBanner noteCount={3} />)
    expect(screen.getByText("Filtered by")).toBeInTheDocument()
    expect(screen.getByText("#ideas")).toBeInTheDocument()
    expect(screen.getByText("note")).toBeInTheDocument()
  })

  it("clears tag filter on button click", () => {
    renderWithI18n(<FilterBanner noteCount={1} />)
    fireEvent.click(screen.getAllByRole("button", { name: /clear tag filter/i })[0]!)
    expect(mockSetSelectedTagId).toHaveBeenCalledWith(null)
  })
})
