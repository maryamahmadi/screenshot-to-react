import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Dropzone } from "./Dropzone";
import type { ProcessedImage } from "@/lib/image";

const fakeProcessed: ProcessedImage = {
  base64: "AAAB",
  mediaType: "image/png",
  dataUrl: "data:image/png;base64,AAAB",
  width: 100,
  height: 80,
  bytes: 3,
};

function pngFile(name = "shot.png") {
  return new File(["x"], name, { type: "image/png" });
}

describe("Dropzone", () => {
  it("processes a dropped image and calls onSelect", async () => {
    const onSelect = vi.fn();
    const processFile = vi.fn().mockResolvedValue(fakeProcessed);
    render(
      <Dropzone
        value={null}
        onSelect={onSelect}
        onClear={() => {}}
        processFile={processFile}
        pasteFromClipboard={false}
      />,
    );

    const zone = screen.getByRole("button", { name: /drop a screenshot/i });
    fireEvent.drop(zone, { dataTransfer: { files: [pngFile()] } });

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(fakeProcessed));
    expect(processFile).toHaveBeenCalledOnce();
  });

  it("processes a file chosen via the picker", async () => {
    const onSelect = vi.fn();
    const processFile = vi.fn().mockResolvedValue(fakeProcessed);
    const { container } = render(
      <Dropzone
        value={null}
        onSelect={onSelect}
        onClear={() => {}}
        processFile={processFile}
        pasteFromClipboard={false}
      />,
    );

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [pngFile()] } });

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(fakeProcessed));
  });

  it("accepts an image pasted from the clipboard", async () => {
    const onSelect = vi.fn();
    const processFile = vi.fn().mockResolvedValue(fakeProcessed);
    render(
      <Dropzone
        value={null}
        onSelect={onSelect}
        onClear={() => {}}
        processFile={processFile}
      />,
    );

    const file = pngFile("pasted.png");
    const event = new Event("paste", { bubbles: true }) as Event & {
      clipboardData: unknown;
    };
    event.clipboardData = {
      items: [{ type: "image/png", getAsFile: () => file }],
    };
    window.dispatchEvent(event);

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(fakeProcessed));
  });

  it("rejects an unsupported file type without processing it", async () => {
    const onSelect = vi.fn();
    const processFile = vi.fn().mockResolvedValue(fakeProcessed);
    const { container } = render(
      <Dropzone
        value={null}
        onSelect={onSelect}
        onClear={() => {}}
        processFile={processFile}
        pasteFromClipboard={false}
      />,
    );

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const gif = new File(["x"], "anim.gif", { type: "image/gif" });
    fireEvent.change(input, { target: { files: [gif] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /unsupported file type/i,
    );
    expect(processFile).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows the preview and supports removal when a value is set", () => {
    const onClear = vi.fn();
    render(
      <Dropzone
        value={fakeProcessed}
        onSelect={() => {}}
        onClear={onClear}
        pasteFromClipboard={false}
      />,
    );

    expect(screen.getByAltText(/screenshot preview/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
