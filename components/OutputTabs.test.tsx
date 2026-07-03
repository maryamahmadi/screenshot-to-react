import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OutputTabs } from "./OutputTabs";

// The lazy Sandpack preview isn't needed for these tab-logic tests; the cases
// below never enter a state where it renders (streaming, or empty code).
describe("OutputTabs", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("shows code on the Code tab while streaming", () => {
    render(<OutputTabs code="const a = 1;" streaming />);
    // Streaming forces the Code tab.
    expect(screen.getByText("const a = 1;")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Code" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("shows a waiting message on Preview while streaming", () => {
    render(<OutputTabs code="const a = 1;" streaming />);
    fireEvent.click(screen.getByRole("tab", { name: "Preview" }));
    expect(
      screen.getByText(/preview appears when generation finishes/i),
    ).toBeInTheDocument();
  });

  it("shows 'nothing to preview' for empty code when idle", () => {
    render(<OutputTabs code="" />);
    expect(screen.getByText(/nothing to preview/i)).toBeInTheDocument();
  });
});
