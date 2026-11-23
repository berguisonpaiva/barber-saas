import { expect, test } from "@playwright/test";

test("home abre e leva ao login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Já tenho conta" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
