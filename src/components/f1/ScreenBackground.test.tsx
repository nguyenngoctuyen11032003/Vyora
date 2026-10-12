import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroPhoto, heroCandidates } from "./ScreenBackground";

const HQ = "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg";

describe("heroCandidates", () => {
  it("tries the sharper YouTube sizes before hqdefault", () => {
    expect(heroCandidates(HQ)).toEqual([
      "https://i.ytimg.com/vi/abcdefghijk/maxresdefault.jpg",
      "https://i.ytimg.com/vi/abcdefghijk/sddefault.jpg",
      HQ,
    ]);
  });

  it("keeps other URLs as they are and handles null", () => {
    expect(heroCandidates("https://example.com/a.jpg")).toEqual(["https://example.com/a.jpg"]);
    expect(heroCandidates(null)).toEqual([]);
  });
});

describe("HeroPhoto", () => {
  it("falls back size by size, then to the F1 background", () => {
    const { container } = render(<HeroPhoto src={HQ} />);
    const img = () => container.querySelector("img")!;
    expect(img().getAttribute("src")).toContain("maxresdefault");
    fireEvent.error(img());
    expect(img().getAttribute("src")).toContain("sddefault");
    fireEvent.error(img());
    expect(img().getAttribute("src")).toBe(HQ);
    fireEvent.error(img());
    expect(img().getAttribute("src")).not.toContain("ytimg");
  });
});
