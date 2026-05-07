import { Search, Loader2 } from "lucide-react";
import { Button } from "./ui/Button";

const SearchBar = ({ value, onChange, onSearch, loading, placeholder, className, buttonClassName }) => {
  const handleKey = (e) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <div className={`relative flex items-center gap-2 w-full max-w-2xl mx-auto pl-6 pr-2 py-2 transition-all rounded-full z-50 ${className}`}>
      <Search className="h-5 w-5 text-muted-foreground shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder || "Search for fruits..."}
        className="flex-1 bg-transparent border-none outline-none py-3 text-base text-current placeholder:text-muted-foreground focus:ring-0"
      />
      <Button
        onClick={onSearch}
        disabled={loading || !value.trim()}
        className={`rounded-full hover:opacity-90 font-bold px-6 h-11 border-none ${buttonClassName || "bg-gradient-primary text-primary-foreground"}`}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
      </Button>
    </div>
  );
};

export default SearchBar;
