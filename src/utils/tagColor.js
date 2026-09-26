// Tag colors are assigned automatically. Hashing each tag's text to a hue
// kept a tag's color fixed forever but let unrelated tags land on nearly the
// same color, so instead every tag in the vault is sorted and given the next
// step around the color wheel by the golden angle, which keeps any two tags
// clearly apart. The list is built from all tasks, not the filtered ones, so
// filtering never recolors anything; only a brand-new tag can shift the
// tags sorted after it.
const GOLDEN_ANGLE = 137.508;
const START_HUE = 210;

export function assignTagHues(tags) {
  const sorted = [...new Set(tags)].sort((a, b) => a.localeCompare(b));
  return new Map(sorted.map((tag, i) => [tag, Math.round((START_HUE + i * GOLDEN_ANGLE) % 360)]));
}
