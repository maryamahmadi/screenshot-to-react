import { test, expect } from "@playwright/test";
import {
  AUTH_FILE,
  BASE_URL,
  USERS,
  ensureUser,
  insertGeneration,
  deleteGeneration,
} from "./helpers";

test.use({ storageState: AUTH_FILE.a });

// Seed the generation via the admin API so this spec deterministically covers
// the history list, the owner detail view, and the public share page. The full
// screenshot -> stream -> persist UI flow is exercised by generate.spec.ts.
test("history lists a generation, owner can view it, and share link is public", async ({
  page,
  browser,
}) => {
  const marker = `SHARE_MARKER_${Date.now()}`;
  const aId = await ensureUser(USERS.a.email, USERS.a.password);
  const genId = await insertGeneration(aId, {
    title: "Share flow fixture",
    code: `export default function App() {\n  return <div>${marker}</div>;\n}`,
  });

  try {
    // The history grid shows at least this generation.
    await page.goto("/history");
    await expect(page.locator("ul li a").first()).toBeVisible();

    // The owner can open the detail view and see the code.
    await page.goto(`/history/${genId}`);
    await page.getByRole("tab", { name: "Code" }).click();
    await expect(page.getByText(new RegExp(marker)).first()).toBeVisible();

    // The share page is publicly readable without a session.
    const anon = await browser.newContext();
    const sharePage = await anon.newPage();
    const res = await sharePage.goto(`${BASE_URL}/s/${genId}`);
    expect(res?.status()).toBe(200);
    await sharePage.getByRole("tab", { name: "Code" }).click();
    await expect(sharePage.getByText(new RegExp(marker)).first()).toBeVisible();
    await anon.close();
  } finally {
    await deleteGeneration(genId);
  }
});
