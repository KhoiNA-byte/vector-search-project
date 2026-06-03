// ─── Fruit color palette ──────────────────────────────────────────────────────

/** All predefined color tokens (used in the ColorPicker UI) */
export const FRUIT_COLORS = [
  "red", "orange", "yellow", "green", "purple",
  "pink", "blue", "white", "brown", "black",
];

/** Visual swatch hex values for the picker UI */
export const COLOR_SWATCH = {
  red:    "#f87171",
  orange: "#fb923c",
  yellow: "#facc15",
  green:  "#4ade80",
  purple: "#c084fc",
  pink:   "#f472b6",
  blue:   "#60a5fa",
  white:  "#f1f0ef",
  brown:  "#b45309",
  black:  "#292524",
};

/**
 * Tailwind bg map — written out fully so the scanner picks them up at build time.
 * @type {Record<string, string>}
 */
export const COLOR_BG = {
  red:    "bg-red-100",
  orange: "bg-orange-100",
  yellow: "bg-yellow-100",
  green:  "bg-green-100",
  purple: "bg-purple-100",
  pink:   "bg-pink-100",
  blue:   "bg-blue-100",
  white:  "bg-stone-100",
  brown:  "bg-amber-100",
  black:  "bg-stone-200",
};

/**
 * Tailwind hover-bg map — written out fully for the scanner.
 * @type {Record<string, string>}
 */
export const COLOR_HOVER_BG = {
  red:    "hover:bg-red-200",
  orange: "hover:bg-orange-200",
  yellow: "hover:bg-yellow-200",
  green:  "hover:bg-green-200",
  purple: "hover:bg-purple-200",
  pink:   "hover:bg-pink-200",
  blue:   "hover:bg-blue-200",
  white:  "hover:bg-stone-200",
  brown:  "hover:bg-amber-200",
  black:  "hover:bg-stone-300",
};

/** Maps fruit color token → Tailwind color name */
const TW_COLOR = {
  red: "red", orange: "orange", yellow: "yellow", green: "green",
  purple: "purple", pink: "pink", blue: "blue",
  white: "stone", brown: "amber", black: "stone",
};

/** Tailwind shade overrides for colors that don't map to the standard 100/200 pattern */
const SHADE_OVERRIDE = { black: { base: "200", hover: "300" } };

function twShade(color, level) {
  return SHADE_OVERRIDE[color]?.[level] ?? (level === "base" ? "100" : "200");
}

// ─── Parse / build helpers ────────────────────────────────────────────────────

/**
 * Parses a slash-separated color string into an array of color tokens.
 * "yellow/green" → ["yellow", "green"]
 * Returns an empty array for falsy input.
 */
export function parseColors(colorStr) {
  if (!colorStr) return [];
  return colorStr
    .toLowerCase()
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Joins an array of color tokens back into a DB-ready string.
 * ["yellow", "green"] → "yellow/green"
 */
export function joinColors(colors) {
  return colors.filter(Boolean).join("/");
}

// ─── Dynamic gradient builder ─────────────────────────────────────────────────

/**
 * Builds { bg, hoverBg } Tailwind class strings from an array of color names.
 *
 * Rules:
 *   - 0 valid colors → stone fallback
 *   - 1 color → flat bg class from COLOR_BG
 *   - 2 colors → "bg-gradient-to-br from-X-100 to-Y-100"
 *   - 3+ colors → adds a via-Z-100 middle stop
 *
 * NOTE: The `from-*`, `via-*`, `to-*` classes are dynamically assembled at
 * runtime, so they are NOT statically found by Tailwind's scanner.
 * They are safelisted via `@source inline(...)` in style.css.
 *
 * @param {string[]} colors
 * @returns {{ bg: string, hoverBg: string }}
 */
export function buildColorClasses(colors) {
  const valid = (colors ?? []).filter((c) => TW_COLOR[c]);

  if (valid.length === 0) return { bg: "bg-stone-100", hoverBg: "hover:bg-stone-200" };
  if (valid.length === 1) {
    return { bg: COLOR_BG[valid[0]], hoverBg: COLOR_HOVER_BG[valid[0]] };
  }

  const from = valid[0];
  const to   = valid[valid.length - 1];
  const via  = valid[1]; // used only for 3+ colors

  const fc = TW_COLOR[from];
  const tc = TW_COLOR[to];

  if (valid.length === 2) {
    return {
      bg:      `bg-gradient-to-br from-${fc}-${twShade(from, "base")} to-${tc}-${twShade(to, "base")}`,
      hoverBg: `hover:from-${fc}-${twShade(from, "hover")} hover:to-${tc}-${twShade(to, "hover")}`,
    };
  }

  const vc = TW_COLOR[via];
  return {
    bg:      `bg-gradient-to-br from-${fc}-${twShade(from, "base")} via-${vc}-${twShade(via, "base")} to-${tc}-${twShade(to, "base")}`,
    hoverBg: `hover:from-${fc}-${twShade(from, "hover")} hover:via-${vc}-${twShade(via, "hover")} hover:to-${tc}-${twShade(to, "hover")}`,
  };
}
