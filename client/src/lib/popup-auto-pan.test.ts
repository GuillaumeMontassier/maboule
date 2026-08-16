import { describe, expect, it } from "vitest";
import { computePopupAutoPanPadding } from "./popup-auto-pan";

describe("computePopupAutoPanPadding", () => {
  it("reserves the mobile search+filters height on top in mobile viewports", () => {
    const { topLeft } = computePopupAutoPanPadding(375);
    expect(topLeft).toEqual([304, 300]);
  });

  it("falls back to the small default top margin in desktop viewports", () => {
    const { topLeft } = computePopupAutoPanPadding(1280);
    expect(topLeft).toEqual([304, 16]);
  });

  it("treats the breakpoint width itself as desktop (strict less-than)", () => {
    const { topLeft } = computePopupAutoPanPadding(768);
    expect(topLeft).toEqual([304, 16]);
  });

  it("treats one pixel below the breakpoint as mobile", () => {
    const { topLeft } = computePopupAutoPanPadding(767);
    expect(topLeft).toEqual([304, 300]);
  });

  it("keeps the bottom-right padding independent of viewport width", () => {
    expect(computePopupAutoPanPadding(375).bottomRight).toEqual([16, 325]);
    expect(computePopupAutoPanPadding(1280).bottomRight).toEqual([16, 325]);
  });
});
