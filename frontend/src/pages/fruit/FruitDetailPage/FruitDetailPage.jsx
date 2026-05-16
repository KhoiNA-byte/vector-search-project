import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fruitService } from "../../../services/fruitService.js";
import { ArrowLeft, Edit2, Trash2, Check, X, MapPin, Calendar, Sparkles, Tag, Utensils, DollarSign } from "lucide-react";
import { Button } from "../../../components/ui/Button.jsx";
import "./FruitDetailPage.css";

const FruitDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fruit, setFruit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchFruit();
  }, [id]);

  const fetchFruit = async () => {
    setLoading(true);
    try {
      const data = await fruitService.getFruit(id);
      // Data now comes directly as the fruit object
      setFruit(data);
      setFormData(data);
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
      await fruitService.updateFruit(id, formData);
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

  if (loading) return <div className="fruit-page-container flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>;
  if (error) return <div className="fruit-page-container flex flex-col items-center justify-center text-destructive"><p>Error: {error}</p><Button onClick={() => navigate("/fruit")} className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Search</Button></div>;
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

        <div className="fruit-detail-card">
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
                <h1 className="fruit-detail-title">
                  {fruit.name}
                </h1>
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
            <DetailItem
              icon={Tag} 
              label="Flavor Profile" 
              name="flavor" 
              value={fruit.flavor} 
              isEditing={isEditing} 
              editValue={formData?.flavor} 
              onChange={handleInputChange} 
            />
            <DetailItem 
              icon={Sparkles} 
              label="Texture" 
              name="texture" 
              value={fruit.texture} 
              isEditing={isEditing} 
              editValue={formData?.texture} 
              onChange={handleInputChange} 
            />
            <DetailItem 
              icon={Calendar} 
              label="Best Season" 
              name="season" 
              value={fruit.season} 
              isEditing={isEditing} 
              editValue={formData?.season} 
              onChange={handleInputChange} 
            />
            <DetailItem 
              icon={Utensils} 
              label="Perfect For" 
              name="bestFor" 
              value={fruit.bestFor} 
              isEditing={isEditing} 
              editValue={formData?.bestFor} 
              onChange={handleInputChange} 
            />
            <DetailItem 
              icon={Sparkles} 
              label="Color" 
              name="color" 
              value={fruit.color} 
              isEditing={isEditing} 
              editValue={formData?.color} 
              onChange={handleInputChange} 
            />
            <DetailItem 
              icon={DollarSign} 
              label="Estimated Price" 
              name="price" 
              value={`$${fruit.price.toFixed(2)}`} 
              isEditing={isEditing} 
              editValue={formData?.price} 
              onChange={handleInputChange} 
              type="number"
            />
          </div>

          {/* Ambient Background Element */}
          <div className="fruit-detail-ambient-bg" />
        </div>
      </div>
    </main>
  );
};

const DetailItem = ({ icon: Icon, label, value, name, isEditing, editValue, onChange, type="text" }) => (
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

