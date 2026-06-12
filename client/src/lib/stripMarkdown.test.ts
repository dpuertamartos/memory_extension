import { describe, expect, it } from "vitest"
import { stripMarkdown } from "./stripMarkdown"

describe("stripMarkdown", () => {
  it("removes headings and emphasis", () => {
    expect(stripMarkdown("## Hello **world**")).toBe("Hello world")
  })

  it("removes fenced code blocks", () => {
    expect(stripMarkdown("before ```code``` after")).toBe("before   after")
  })

  it("removes links and images", () => {
    expect(stripMarkdown("![alt](img.png) [link](https://x.test)")).toBe("")
  })

  it("collapses whitespace", () => {
    expect(stripMarkdown("line one\n\nline two")).toBe("line one line two")
  })
})
