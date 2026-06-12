import { expect, test } from "@playwright/test"

test.describe("notes", () => {
  test("creates, edits, and deletes a note", async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("text=Local Brain")

    await page.getByRole("button", { name: "New" }).click()
    await page.waitForSelector("text=New note")

    const titleInput = page.getByPlaceholder("Note title")
    await titleInput.fill("E2E Test Note")
    await page.locator(".ProseMirror").fill("Note body content")

    await expect(page.getByText("E2E Test Note")).toBeVisible()

    await page.getByRole("button", { name: "Delete note" }).click()
    await expect(page.getByText("E2E Test Note")).not.toBeVisible()
  })
})
