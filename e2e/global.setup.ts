import { test as setup, expect } from "@playwright/test";
import { AUTH_FILE, USERS, ensureUser } from "./helpers";

async function logIn(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  file: string,
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/");
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await page.context().storageState({ path: file });
}

setup("provision and authenticate test users", async ({ page }) => {
  await ensureUser(USERS.a.email, USERS.a.password);
  await ensureUser(USERS.b.email, USERS.b.password);

  await logIn(page, USERS.a.email, USERS.a.password, AUTH_FILE.a);
  await logIn(page, USERS.b.email, USERS.b.password, AUTH_FILE.b);
});
