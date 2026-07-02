import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

function Hello({ name }: { name: string }) {
  return <h1>Hello {name}</h1>;
}

describe("test harness", () => {
  it("runs plain assertions", () => {
    expect(1 + 1).toBe(2);
  });

  it("renders a component and queries the DOM", () => {
    render(<Hello name="world" />);
    expect(
      screen.getByRole("heading", { name: "Hello world" }),
    ).toBeInTheDocument();
  });
});
