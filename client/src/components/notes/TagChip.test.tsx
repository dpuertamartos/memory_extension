// @vitest-environment jsdom
import { fireEvent, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { renderWithI18n } from "../../test/renderWithI18n"
import TagChip from "./TagChip"

const tag = { id: "tag-1", name: "ideas", color: "#6366f1" }

describe("TagChip", () => {
  it("renders tag name with hash by default", () => {
    renderWithI18n(<TagChip tag={tag} />)
    expect(screen.getByText("#ideas")).toBeInTheDocument()
  })

  it("renders without hash when showHash is false", () => {
    renderWithI18n(<TagChip tag={tag} showHash={false} />)
    expect(screen.getByText("ideas")).toBeInTheDocument()
  })

  it("calls onRemove when remove button is clicked", () => {
    const onRemove = vi.fn()
    renderWithI18n(<TagChip tag={tag} onRemove={onRemove} removeLabel="Remove ideas" />)
    fireEvent.click(screen.getByRole("button", { name: "Remove ideas" }))
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it("calls onEdit when edit button is clicked", () => {
    const onEdit = vi.fn()
    renderWithI18n(<TagChip tag={tag} onEdit={onEdit} editLabel="Edit ideas" />)
    fireEvent.click(screen.getByRole("button", { name: "Edit ideas" }))
    expect(onEdit).toHaveBeenCalledOnce()
  })
})
