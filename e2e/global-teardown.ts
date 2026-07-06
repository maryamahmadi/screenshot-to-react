import { USERS, deleteUser } from "./helpers";

/** Removes the test users (and their cascaded rows + storage) after the run. */
export default async function globalTeardown() {
  try {
    await deleteUser(USERS.a.email);
    await deleteUser(USERS.b.email);
  } catch (err) {
    // Teardown is best-effort; don't fail the run over cleanup.
    console.warn("E2E teardown cleanup failed:", err);
  }
}
