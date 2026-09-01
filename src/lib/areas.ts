export const SAVE_SLOT_COUNT = 8;

export const DEFAULT_AREA_NAMES = [
  "Inbox",
  "Later",
  "Reading",
  "Reference",
  "Work",
  "Personal",
  "Archive",
  "Misc",
] as const;

/** Okabe–Ito palette, slot order 1–8. */
export const SLOT_COLORS = [
  "#E69F00",
  "#56B4E9",
  "#009E73",
  "#F0E442",
  "#0072B2",
  "#D55E00",
  "#CC79A7",
  "#575757",
] as const;

export function slotColor(index: number): string {
  return SLOT_COLORS[index] ?? SLOT_COLORS[SLOT_COLORS.length - 1];
}

export function contrastText(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.45 ? "#111111" : "#ffffff";
}

export function defaultAreaTitle(index: number): string {
  return DEFAULT_AREA_NAMES[index] ?? `Area ${index + 1}`;
}
