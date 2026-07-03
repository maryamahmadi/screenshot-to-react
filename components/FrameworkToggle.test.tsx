import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FrameworkToggle } from "./FrameworkToggle";

describe("FrameworkToggle", () => {
  it("marks the active option as pressed", () => {
    render(<FrameworkToggle value="react-tailwind" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Tailwind" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Inline CSS" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("emits the selected framework on click", () => {
    const onChange = vi.fn();
    render(<FrameworkToggle value="react-tailwind" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Inline CSS" }));
    expect(onChange).toHaveBeenCalledWith("react");
  });

  it("disables options when disabled", () => {
    render(
      <FrameworkToggle value="react" onChange={() => {}} disabled />,
    );
    expect(screen.getByRole("button", { name: "Tailwind" })).toBeDisabled();
  });
});
