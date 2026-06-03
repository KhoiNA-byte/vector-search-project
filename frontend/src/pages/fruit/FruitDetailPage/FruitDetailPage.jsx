import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fruitService } from "../../../services/fruitService.js";
import { ArrowLeft, Edit2, Trash2, Check, X, MapPin, Calendar, Sparkles, Tag, Utensils, DollarSign } from "lucide-react";
import { Button } from "../../../components/ui/Button.jsx";
import ColorPicker from "../../../components/ui/ColorPicker.jsx";
import { parseColors, joinColors, buildColorClasses, COLOR_SWATCH } from "../../../lib/colorUtils.js";
import "./FruitDetailPage.css";

// ─── Dynamic background builder ──────────────────────────────────────────────

/**
 * Returns an inline style object for the fruit-detail-card based on
 * the fruit's inside colors.
 */
function buildDetailBg(colorOutsideStr, colorInsideStr) {
  const inColors = parseColors(colorInsideStr);

  const defaultIn = "#ffffff";  // off-white/white

  const inStop1 = inColors.length > 0 ? (COLOR_SWATCH[inColors[0]] || defaultIn) : defaultIn;
  const inStop2 = inColors.length > 1 ? (COLOR_SWATCH[inColors[1]] || inStop1) : inStop1;

  // Layer a gentle gradient based ONLY on the inside color over a solid white background
  return { 
    background: `linear-gradient(135deg, ${inStop1}15 0%, ${inStop1}33 50%, ${inStop2}44 100%), #ffffff` 
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const FruitDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fruit, setFruit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);

  // Color picker state (split from formData for UX reasons)
  const [outsideColors, setOutsideColors] = useState([]);
  const [insideColors, setInsideColors] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchFruit();
  }, [id]);

  const fetchFruit = async () => {
    setLoading(true);
    try {
      const data = await fruitService.getFruit(id);
      setFruit(data);
      setFormData(data);
      setOutsideColors(parseColors(data.colorOutside));
      setInsideColors(parseColors(data.colorInside));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await fruitService.updateFruit(id, {
        ...formData,
        colorOutside: joinColors(outsideColors),
        colorInside: joinColors(insideColors),
      });
      await fetchFruit();
      setIsEditing(false);
    } catch (err) {
      alert("Update failed: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this fruit?")) return;
    try {
      await fruitService.deleteFruit(id);
      navigate("/fruit");
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "price" ? parseFloat(value) : value });
  };

  if (loading) return (
    <div className="fruit-page-container flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
    </div>
  );
  if (error) return (
    <div className="fruit-page-container flex flex-col items-center justify-center text-destructive">
      <p>Error: {error}</p>
      <Button onClick={() => navigate("/fruit")} className="mt-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Search
      </Button>
    </div>
  );
  if (!fruit) return null;

  return (
    <main className="fruit-detail-container">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={() => navigate("/fruit")}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to list
        </button>

        <div className="fruit-detail-card" style={buildDetailBg(fruit.colorOutside, fruit.colorInside)}>
          {/* Header */}
          <div className="fruit-detail-header-container">
            <div className="fruit-detail-title-section">
              {isEditing ? (
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="fruit-detail-title-input"
                />
              ) : (
                <h1 className="fruit-detail-title">{fruit.name}</h1>
              )}
              <div className="fruit-detail-origin-container">
                <MapPin className="h-4 w-4" />
                {isEditing ? (
                  <input name="origin" value={formData.origin} onChange={handleInputChange} className="fruit-detail-origin-input" />
                ) : (
                  <span>{fruit.origin}</span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button onClick={handleUpdate} disabled={isUpdating} className="rounded-full bg-green-600 hover:bg-green-700 text-white px-6">
                    <Check className="h-4 w-4 mr-2" /> {isUpdating ? "Saving..." : "Save"}
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline" className="rounded-full border-border">
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="btn-edit-action">
                    <Edit2 className="h-4 w-4" /> Edit
                  </Button>
                  <Button onClick={handleDelete} variant="outline" className="btn-delete-action">
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="fruit-detail-grid">
            <DetailItem icon={Tag} label="Flavor Profile" name="flavor" value={fruit.flavor} isEditing={isEditing} editValue={formData?.flavor} onChange={handleInputChange} />
            <DetailItem icon={Sparkles} label="Texture" name="texture" value={fruit.texture} isEditing={isEditing} editValue={formData?.texture} onChange={handleInputChange} />
            <DetailItem icon={Calendar} label="Best Season" name="season" value={fruit.season} isEditing={isEditing} editValue={formData?.season} onChange={handleInputChange} />
            <DetailItem icon={Utensils} label="Perfect For" name="bestFor" value={fruit.bestFor} isEditing={isEditing} editValue={formData?.bestFor} onChange={handleInputChange} />
            <DetailItem icon={DollarSign} label="Estimated Price" name="price" value={`$${fruit.price.toFixed(2)}`} isEditing={isEditing} editValue={formData?.price} onChange={handleInputChange} type="number" />
          </div>

          {/* ── Color section ──────────────────────────────────────────── */}
          {isEditing ? (
            <div className="fruit-detail-colors-edit">
              <ColorPicker
                label="Outside Color (skin / peel)"
                selected={outsideColors}
                onChange={setOutsideColors}
                max={3}
              />
              <ColorPicker
                label="Inside Color (flesh / pulp)"
                selected={insideColors}
                onChange={setInsideColors}
                max={3}
              />
            </div>
          ) : (
            <div className="fruit-detail-colors-view">
              <div className="fruit-detail-colors-group">
                <span className="fruit-detail-colors-label">Outside</span>
                <div className="fruit-detail-colors-chips">
                  {parseColors(fruit.colorOutside).map((c) => (
                    <span
                      key={c}
                      className="fruit-detail-color-chip"
                      style={{ backgroundColor: COLOR_SWATCH[c] }}
                      title={c}
                    />
                  ))}
                  <span className="fruit-detail-colors-text capitalize">{fruit.colorOutside || "—"}</span>
                </div>
              </div>
              <div className="fruit-detail-colors-group">
                <span className="fruit-detail-colors-label">Inside</span>
                <div className="fruit-detail-colors-chips">
                  {parseColors(fruit.colorInside).map((c) => (
                    <span
                      key={c}
                      className="fruit-detail-color-chip"
                      style={{ backgroundColor: COLOR_SWATCH[c] }}
                      title={c}
                    />
                  ))}
                  <span className="fruit-detail-colors-text capitalize">{fruit.colorInside || "—"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Ambient Background Element */}
          <div 
            className="fruit-detail-ambient-bg"
            style={{ 
              backgroundColor: parseColors(fruit.colorInside).length > 0 
                ? COLOR_SWATCH[parseColors(fruit.colorInside)[0]] 
                : undefined 
            }}
          />
        </div>
      </div>
    </main>
  );
};

const DetailItem = ({ icon: Icon, label, value, name, isEditing, editValue, onChange, type = "text" }) => (
  <div className="fruit-detail-item">
    <div className="fruit-detail-item-label">
      <Icon className="h-4 w-4" />
      {label}
    </div>
    {isEditing ? (
      <input
        type={type}
        name={name}
        value={editValue}
        onChange={onChange}
        className="fruit-detail-item-input"
      />
    ) : (
      <div className="fruit-detail-item-value">{value}</div>
    )}
  </div>
);

export default FruitDetailPage;
