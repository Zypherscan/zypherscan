import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useZcashAPI } from "@/hooks/useZcashAPI";
import { useToast } from "@/hooks/use-toast";

export const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { searchBlockchain } = useZcashAPI();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const result = await searchBlockchain(searchQuery.trim());

      if (result.success) {
        if (result.type === "block") {
          // Navigate to block details page
          const blockId = result.result.height || result.result.hash;
          navigate(`/block/${blockId}`);
          toast({
            title: "Block Found",
            description: `Navigating to block #${
              result.result.height?.toLocaleString() || "details"
            }`,
          });
        } else if (result.type === "transaction") {
          // Navigate to transaction details page
          navigate(`/tx/${result.result.txid}`);
          toast({
            title: "Transaction Found",
            description: `Navigating to transaction details`,
          });
        }
        setSearchQuery("");
      } else {
        toast({
          title: "Not Found",
          description:
            "No results found for this query. Try a block height, block hash, or transaction ID.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Unable to search. Please check your query and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-accent" />
        <Input
          type="text"
          placeholder="Search by block height, block hash, or transaction ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={loading}
          className="pl-12 pr-32 py-6 text-lg bg-card/50 backdrop-blur-sm border-accent/20 focus:border-accent font-mono transition-all"
        />
        <Button
          type="submit"
          disabled={loading || !searchQuery.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-foreground mr-2" />
              Searching
            </>
          ) : (
            <>
              Search
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-3">
        Enter a block height (e.g., 2500000), block hash, or transaction ID to
        search
      </p>
    </form>
  );
};
