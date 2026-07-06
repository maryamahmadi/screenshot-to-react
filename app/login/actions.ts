"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSignupAllowed } from "@/lib/allowlist";

function safeRedirectTo(raw: FormDataEntryValue | null): string {
  const value = typeof raw === "string" ? raw : "";
  // Only allow internal, absolute paths to avoid open-redirects.
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const redirectTo = safeRedirectTo(formData.get("redirectTo"));

  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const redirectTo = safeRedirectTo(formData.get("redirectTo"));
  const origin = (await headers()).get("origin") ?? "";
  const email = String(formData.get("email") ?? "");

  if (!isSignupAllowed(email)) {
    redirect(
      `/login?error=${encodeURIComponent("Sign-ups are restricted. Contact the site owner for access.")}`,
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: String(formData.get("password") ?? ""),
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  // With email confirmation enabled, signUp does not create a session; the
  // user must click the link in their email first. (If confirmation is off,
  // a session exists and the middleware will let them in on next navigation.)
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(redirectTo);
  }

  redirect(
    `/login?message=${encodeURIComponent("Check your email for a confirmation link to finish signing up.")}`,
  );
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
