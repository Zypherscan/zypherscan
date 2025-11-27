import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useZcashAPI } from "@/hooks/useZcashAPI";
import { useToast } from "@/hooks/use-toast";

export const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { searchBlockchain } = useZcashAPI();
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const result = await searchBlockchain(searchQuery.trim());
      console.log("Search result:", result);
      
      if (result.success) {
        toast({
          title: "Found!",
          description: `Found ${result.type}: ${result.result.hash || result.result.height}`,
        });
      } else {
        toast({
          title: "Not Found",
          description: "No results found for this query",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Unable to search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
          disabled={loading}
          className="pl-12 pr-32 py-6 text-lg bg-card/50 backdrop-blur-sm border-accent/20 focus:border-accent font-mono"
        />
        <Button 
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>
    </form>
  );
};
