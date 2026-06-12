import { expect, test } from "@playwright/test"

test.describe("search", () => {
  test("finds notes via omnibox keyword", async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("text=Local Brain")

    await page.getByRole("button", { name: "New" }).click()
    await page.waitForSelector("text=New note")

    const titleInput = page.getByPlaceholder("Note title")
    await titleInput.fill("Searchable Alpha Note")
    await page.locator(".ProseMirror").fill("unique searchable phrase xyz")

    const searchInput = page.getByRole("textbox", { name: "Search notes" })
    await searchInput.fill("searchable")
    await searchInput.press("Enter")

    await expect(page.getByText("searchable")).toBeVisible()
    await expect(page.getByText("Searchable Alpha Note")).toBeVisible()
  })
})
