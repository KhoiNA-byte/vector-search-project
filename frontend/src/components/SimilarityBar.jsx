/**
 * SimilarityBar
 *
 * Props:
 *  - value      {number}  0–100 percentage
 *  - highlight  {boolean} whether this is a top/featured result
 *  - type       {"fruit"|"visual"} controls the default Tailwind gradient class
 *  - gradient   {string}  optional CSS gradient string — overrides the Tailwind class fill
 *  - glowColor  {string}  optional CSS color — renders as a box-shadow glow on highlight
 *  - trackColor {string}  optional CSS color for the background track (defaults to muted)
 */
const SimilarityBar = ({
  value,
  highlight,
  type = "fruit",
  gradient,
  glowColor,
  trackColor,
}) => {
  const normalizedValue = Math.min(Math.max(value, 0), 100);

  // ── Tailwind class fallbacks (used when no custom gradient is supplied) ──
  const gradientClass = type === "visual" ? "bg-gradient-visual" : "bg-gradient-fruit";
  const glowClass     = type === "visual" ? "shadow-glow-visual" : "shadow-glow-fruit";

  // ── Inline styles (only applied when custom props are provided) ──
  const fillStyle = gradient
    ? {
        width:      `${normalizedValue}%`,
        background: gradient,
        boxShadow:  highlight && glowColor ? `0 0 10px 1px ${glowColor}` : "none",
      }
    : { width: `${normalizedValue}%` };

  const trackStyle = trackColor ? { background: trackColor } : {};

  return (
    <div className="w-full">
      <div
        className="h-2 w-full rounded-full overflow-hidden bg-muted"
        style={trackStyle}
      >
        <div
          className={`h-full transition-all duration-1000 ease-out rounded-full ${
            gradient
              ? ""                                                    // custom gradient via style
              : highlight ? `${gradientClass} ${glowClass}` : gradientClass  // tailwind fallback
          }`}
          style={fillStyle}
        />
      </div>
    </div>
  );
};

export default SimilarityBar;
