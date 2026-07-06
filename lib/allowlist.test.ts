import { describe, it, expect, afterEach } from "vitest";
import { isSignupAllowed } from "./allowlist";

const KEY = "SIGNUP_ALLOWLIST";

describe("isSignupAllowed", () => {
  afterEach(() => {
    delete process.env[KEY];
  });

  it("allows any email when no allowlist is configured", () => {
    delete process.env[KEY];
    expect(isSignupAllowed("anyone@example.com")).toBe(true);
  });

  it("allows an email present in the allowlist (case-insensitive)", () => {
    process.env[KEY] = "owner@example.com, Friend@Example.com";
    expect(isSignupAllowed("owner@example.com")).toBe(true);
    expect(isSignupAllowed("friend@example.com")).toBe(true);
    expect(isSignupAllowed("  OWNER@example.com ")).toBe(true);
  });

  it("rejects an email not in the allowlist", () => {
    process.env[KEY] = "owner@example.com";
    expect(isSignupAllowed("stranger@example.com")).toBe(false);
  });

  it("treats a blank allowlist as open signups", () => {
    process.env[KEY] = "   ";
    expect(isSignupAllowed("anyone@example.com")).toBe(true);
  });
});
