import { test } from "@playwright/test"

test.setTimeout(15000)

test("loads Local Brain home", async ({ page }) => {
  await page.goto("/")
  await page.waitForSelector("text=Local Brain")
  await page.waitForSelector("text=Notes")
  await page.waitForSelector('button:has-text("New")')
})
