import { FRUIT_COLORS, COLOR_SWATCH } from "../../lib/colorUtils.js";
import { Check } from "lucide-react";
import "./ColorPicker.css";

/**
 * A color swatch picker for selecting one or multiple fruit colors.
 *
 * Props:
 *   label       – section heading
 *   selected    – string[] of currently selected color tokens
 *   onChange    – (colors: string[]) => void
 *   max         – max selectable colors (default 3)
 */
const ColorPicker = ({ label, selected = [], onChange, max = 3 }) => {
  const toggle = (color) => {
    if (selected.includes(color)) {
      onChange(selected.filter((c) => c !== color));
    } else if (selected.length < max) {
      onChange([...selected, color]);
    }
  };

  return (
    <div className="color-picker-root">
      {label && <p className="color-picker-label">{label}</p>}

      <div className="color-picker-grid">
        {FRUIT_COLORS.map((color) => {
          const isSelected = selected.includes(color);
          const isDisabled = !isSelected && selected.length >= max;
          return (
            <button
              key={color}
              type="button"
              title={color}
              disabled={isDisabled}
              onClick={() => toggle(color)}
              className={[
                "color-picker-swatch",
                isSelected ? "color-picker-swatch--selected" : "",
                isDisabled ? "color-picker-swatch--disabled" : "",
              ].filter(Boolean).join(" ")}
              style={{
                backgroundColor: COLOR_SWATCH[color],
                "--selected-color-glow": `${COLOR_SWATCH[color]}55`,
              }}
            >
              {isSelected && (
                <Check
                  className="color-picker-check"
                  strokeWidth={3.5}
                  style={{ color: color === "white" || color === "yellow" ? "#1f2937" : "#ffffff" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected preview badge */}
      {selected.length > 0 && (
        <div className="color-picker-preview-badge-container">
          <span className="color-picker-badge-label">Selected:</span>
          <div className="color-picker-badge-pills">
            {selected.map((c) => (
              <div 
                key={c} 
                className="color-picker-badge-pill"
                style={{
                  '--pill-glow': COLOR_SWATCH[c] + '33',
                  border: `1px solid ${COLOR_SWATCH[c]}55`,
                }}
              >
                <span 
                  className="color-picker-badge-dot" 
                  style={{ 
                    backgroundColor: COLOR_SWATCH[c],
                    boxShadow: `0 0 6px ${COLOR_SWATCH[c]}`
                  }} 
                />
                <span className="color-picker-badge-name">{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
