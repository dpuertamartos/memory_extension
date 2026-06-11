import { describe, expect, it } from "vitest"
import { matchTagTrigger } from "./tagTrigger"

describe("matchTagTrigger", () => {
  it("matches a complete tag name", () => {
    expect(matchTagTrigger("hello #work")).toEqual({ query: "work", length: 5 })
  })

  it("matches a partial tag name", () => {
    expect(matchTagTrigger("hello #wo")).toEqual({ query: "wo", length: 3 })
  })

  it("matches a lone hash", () => {
    expect(matchTagTrigger("hello #")).toEqual({ query: "", length: 1 })
  })

  it("ignores earlier hashes in the same line", () => {
    expect(matchTagTrigger("use #old and #new")).toEqual({ query: "new", length: 4 })
  })

  it("returns null when there is no hash trigger", () => {
    expect(matchTagTrigger("hello world")).toBeNull()
  })

  it("returns null when hash is followed by a space", () => {
    expect(matchTagTrigger("hello # work")).toBeNull()
  })
})
