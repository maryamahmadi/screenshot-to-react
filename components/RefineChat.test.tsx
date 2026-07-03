import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RefineChat } from "./RefineChat";

describe("RefineChat", () => {
  it("renders the instruction history", () => {
    render(
      <RefineChat history={["make it dark", "bigger title"]} onSubmit={() => {}} />,
    );
    expect(screen.getByText("make it dark")).toBeInTheDocument();
    expect(screen.getByText("bigger title")).toBeInTheDocument();
  });

  it("submits a trimmed instruction and clears the input", () => {
    const onSubmit = vi.fn();
    render(<RefineChat history={[]} onSubmit={onSubmit} />);
    const input = screen.getByLabelText("Refinement instruction");
    fireEvent.change(input, { target: { value: "  make the button blue  " } });
    fireEvent.click(screen.getByRole("button", { name: "Refine" }));

    expect(onSubmit).toHaveBeenCalledWith("make the button blue");
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("does not submit empty input", () => {
    const onSubmit = vi.fn();
    render(<RefineChat history={[]} onSubmit={onSubmit} />);
    expect(screen.getByRole("button", { name: "Refine" })).toBeDisabled();
    fireEvent.submit(screen.getByLabelText("Refinement instruction"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables input and button while busy", () => {
    render(<RefineChat history={[]} onSubmit={() => {}} disabled />);
    expect(screen.getByLabelText("Refinement instruction")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Refine" })).toBeDisabled();
  });
});
