import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fruitService } from "../../../services/fruitService.js";
import { ArrowLeft, MapPin, Calendar, Sparkles, Tag, Utensils, DollarSign, Check } from "lucide-react";
import ColorPicker from "../../../components/ui/ColorPicker.jsx";
import { joinColors } from "../../../lib/colorUtils.js";
import "./FruitCreatePage.css";

const FruitCreatePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    origin: "",
    flavor: "",
    texture: "",
    season: "",
    bestFor: "",
    price: 0,
  });
  const [outsideColors, setOutsideColors] = useState([]);
  const [insideColors, setInsideColors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "price" ? parseFloat(value) || 0 : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fruitService.createFruit({
        ...formData,
        colorOutside: joinColors(outsideColors),
        colorInside:  joinColors(insideColors),
      });
      navigate("/fruit");
    } catch (err) {
      alert("Creation failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="fruit-create-container">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={() => navigate("/fruit")}
          className="back-pill-button"
        >
          <ArrowLeft className="h-4 w-4 transition-transform" />
          <span>Back to Fruits</span>
        </button>

        <div className="fruit-create-card-container">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="fruit-create-header">
              <div className="fruit-create-title-group">
                <h1 className="fruit-create-hero-title">{formData.name || "Add New Fruit"}</h1>
                <span className="fruit-create-hero-subtitle">
                  {formData.origin ? `Origin: ${formData.origin}` : "Create a new entry in the fruit directory"}
                </span>
                <div className="fruit-create-metadata">
                  <span className="fruit-create-badge">New Profile</span>
                </div>
              </div>

              <div className="fruit-create-actions">
                <button
                  type="button"
                  onClick={() => navigate("/fruit")}
                  className="fruit-create-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="fruit-create-btn-save"
                >
                  {isSubmitting ? (
                    <>
                      <span className="fruit-spinner"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Create Fruit
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sections */}
            <div className="fruit-create-sections-list">
              {/* Section 1: Basic Information */}
              <div className="fruit-create-section">
                <div className="fruit-create-section-header">
                  <Tag className="h-4.5 w-4.5 text-emerald-600" />
                  <h2>Basic Information</h2>
                </div>
                <div className="fruit-create-section-divider"></div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="fruit-create-field-group">
                    <label className="fruit-create-field-label" htmlFor="name">Fruit Name</label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Persimmon"
                      className="fruit-create-input"
                      required
                    />
                  </div>

                  <div className="fruit-create-field-group">
                    <label className="fruit-create-field-label" htmlFor="origin">Region of Origin</label>
                    <input
                      id="origin"
                      type="text"
                      name="origin"
                      value={formData.origin}
                      onChange={handleInputChange}
                      placeholder="e.g. East Asia"
                      className="fruit-create-input"
                    />
                  </div>

                  <div className="fruit-create-field-group">
                    <label className="fruit-create-field-label" htmlFor="price">Estimated Price ($)</label>
                    <div className="fruit-create-price-wrapper">
                      <DollarSign className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="price"
                        type="number"
                        step="0.01"
                        name="price"
                        value={formData.price || ""}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="fruit-create-input price-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Characteristics */}
              <div className="fruit-create-section">
                <div className="fruit-create-section-header">
                  <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
                  <h2>Characteristics</h2>
                </div>
                <div className="fruit-create-section-divider"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="fruit-create-field-group">
                    <label className="fruit-create-field-label" htmlFor="flavor">Flavor Profile</label>
                    <input
                      id="flavor"
                      type="text"
                      name="flavor"
                      value={formData.flavor}
                      onChange={handleInputChange}
                      placeholder="e.g. Sweet and honey-like"
                      className="fruit-create-input"
                    />
                  </div>

                  <div className="fruit-create-field-group">
                    <label className="fruit-create-field-label" htmlFor="texture">Texture</label>
                    <input
                      id="texture"
                      type="text"
                      name="texture"
                      value={formData.texture}
                      onChange={handleInputChange}
                      placeholder="e.g. Soft or crispy"
                      className="fruit-create-input"
                    />
                  </div>

                  <div className="fruit-create-field-group">
                    <label className="fruit-create-field-label" htmlFor="season">Best Season</label>
                    <input
                      id="season"
                      type="text"
                      name="season"
                      value={formData.season}
                      onChange={handleInputChange}
                      placeholder="e.g. Autumn"
                      className="fruit-create-input"
                    />
                  </div>

                  <div className="fruit-create-field-group">
                    <label className="fruit-create-field-label" htmlFor="bestFor">Perfect For</label>
                    <input
                      id="bestFor"
                      type="text"
                      name="bestFor"
                      value={formData.bestFor}
                      onChange={handleInputChange}
                      placeholder="e.g. Eating fresh, baking"
                      className="fruit-create-input"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Appearance Colors */}
              <div className="fruit-create-section">
                <div className="fruit-create-section-header">
                  <Utensils className="h-4.5 w-4.5 text-emerald-600" />
                  <h2>Appearance Colors</h2>
                </div>
                <div className="fruit-create-section-divider"></div>

                <div className="flex flex-col gap-6">
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
          </form>
        </div>
      </div>
    </main>
  );
};

export default FruitCreatePage;
