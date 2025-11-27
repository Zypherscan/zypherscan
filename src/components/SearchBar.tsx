import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          type="text"
          placeholder="Search by block height, transaction hash, or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 pr-32 py-6 text-lg bg-card/50 backdrop-blur-sm border-accent/20 focus:border-accent font-mono"
        />
        <Button 
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Search
        </Button>
      </div>
    </form>
  );
};
