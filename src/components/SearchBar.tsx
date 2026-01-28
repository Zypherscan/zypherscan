import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useZcashAPI } from "@/hooks/useZcashAPI";
import { useToast } from "@/hooks/use-toast";

interface SearchBarProps {
  variant?: "default" | "header";
  setIsMobileMenuOpen?: any;
}

export const SearchBar = ({
  variant = "default",
  setIsMobileMenuOpen,
}: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { searchBlockchain } = useZcashAPI();
  const { toast } = useToast();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen && setIsMobileMenuOpen(false);
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
        } else if (result.type === "address") {
          // Navigate to address details page
          navigate(`/address/${result.result.address}`);
          toast({
            title: "Address Found",
            description: `Navigating to address details`,
          });
        }
        setSearchQuery("");
      } else {
        toast({
          title: "Not Found",
          description:
            "No results found for this query. Try a block height, block hash, transaction ID, or address.",
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

  const isHeader = variant === "header";

  return (
    <form
      onSubmit={handleSearch}
      className={`w-full mx-auto ${isHeader ? "max-w-md" : "max-w-3xl"}`}
    >
      <div className="relative group">
        <Search
          className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-accent z-10 ${
            isHeader ? "h-4 w-4" : "h-5 w-5"
          }`}
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder={
            isHeader
              ? "Search block / tx / addr..."
              : "Search by block height, block hash, transaction ID, or address..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={loading}
          className={`${
            isHeader
              ? "pl-10 pr-16 py-2 h-10 text-sm bg-muted/50 border-accent/10 focus:border-accent/40"
              : "pl-12 pr-32 py-6 text-sm bg-card/50 backdrop-blur-sm border-accent/20 focus:border-accent"
          } font-mono transition-all`}
        />
        {isHeader && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none">
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        )}
        <Button
          type="submit"
          disabled={loading || !searchQuery.trim()}
          className={`absolute right-1 top-1/2 transform -translate-y-1/2 bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50 ${
            isHeader ? "h-8 w-8 p-0 min-w-0" : ""
          }`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-foreground" />
          ) : isHeader ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <>
              Search
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
      {!isHeader && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          Enter a block height (e.g., 2500000), block hash, transaction ID, or
          address to search
        </p>
      )}
    </form>
  );
};
