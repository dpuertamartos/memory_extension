import { expect, test } from "@playwright/test"

test.describe("tags", () => {
  test("creates a tag and assigns it via editor trigger", async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector("text=Local Brain")

    await page.getByRole("button", { name: "New" }).click()
    await page.waitForSelector("text=New note")

    const editor = page.locator(".ProseMirror")
    await editor.click()
    await editor.pressSequentially("Tagged content #e2etag")

    await page.getByRole("button", { name: 'Create "e2etag"' }).click()

    await expect(page.locator(".rounded-full", { hasText: "#e2etag" })).toBeVisible()
  })
})
