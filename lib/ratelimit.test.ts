import { describe, it, expect } from "vitest";
import { createRateLimiter } from "./ratelimit";

describe("createRateLimiter", () => {
  it("allows up to the limit within the window", () => {
    const rl = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect(rl.check("u", 0).allowed).toBe(true);
    expect(rl.check("u", 100).allowed).toBe(true);
    expect(rl.check("u", 200).allowed).toBe(true);
    const blocked = rl.check("u", 300);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("reports retry-after based on the oldest hit", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000 });
    rl.check("u", 0);
    const blocked = rl.check("u", 400);
    expect(blocked.allowed).toBe(false);
    // oldest hit at 0 + 1000 window - now(400) = 600ms
    expect(blocked.retryAfterMs).toBe(600);
  });

  it("allows again after the window slides past old hits", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(rl.check("u", 0).allowed).toBe(true);
    expect(rl.check("u", 500).allowed).toBe(false);
    expect(rl.check("u", 1001).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(rl.check("a", 0).allowed).toBe(true);
    expect(rl.check("b", 0).allowed).toBe(true);
    expect(rl.check("a", 0).allowed).toBe(false);
  });

  it("decrements remaining as requests are used", () => {
    const rl = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect(rl.check("u", 0).remaining).toBe(2);
    expect(rl.check("u", 0).remaining).toBe(1);
    expect(rl.check("u", 0).remaining).toBe(0);
  });
});
