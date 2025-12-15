import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  MessageSquare,
  ExternalLink,
  Clock,
} from "lucide-react";
import { DecryptedTransaction, formatZEC } from "@/lib/zcash-crypto";
import { useFilteredTransactions } from "@/hooks/useWalletData";
import { toast } from "sonner";

interface TransactionListProps {
  transactions: DecryptedTransaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "incoming" | "outgoing" | "internal"
  >("all");
  const [poolFilter, setPoolFilter] = useState<"all" | "sapling" | "orchard">(
    "all"
  );
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [copiedTxid, setCopiedTxid] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const filteredTransactions = useFilteredTransactions(transactions, {
    type: typeFilter,
    pool: poolFilter,
    searchQuery,
  });

  const handleCopyTxid = async (txid: string) => {
    await navigator.clipboard.writeText(txid);
    setCopiedTxid(txid);
    toast.success("Transaction ID copied");
    setTimeout(() => setCopiedTxid(null), 2000);
  };

  const getTypeIcon = (type: DecryptedTransaction["type"]) => {
    switch (type) {
      case "incoming":
        return <ArrowDownRight className="w-4 h-4 text-terminal-green" />;
      case "outgoing":
        return <ArrowUpRight className="w-4 h-4 text-red-400" />;
      case "internal":
        return <ArrowLeftRight className="w-4 h-4 text-purple-400" />;
    }
  };

  const getTypeBadge = (type: DecryptedTransaction["type"]) => {
    const variants = {
      incoming:
        "bg-terminal-green/20 text-terminal-green border-terminal-green/30",
      outgoing: "bg-red-400/20 text-red-400 border-red-400/30",
      internal: "bg-purple-400/20 text-purple-400 border-purple-400/30",
    };
    return (
      <Badge variant="outline" className={variants[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getPoolBadge = (pool: DecryptedTransaction["pool"]) => {
    const variants = {
      orchard: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      sapling: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      transparent: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    };
    return (
      <Badge variant="outline" className={variants[pool]}>
        {pool.charAt(0).toUpperCase() + pool.slice(1)}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Today at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (days === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  return (
    <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Transaction History</h2>
            <p className="text-sm text-muted-foreground">
              {filteredTransactions.length} of {transactions.length}{" "}
              transactions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-secondary border-accent/20"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={
                showFilters ? "bg-accent/10 border-accent" : "border-accent/30"
              }
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Type:</span>
              <Select
                value={typeFilter}
                onValueChange={(v: any) => setTypeFilter(v)}
              >
                <SelectTrigger className="w-32 bg-secondary border-accent/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="incoming">Incoming</SelectItem>
                  <SelectItem value="outgoing">Outgoing</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Pool:</span>
              <Select
                value={poolFilter}
                onValueChange={(v: any) => setPoolFilter(v)}
              >
                <SelectTrigger className="w-32 bg-secondary border-accent/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pools</SelectItem>
                  <SelectItem value="orchard">Orchard</SelectItem>
                  <SelectItem value="sapling">Sapling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-border">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p>No transactions found</p>
          </div>
        ) : (
          filteredTransactions.slice(0, visibleCount).map((tx) => (
            <Collapsible
              key={tx.txid}
              open={expandedTx === tx.txid}
              onOpenChange={(open) => setExpandedTx(open ? tx.txid : null)}
            >
              <CollapsibleTrigger asChild>
                <div className="p-4 hover:bg-secondary/50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    {/* Left side */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        {getTypeIcon(tx.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeBadge(tx.type)}
                          {getPoolBadge(tx.pool)}
                          {tx.memo && (
                            <MessageSquare className="w-3 h-3 text-accent" />
                          )}
                        </div>
                        <p className="font-mono text-sm text-muted-foreground truncate">
                          {tx.txid.slice(0, 16)}...{tx.txid.slice(-8)}
                        </p>
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p
                          className={`font-mono font-semibold ${
                            tx.type === "incoming"
                              ? "text-terminal-green"
                              : tx.type === "outgoing"
                              ? "text-red-400"
                              : "text-foreground"
                          }`}
                        >
                          {tx.type === "incoming"
                            ? "+"
                            : tx.type === "outgoing"
                            ? ""
                            : ""}
                          {formatZEC(tx.amount)} ZEC
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(tx.timestamp)}
                        </p>
                      </div>
                      {expandedTx === tx.txid ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                    {/* Transaction ID */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Transaction ID
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm truncate max-w-[300px]">
                          {tx.txid}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyTxid(tx.txid)}
                        >
                          {copiedTxid === tx.txid ? (
                            <Check className="w-3 h-3 text-terminal-green" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Block Height */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Block Height
                      </span>
                      <span className="font-mono text-sm">
                        {tx.height.toLocaleString()}
                      </span>
                    </div>

                    {/* Confirmations */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Confirmations
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          (tx.confirmations || 0) < 10
                            ? "border-yellow-400/30 text-yellow-400"
                            : "border-terminal-green/30 text-terminal-green"
                        }
                      >
                        {(tx.confirmations || 0).toLocaleString()}
                      </Badge>
                    </div>

                    {/* Fee (for outgoing) */}
                    {tx.fee && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Fee
                        </span>
                        <span className="font-mono text-sm">
                          {formatZEC(tx.fee)} ZEC
                        </span>
                      </div>
                    )}

                    {/* Memo */}
                    {tx.memo && (
                      <div className="pt-2 border-t border-border">
                        <span className="text-sm text-muted-foreground block mb-2">
                          Memo
                        </span>
                        <div className="bg-background/50 rounded p-3 border border-accent/10">
                          <p className="text-sm whitespace-pre-wrap break-words font-mono">
                            {tx.memo}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Address (if available) */}
                    {tx.address && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Address
                        </span>
                        <span className="font-mono text-xs truncate max-w-[250px]">
                          {tx.address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </div>

      {/* Load More */}
      {visibleCount < filteredTransactions.length && (
        <div className="p-4 border-t border-border text-center">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((v) => v + 10)}
            className="border-accent/30"
          >
            Load More ({filteredTransactions.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </Card>
  );
}
