// Drawing colours for marks on a screenshot. They are part of the image, not the app's theme, so they stay the same in
// light and dark mode and are picked to stand out on typical ERP screens.

export const MARK_COLORS = [
  { name: "Red", value: "#e5251b" },
  { name: "Yellow", value: "#f5b700" },
  { name: "Blue", value: "#1f6feb" },
  { name: "Black", value: "#111111" },
] as const;

export const DEFAULT_MARK_COLOR = MARK_COLORS[0].value;

/** Hidden areas are always solid black. */
export const HIDE_COLOR = "#000000";

/** The outline drawn around text notes so they read on any background. */
export const TEXT_OUTLINE = "#ffffff";

/** The highlighter: see-through yellow, so what's under it stays readable. */
export const HIGHLIGHT = "rgba(255, 214, 0, 0.38)";

/** A step number and a callout's text, on their coloured background. */
export const ON_MARK = "#ffffff";

/** Editor preview only (never saved): the selected mark's frame and handles. */
export const SELECT_LINE = "#1f6feb";
export const SELECT_HANDLE = "#ffffff";

/** Editor preview only (never saved): the dimmed area outside a crop, and the crop's dashed frame. */
export const CROP_DIM = "rgba(0, 0, 0, 0.55)";
export const CROP_LINE = "#ffffff";
