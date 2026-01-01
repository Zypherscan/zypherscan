import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWalletData } from "@/hooks/useWalletData";
import { useZcashAPI, NetworkStats, ZecPrice } from "@/hooks/useZcashAPI";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Shield,
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  ChevronRight,
  BarChart3,
  Home,
  PieChart,
  BookOpen,
  Download,
  Unlock,
  Server,
  Box,
  Globe,
  DollarSign,
  Cpu,
  CheckCircle2,
} from "lucide-react";
import { MarketStatsBanner } from "@/components/MarketStatsBanner";
import { formatZEC, formatZECWithSymbol } from "@/lib/zcash-crypto";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { PoolDistribution } from "@/components/dashboard/PoolDistribution";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { AddressBook } from "@/components/AddressBook";
import { SyncStatusCard } from "@/components/dashboard/SyncStatusCard";

import { ExportDialog } from "@/components/ExportDialog";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Dashboard = () => {
  const {
    isConnected,
    viewingKey,
    loading: authLoading,
    getBirthdayHeight,
  } = useAuth();
  const navigate = useNavigate();
  const {
    transactions,
    balance,
    analytics,
    viewingKeyInfo,
    isLoading,
    error,
    lastUpdated,
    refresh,
    syncStatus,
  } = useWalletData();

  const { getZecPrice, getNetworkStatus, getPrivacyStats } = useZcashAPI();
  const [zecPrice, setZecPrice] = useState<ZecPrice | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [privacyStats, setPrivacyStats] = useState<any | null>(null);

  const [isRescanOpen, setIsRescanOpen] = useState(false);
  const [rescanHeight, setRescanHeight] = useState("");

  useEffect(() => {
    if (!authLoading && !isConnected) {
      navigate("/auth");
    }
  }, [isConnected, authLoading, navigate]);

  useEffect(() => {
    const fetchMarketData = async () => {
      const price = await getZecPrice();
      setZecPrice(price);
      const network = await getNetworkStatus();
      setNetworkStats(network);
      const privacy = await getPrivacyStats();
      setPrivacyStats(privacy);
    };

    if (isConnected && !syncStatus.isSyncing) {
      fetchMarketData();
      const interval = setInterval(fetchMarketData, 120000); // Update every 2 minutes
      return () => clearInterval(interval);
    }
  }, [
    isConnected,
    getZecPrice,
    getNetworkStatus,
    getPrivacyStats,
    syncStatus.isSyncing,
  ]);

  const handleRescan = () => {
    if (rescanHeight) {
      localStorage.setItem("zcash_birthday_height", rescanHeight);
    } else {
      localStorage.removeItem("zcash_birthday_height");
    }
    // Clear last sync height to force rescan
    if (viewingKey) {
      localStorage.removeItem(`zcash_last_sync_${viewingKey}`);
      localStorage.removeItem(`zcash_wallet_cache_${viewingKey}`);
    }
    setIsRescanOpen(false);
    window.location.reload(); // Reload to trigger fresh sync from useWalletData
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Privacy Dashboard</h1>
            </div>
            <p className="text-muted-foreground">
              Your shielded transaction activity, unlocked with your viewing key
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated{" "}
                {lastUpdated.toLocaleString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <ExportDialog transactions={transactions} />

              <Dialog open={isRescanOpen} onOpenChange={setIsRescanOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-accent/50 text-foreground"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Rescan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rescan Blockchain</DialogTitle>
                    <DialogDescription>
                      Enter a starting block height (Birthday Height) to rescan
                      your transactions. This will clear your current sync
                      progress.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="height">Start Height</Label>
                      <Input
                        id="height"
                        type="number"
                        placeholder="e.g. 2500000"
                        value={rescanHeight}
                        onChange={(e) => setRescanHeight(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsRescanOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleRescan}>Start Rescan</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={isLoading || syncStatus.isSyncing}
                className="border-accent/50 text-foreground"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${
                    isLoading || syncStatus.isSyncing ? "animate-spin" : ""
                  }`}
                />
                {syncStatus.isSyncing ? "Syncing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </div>

        {/* Sync Status Card */}
        <SyncStatusCard />

        {/* Market & Network Stats Banner */}
        <MarketStatsBanner />

        {/* Viewing Key Info Banner */}
        {viewingKeyInfo && (
          <div className="mb-6 p-4 rounded-lg bg-accent/5 border border-accent/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  <span className="font-medium">Viewing Key</span>
                </div>
                <Badge variant="outline" className="border-accent/30">
                  {viewingKeyInfo.network === "mainnet" ? "Mainnet" : "Testnet"}
                </Badge>
                {viewingKeyInfo.components.hasOrchard && (
                  <Badge className="bg-terminal-green/20 text-terminal-green border-terminal-green/30">
                    Orchard
                  </Badge>
                )}
                {viewingKeyInfo.components.hasSapling && (
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    Sapling
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                All decryption happens locally in your browser
              </span>
            </div>
          </div>
        )}

        {/* Debug Info - Always Visible */}
        <div className="mb-6 p-4 bg-card/30 rounded-lg border border-border/50 text-xs font-mono text-muted-foreground">
          <p>Sync Status: {syncStatus.isSyncing ? "Syncing..." : "Synced"}</p>
          <p>Current Height: {syncStatus.networkHeight}</p>
          <p>Transactions Found: {transactions.length}</p>
          <p>
            Viewing Key: {viewingKey ? viewingKey.slice(0, 10) + "..." : "None"}
          </p>
          <p>Birthday Height: {getBirthdayHeight() || "Default (500k)"}</p>
          <p>Scanner Active: Yes</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-80 lg:col-span-2" />
              <Skeleton className="h-80" />
            </div>
            <Skeleton className="h-96" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Balance Cards */}
            <BalanceCard balance={balance} />

            {/* Quick Stats */}
            <QuickStats analytics={analytics} transactions={transactions} />

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AnalyticsCharts analytics={analytics} />
              </div>
              <div>
                <PoolDistribution analytics={analytics} />
              </div>
            </div>

            {/* Transaction History and Address Book Tabs */}
            <Tabs defaultValue="transactions" className="space-y-4">
              <TabsList className="bg-card/50 border border-accent/10">
                <TabsTrigger
                  value="transactions"
                  className="data-[state=active]:bg-accent/20"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Transactions
                </TabsTrigger>
                <TabsTrigger
                  value="addressbook"
                  className="data-[state=active]:bg-accent/20"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Address Book
                </TabsTrigger>
              </TabsList>
              <TabsContent value="transactions">
                <TransactionList transactions={transactions} />
              </TabsContent>
              <TabsContent value="addressbook">
                <AddressBook />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
