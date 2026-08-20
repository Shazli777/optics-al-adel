import { describe, expect, it } from "vitest";
import { filterFrames, frameFilterOptions } from "./frameFilters";

const frames = [
  { title: "فريم طبي عسلي", frameType: "طبي", frameColor: "عسلي" },
  { title: "فريم شمسي أسود", frameType: "شمسي", frameColor: "أسود" },
  { title: "فريم طبي شفاف", frameType: "طبي", frameColor: "شفاف" },
];

describe("frame filters", () => {
  it("lists unique frame types and colors", () => {
    expect(frameFilterOptions(frames, "frameType")).toEqual(["طبي", "شمسي"]);
    expect(frameFilterOptions(frames, "frameColor")).toEqual(["عسلي", "أسود", "شفاف"]);
  });

  it("filters frames by both type and color", () => {
    expect(filterFrames(frames, { type: "طبي", color: "شفاف" }).map((frame) => frame.title)).toEqual(["فريم طبي شفاف"]);
    expect(filterFrames(frames, { type: "شمسي", color: "الكل" })).toHaveLength(1);
  });
});
