const SimilarityBar = ({ value, highlight, type = "fruit" }) => {
  // value is now 0-100 from BE
  const normalizedValue = Math.min(Math.max(value, 0), 100);

  const gradientClass = type === "visual" ? "bg-gradient-visual" : "bg-gradient-fruit";

  return (
    <div className="w-full">
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-out rounded-full ${
            highlight ? `${gradientClass} shadow-glow` : `${gradientClass}`
          }`}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
};

export default SimilarityBar;
