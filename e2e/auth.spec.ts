import { test, expect } from "@playwright/test";
import { USERS } from "./helpers";

test("unauthenticated visit redirects to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("protected history page redirects to login when logged out", async ({
  page,
}) => {
  await page.goto("/history");
  await expect(page).toHaveURL(/\/login/);
});

test("a user can log in through the form", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(USERS.a.email);
  await page.getByLabel("Password").fill(USERS.a.password);
  await page.getByRole("button", { name: "Log in" }).click();

  await page.waitForURL("/");
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
});
