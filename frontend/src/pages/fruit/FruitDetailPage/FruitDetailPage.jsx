import { useState, useEffect, useRef } from "react";
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
    background: `linear-gradient(135deg, ${inStop1}22 0%, ${inStop1}44 50%, ${inStop2}66 100%), #ffffff` 
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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClosingEdit, setIsClosingEdit] = useState(false);
  const [isClosingDelete, setIsClosingDelete] = useState(false);

  const editFormRef = useRef(null);

  useEffect(() => {
    fetchFruit();
  }, [id]);

  // Click outside Edit Form to close/cancel
  useEffect(() => {
    if (!isEditing) return;
    const handleClickOutside = (event) => {
      if (editFormRef.current && !editFormRef.current.contains(event.target)) {
        closeEdit();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, fruit]);

  const closeEdit = () => {
    setIsClosingEdit(true);
    setTimeout(() => {
      setIsEditing(false);
      setIsClosingEdit(false);
      if (fruit) {
        setFormData(fruit);
        setOutsideColors(parseColors(fruit.colorOutside));
        setInsideColors(parseColors(fruit.colorInside));
      }
    }, 250);
  };

  const closeDeleteModal = () => {
    setIsClosingDelete(true);
    setTimeout(() => {
      setShowDeleteModal(false);
      setIsClosingDelete(false);
    }, 200);
  };

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
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        closeEdit();
      }, 1000);
    } catch (err) {
      alert("Update failed: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await fruitService.deleteFruit(id);
      setShowDeleteModal(false);
      navigate("/fruit");
    } catch (err) {
      alert("Delete failed: " + err.message);
    } finally {
      setIsDeleting(false);
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
          className="back-pill-button"
        >
          <ArrowLeft className="h-4 w-4 transition-transform" />
          <span>Back to Fruits</span>
        </button>

        <div 
          className={`fruit-detail-card ${isEditing ? "is-editing" : ""}`} 
          style={buildDetailBg(
            isEditing ? joinColors(outsideColors) : fruit.colorOutside, 
            isEditing ? joinColors(insideColors) : fruit.colorInside
          )}
        >
          {isEditing ? (
            <div ref={editFormRef} className={`fruit-edit-form-wrapper animate-fade-in-up ${isClosingEdit ? "is-closing" : ""}`}>
              {/* Header */}
              <div className="fruit-edit-header">
                <div className="fruit-edit-title-group">
                  <h1 className="fruit-edit-hero-title">{formData.name || "Unnamed Fruit"}</h1>
                  <div className="fruit-edit-hero-origin">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span>{formData.origin || "No Origin Specified"}</span>
                  </div>
                  <div className="fruit-edit-metadata">
                    <span className="fruit-metadata-badge">Editing Profile</span>
                    <span className="fruit-metadata-badge secondary">ID: #{fruit.id}</span>
                  </div>
                </div>

                <div className="fruit-edit-actions">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="fruit-edit-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={isUpdating || saveSuccess}
                    className={`fruit-edit-btn-save ${isUpdating ? "is-loading" : ""} ${saveSuccess ? "is-success" : ""}`}
                  >
                    {isUpdating ? (
                      <>
                        <span className="fruit-spinner"></span>
                        Saving...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="h-4 w-4" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sections */}
              <div className="fruit-edit-sections-list">
                {/* Section 1: Basic Information */}
                <div className="fruit-edit-section">
                  <div className="fruit-edit-section-header">
                    <Tag className="h-4.5 w-4.5 text-emerald-600" />
                    <h2>Basic Information</h2>
                  </div>
                  <div className="fruit-edit-section-divider"></div>
                  <div className="fruit-edit-section-fields grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="fruit-edit-field-group">
                      <label htmlFor="name-input" className="fruit-edit-field-label">Fruit Name</label>
                      <input
                        id="name-input"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="fruit-edit-input"
                        placeholder="e.g. Watermelon"
                      />
                    </div>
                    <div className="fruit-edit-field-group">
                      <label htmlFor="origin-input" className="fruit-edit-field-label">Origin</label>
                      <input
                        id="origin-input"
                        type="text"
                        name="origin"
                        value={formData.origin}
                        onChange={handleInputChange}
                        className="fruit-edit-input"
                        placeholder="e.g. South America"
                      />
                    </div>
                    <div className="fruit-edit-field-group">
                      <label htmlFor="price-input" className="fruit-edit-field-label">Estimated Price ($)</label>
                      <div className="fruit-edit-price-wrapper">
                        <DollarSign className="h-4 w-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="price-input"
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          className="fruit-edit-input price-input"
                          placeholder="e.g. 5.00"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Characteristics */}
                <div className="fruit-edit-section">
                  <div className="fruit-edit-section-header">
                    <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
                    <h2>Characteristics</h2>
                  </div>
                  <div className="fruit-edit-section-divider"></div>
                  <div className="fruit-edit-section-fields grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="fruit-edit-field-group">
                      <label htmlFor="flavor-input" className="fruit-edit-field-label">Flavor Profile</label>
                      <input
                        id="flavor-input"
                        type="text"
                        name="flavor"
                        value={formData.flavor}
                        onChange={handleInputChange}
                        className="fruit-edit-input"
                        placeholder="e.g. Sweet and refreshing"
                      />
                    </div>
                    <div className="fruit-edit-field-group">
                      <label htmlFor="texture-input" className="fruit-edit-field-label">Texture</label>
                      <input
                        id="texture-input"
                        type="text"
                        name="texture"
                        value={formData.texture}
                        onChange={handleInputChange}
                        className="fruit-edit-input"
                        placeholder="e.g. Grainy"
                      />
                    </div>
                    <div className="fruit-edit-field-group">
                      <label htmlFor="season-input" className="fruit-edit-field-label">Best Season</label>
                      <input
                        id="season-input"
                        type="text"
                        name="season"
                        value={formData.season}
                        onChange={handleInputChange}
                        className="fruit-edit-input"
                        placeholder="e.g. Summer"
                      />
                    </div>
                    <div className="fruit-edit-field-group">
                      <label htmlFor="bestFor-input" className="fruit-edit-field-label">Perfect For</label>
                      <input
                        id="bestFor-input"
                        type="text"
                        name="bestFor"
                        value={formData.bestFor}
                        onChange={handleInputChange}
                        className="fruit-edit-input"
                        placeholder="e.g. Hydration and fruit salads"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Appearance */}
                <div className="fruit-edit-section">
                  <div className="fruit-edit-section-header">
                    <Utensils className="h-4.5 w-4.5 text-emerald-600" />
                    <h2>Appearance Colors</h2>
                  </div>
                  <div className="fruit-edit-section-divider"></div>
                  <div className="fruit-edit-section-fields flex flex-col gap-6">
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
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="fruit-detail-header-container">
                <div className="fruit-detail-title-section">
                  <h1 className="fruit-detail-title">{fruit.name}</h1>
                  <div className="fruit-detail-origin-container">
                    <MapPin className="h-4 w-4" />
                    <span>{fruit.origin}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="btn-edit-action">
                    <Edit2 className="h-4 w-4" /> Edit
                  </Button>
                  <Button onClick={() => setShowDeleteModal(true)} variant="outline" className="btn-delete-action">
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>

              {/* Details Grid */}
              <div className="fruit-detail-grid">
                <DetailItem icon={Tag} label="Flavor Profile" value={fruit.flavor} />
                <DetailItem icon={Sparkles} label="Texture" value={fruit.texture} />
                <DetailItem icon={Calendar} label="Best Season" value={fruit.season} />
                <DetailItem icon={Utensils} label="Perfect For" value={fruit.bestFor} />
                <DetailItem icon={DollarSign} label="Estimated Price" value={`$${fruit.price.toFixed(2)}`} />
              </div>

              {/* Color section */}
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
            </>
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

      {/* Custom Delete Modal */}
      {showDeleteModal && (
        <div className={`custom-modal-overlay ${isClosingDelete ? "is-closing" : ""}`} onClick={closeDeleteModal}>
          <div className={`custom-modal-card ${isClosingDelete ? "is-closing" : ""}`} onClick={(e) => e.stopPropagation()}>
            <div className="custom-modal-icon-container">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="custom-modal-title">Delete {fruit.name}?</h3>
            <p className="custom-modal-text">
              Are you sure you want to delete this fruit? This action is permanent and cannot be undone.
            </p>
            <div className="custom-modal-actions">
              <button 
                onClick={closeDeleteModal}
                className="custom-modal-btn-cancel"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="custom-modal-btn-delete"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="fruit-spinner"></span>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Fruit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="fruit-detail-item">
    <div className="fruit-detail-item-label">
      <Icon className="h-4 w-4" />
      {label}
    </div>
    <div className="fruit-detail-item-value">{value}</div>
  </div>
);

export default FruitDetailPage;
