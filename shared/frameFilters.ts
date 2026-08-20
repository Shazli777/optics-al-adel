export type FilterableFrame = {
  frameType: string;
  frameColor: string;
};

export type FrameFilters = {
  type: string;
  color: string;
};

const clean = (value: string) => value.trim();

export function frameFilterOptions<T extends FilterableFrame>(items: T[], field: keyof FilterableFrame) {
  return Array.from(new Set(items.map((item) => clean(item[field])).filter(Boolean)));
}

export function filterFrames<T extends FilterableFrame>(items: T[], filters: FrameFilters) {
  return items.filter((item) => {
    const typeMatches = filters.type === "الكل" || clean(item.frameType) === filters.type;
    const colorMatches = filters.color === "الكل" || clean(item.frameColor) === filters.color;
    return typeMatches && colorMatches;
  });
}
