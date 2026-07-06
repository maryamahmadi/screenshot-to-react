import { test, expect } from "@playwright/test";
import {
  AUTH_FILE,
  USERS,
  ensureUser,
  insertGeneration,
  deleteGeneration,
} from "./helpers";

test("a user cannot open another user's generation (RLS)", async ({
  browser,
}) => {
  // A generation owned by user B.
  const bId = await ensureUser(USERS.b.email, USERS.b.password);
  const genId = await insertGeneration(bId, { title: "B-only fixture" });

  try {
    // User A must not be able to load it (RLS scopes the query to the owner).
    const aCtx = await browser.newContext({ storageState: AUTH_FILE.a });
    const aPage = await aCtx.newPage();
    const aRes = await aPage.goto(`/history/${genId}`);
    expect(aRes?.status()).toBe(404);
    await aCtx.close();

    // The owner (B) can load it.
    const bCtx = await browser.newContext({ storageState: AUTH_FILE.b });
    const bPage = await bCtx.newPage();
    const bRes = await bPage.goto(`/history/${genId}`);
    expect(bRes?.status()).toBe(200);
    await expect(bPage.getByText("B-only fixture")).toBeVisible();
    await bCtx.close();
  } finally {
    await deleteGeneration(genId);
  }
});
