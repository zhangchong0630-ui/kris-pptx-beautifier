export function parseSlideSelection(value, slideCount) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Slide selection is required, for example: 2,4-6,9");
  }

  const normalizedValue = value
    .replaceAll("第", "")
    .replaceAll("页", "")
    .replace(/[，、]/g, ",")
    .replace(/[–—~～]/g, "-");
  const selected = new Set();
  for (const rawPart of normalizedValue.split(",")) {
    const part = rawPart.trim();
    if (!part) throw new Error(`Invalid empty slide token in: ${value}`);

    const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start > end) throw new Error(`Descending slide range is not allowed: ${part}`);
      for (let page = start; page <= end; page += 1) selected.add(page);
      continue;
    }

    if (!/^\d+$/.test(part)) throw new Error(`Invalid slide token: ${part}`);
    selected.add(Number(part));
  }

  const pages = [...selected].sort((a, b) => a - b);
  if (pages.some((page) => page < 1)) throw new Error("Slide numbers are 1-based and must be positive");
  if (Number.isInteger(slideCount) && pages.some((page) => page > slideCount)) {
    throw new Error(`Slide selection exceeds the source deck's ${slideCount} slides: ${pages.join(",")}`);
  }
  return pages;
}
