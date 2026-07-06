/**
 * Opt-in signup gate. When SIGNUP_ALLOWLIST is set (comma-separated emails),
 * only those addresses may create an account — this keeps a public *live*
 * deployment from letting anyone spend the owner's model credits. When it is
 * unset, signups are open (local dev and tests are unaffected).
 */
export function isSignupAllowed(email: string): boolean {
  const raw = process.env.SIGNUP_ALLOWLIST?.trim();
  if (!raw) return true;

  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.trim().toLowerCase());
}
