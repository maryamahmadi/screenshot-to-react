import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

/** Deterministic test accounts, provisioned pre-confirmed via the admin API. */
export const USERS = {
  a: { email: "e2e-a@example.com", password: "E2e-Test-Pass-A!23" },
  b: { email: "e2e-b@example.com", password: "E2e-Test-Pass-B!23" },
};

export const AUTH_FILE = {
  a: "e2e/.auth/a.json",
  b: "e2e/.auth/b.json",
};

export function admin(): SupabaseClient {
  if (!SUPABASE_URL || !SECRET_KEY) {
    throw new Error(
      "E2E requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.",
    );
  }
  return createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function findUserId(email: string): Promise<string | null> {
  const supabase = admin();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const match = data.users.find((u) => u.email === email);
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

/** Creates the user (pre-confirmed) if absent; returns its id either way. */
export async function ensureUser(
  email: string,
  password: string,
): Promise<string> {
  const existing = await findUserId(email);
  if (existing) return existing;

  const { data, error } = await admin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user!.id;
}

/** Deletes the user, their storage folder, and (via cascade) their rows. */
export async function deleteUser(email: string): Promise<void> {
  const id = await findUserId(email);
  if (!id) return;
  const supabase = admin();

  const { data: files } = await supabase.storage.from("screenshots").list(id);
  if (files && files.length > 0) {
    await supabase.storage
      .from("screenshots")
      .remove(files.map((f) => `${id}/${f.name}`));
  }

  await supabase.auth.admin.deleteUser(id);
}

/** Inserts a generation row directly (used to set up RLS scenarios). */
export async function insertGeneration(
  userId: string,
  opts: { title?: string; code?: string } = {},
): Promise<string> {
  const id = crypto.randomUUID();
  const { error } = await admin()
    .from("generations")
    .insert({
      id,
      user_id: userId,
      title: opts.title ?? "E2E fixture",
      code:
        opts.code ??
        "export default function App() {\n  return <div>fixture</div>;\n}",
      framework: "react-tailwind",
    });
  if (error) throw error;
  return id;
}

export async function deleteGeneration(id: string): Promise<void> {
  await admin().from("generations").delete().eq("id", id);
}
