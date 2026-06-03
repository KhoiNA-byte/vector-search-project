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
            >
              {/* Color circle */}
              <span
                className="color-picker-circle"
                style={{ backgroundColor: COLOR_SWATCH[color] }}
              >
                {isSelected && (
                  <Check
                    className="color-picker-check"
                    strokeWidth={3}
                    style={{ color: color === "white" || color === "yellow" ? "#374151" : "#fff" }}
                  />
                )}
              </span>
              {/* Label */}
              <span className="color-picker-name">{color}</span>
            </button>
          );
        })}
      </div>

      {/* Selected preview strip */}
      {selected.length > 0 && (
        <div className="color-picker-preview">
          {selected.map((c) => (
            <span
              key={c}
              className="color-picker-chip"
              style={{ backgroundColor: COLOR_SWATCH[c] }}
              title={c}
            />
          ))}
          <span className="color-picker-preview-label">
            {selected.join(" / ")}
          </span>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
