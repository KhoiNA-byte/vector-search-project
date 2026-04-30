import { Search, Loader2 } from "lucide-react";
import { Button } from "./ui/Button";

const SearchBar = ({ value, onChange, onSearch, loading }) => {
  const handleKey = (e) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2 bg-card rounded-full shadow-card border border-border pl-6 pr-2 py-2 transition-all focus-within:shadow-glow focus-within:border-primary/40">
        <Search className="h-5 w-5 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Search for fruits like 'sweet tropical fruit for smoothies'"
          className="flex-1 bg-transparent outline-none py-3 text-base text-foreground placeholder:text-muted-foreground"
        />
        <Button
          onClick={onSearch}
          disabled={loading || !value.trim()}
          className="rounded-full bg-gradient-primary hover:opacity-90 text-primary-foreground px-6 h-11"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;

