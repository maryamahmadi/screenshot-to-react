import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShareButton } from "./ShareButton";

describe("ShareButton", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("copies an absolute URL built from the path", async () => {
    render(<ShareButton path="/s/abc" />);
    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/s/abc`,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Link copied" }),
      ).toBeInTheDocument(),
    );
  });

  it("supports a custom label", () => {
    render(<ShareButton path="/s/abc" label="Copy share link" />);
    expect(
      screen.getByRole("button", { name: "Copy share link" }),
    ).toBeInTheDocument();
  });
});
