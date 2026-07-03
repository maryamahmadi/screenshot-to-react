import { describe, it, expect } from "vitest";
import { formatDate, isUuid } from "./format";

describe("isUuid", () => {
  it("accepts canonical UUIDs", () => {
    expect(isUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    expect(isUuid("123E4567-E89B-12D3-A456-426614174000")).toBe(true);
  });

  it("rejects non-UUIDs", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("123e4567e89b12d3a456426614174000")).toBe(false);
    expect(isUuid("")).toBe(false);
    expect(isUuid("../../etc/passwd")).toBe(false);
  });
});

describe("formatDate", () => {
  it("formats an ISO date", () => {
    expect(formatDate("2026-07-03T15:00:00.000Z")).toMatch(/2026/);
  });

  it("returns empty string for invalid input", () => {
    expect(formatDate("nonsense")).toBe("");
  });
});
