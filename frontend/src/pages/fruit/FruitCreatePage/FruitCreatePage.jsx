import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fruitService } from "../../../services/fruitService.js";
import { ArrowLeft, MapPin, Calendar, Sparkles, Tag, Utensils, DollarSign, Save } from "lucide-react";
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
          className="flex items-center gap-2 text-[#4a5d4a] hover:text-[#1a2e1a] transition-colors mb-8 group font-medium"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to list
        </button>

        <div className="fruit-create-card">
          <h1 className="fruit-create-title">Add New Fruit</h1>

          <form onSubmit={handleSubmit}>
            <div className="fruit-create-grid">
              <CreateField
                icon={Tag}
                label="Fruit Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Persimmon"
                required
              />
              <CreateField
                icon={MapPin}
                label="Region of Origin"
                name="origin"
                value={formData.origin}
                onChange={handleInputChange}
                placeholder="e.g. East Asia"
              />
              <CreateField
                icon={Tag}
                label="Flavor Profile"
                name="flavor"
                value={formData.flavor}
                onChange={handleInputChange}
                placeholder="e.g. Sweet and honey-like"
              />
              <CreateField
                icon={Sparkles}
                label="Texture"
                name="texture"
                value={formData.texture}
                onChange={handleInputChange}
                placeholder="e.g. Soft"
              />
              <CreateField
                icon={Calendar}
                label="Best Season"
                name="season"
                value={formData.season}
                onChange={handleInputChange}
                placeholder="e.g. Fall, Winter"
              />
              <CreateField
                icon={Utensils}
                label="Perfect For"
                name="bestFor"
                value={formData.bestFor}
                onChange={handleInputChange}
                placeholder="e.g. Baking and snacks"
              />
              <CreateField
                icon={DollarSign}
                label="Estimated Price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                type="number"
                step="0.01"
                placeholder="2.50"
              />
            </div>

            {/* ── Color pickers ───────────────────────────────────── */}
            <div className="fruit-create-colors">
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

            <div className="mt-12 flex flex-col md:flex-row gap-4 items-center justify-end relative z-10">
              <button
                type="button"
                onClick={() => navigate("/fruit")}
                className="btn-cancel-create w-full md:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-submit-create w-full md:w-auto flex items-center justify-center gap-2"
              >
                <Save />
                {isSubmitting ? "Creating..." : "Create Fruit"}
              </button>
            </div>
          </form>

          {/* Ambient Background Element */}
          <div
            className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full blur-[100px] opacity-10 pointer-events-none"
            style={{ backgroundColor: "#88a070" }}
          />
        </div>
      </div>
    </main>
  );
};

const CreateField = ({ icon: Icon, label, name, value, onChange, placeholder, type = "text", step, required = false }) => (
  <div className="fruit-create-field">
    <label className="fruit-create-label" htmlFor={name}>
      <Icon className="h-4 w-4" />
      {label}
    </label>
    <input
      id={name}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="fruit-create-input"
      step={step}
      required={required}
    />
  </div>
);

export default FruitCreatePage;
