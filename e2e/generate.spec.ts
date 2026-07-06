import { test, expect } from "@playwright/test";
import { AUTH_FILE } from "./helpers";

test.use({ storageState: AUTH_FILE.a });

test("generates a component from an example screenshot (mock mode)", async ({
  page,
}) => {
  await page.goto("/");

  // Pick a bundled example instead of uploading a file.
  await page.getByRole("button", { name: "Login form" }).click();
  await expect(page.getByText("Screenshot ready")).toBeVisible();

  await page.getByRole("button", { name: "Generate component" }).click();

  // Mock provider streams a deterministic component; verify via the Code tab
  // (the Preview tab uses Sandpack, which needs network we don't rely on here).
  await expect(page.getByText("mock mode", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Code" }).click();
  await expect(
    page.getByText(/export default function App/).first(),
  ).toBeVisible({ timeout: 20_000 });
});
