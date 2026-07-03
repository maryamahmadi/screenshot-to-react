import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CodePanel } from "./CodePanel";

describe("CodePanel", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders the code and filename", () => {
    render(<CodePanel code="const a = 1;" filename="App.tsx" />);
    expect(screen.getByText("App.tsx")).toBeInTheDocument();
    expect(screen.getByText("const a = 1;")).toBeInTheDocument();
  });

  it("copies to the clipboard and reflects copied state", async () => {
    render(<CodePanel code="const a = 1;" />);
    const button = screen.getByRole("button", { name: "Copy" });
    fireEvent.click(button);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("const a = 1;");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument(),
    );
  });

  it("disables copy when there is no code", () => {
    render(<CodePanel code="" />);
    expect(screen.getByRole("button", { name: "Copy" })).toBeDisabled();
  });
});
