import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import {
  Wallet,
  LogOut,
  Menu,
  ChevronDown,
  Activity,
  Box,
  Shield,
  FileText,
  Settings,
  LayoutDashboard,
  Copy,
  Globe,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNetwork } from "@/contexts/NetworkContext";
import { GiReceiveMoney } from "react-icons/gi";
import { FaTelegram } from "react-icons/fa";
import { SupportDialog } from "@/components/SupportDialog";
import { ModeToggle } from "@/components/mode-toggle";

interface LayoutProps {
  children: ReactNode;
}

import { NetworkActivityBanner } from "@/components/NetworkActivityBanner";
import { InstallZucchiniBanner } from "@/components/InstallZucchiniBanner";
import { MatrixBackground } from "@/components/MatrixBackground";

export const Layout = ({ children }: LayoutProps) => {
  const { isConnected, viewingKey, disconnect, login } = useAuth();
  const { network, setNetwork, zecPrice: contextZecPrice } = useNetwork();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  // Use price from NetworkContext (already fetched there) - map to expected format
  const zecPrice = contextZecPrice
    ? { usd: contextZecPrice.usd, usd_24h_change: contextZecPrice.change24h }
    : null;

  const handleConnect = async () => {
    if (window.zucchini) {
      try {
        // 1. Establish connection
        const connectResult = await window.zucchini.request({
          method: "connect",
          params: { permissions: ["view_keys"] },
        });

        // 2. Fetch the viewing key
        const result = await window.zucchini.request({
          method: "getUniversalViewingKey",
        });

        if (result) {
          if (result.error) {
            throw new Error(result.error);
          }
          // Handle both simple string response or object with viewingKey property
          const key = typeof result === "string" ? result : result.viewingKey;

          if (key) {
            login(key, 3150000); // Using the user's preferred default
            toast({
              title: "Wallet Connected",
              description: "Connected to Zucchini wallet successfully",
            });
            navigate("/dashboard");
          }
        }
      } catch (error) {
        console.error("Connection failed", error);
        toast({
          title: "Connection Failed",
          description: "Could not connect to Zucchini wallet",
          variant: "destructive",
        });
      }
    } else {
      navigate("/auth");
    }
    setIsMobileMenuOpen(false);
  };

  const truncateKey = (key: string | null) => {
    if (!key) return "Connected";
    return `${key.slice(0, 8)}...${key.slice(-4)}`;
  };

  const handleDisconnect = async () => {
    navigate("/");

    if (window.zucchini) {
      try {
        await window.zucchini.request({ method: "disconnect" });
      } catch (e) {
        console.warn("Failed to disconnect from Zucchini wallet:", e);
      }
    }

    disconnect();
  };

  const isActive = (path: string) => {
    return location.pathname === path
      ? "text-accent"
      : "text-muted-foreground hover:text-foreground";
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col overflow-x-hidden relative">
      {/* Matrix Background - Global */}
      <MatrixBackground opacity={0.1} />

      {/* Full-width Zucchini Banner at the very top */}
      <div className="hidden md:block relative z-10">
        <InstallZucchiniBanner />
      </div>

      <div className="w-full bg-background/60 backdrop-blur-md text-foreground py-1 border-b border-white/5 relative z-10">
        <div className="container mx-auto px-4">
          {/* Desktop Layout: 3 columns */}
          <div className="hidden md:grid md:grid-cols-3 h-8 items-center text-[10px] md:text-xs font-bold uppercase tracking-tight">
            {/* Left: Live Status + ZEC Price */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse-live shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                <span className="text-muted-foreground">Live</span>
              </div>
              {zecPrice ? (
                <div className="flex items-center gap-1.5 border-l border-border/40 pl-3">
                  <span className="font-mono text-foreground">
                    ${zecPrice.usd.toFixed(2)}
                  </span>
                  <div
                    className={`flex items-center ${zecPrice.usd_24h_change >= 0 ? "text-terminal-green" : "text-red-500"}`}
                  >
                    {zecPrice.usd_24h_change >= 0 ? (
                      <TrendingUp className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5" />
                    )}
                    <span>{Math.abs(zecPrice.usd_24h_change).toFixed(1)}%</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 border-l border-border/40 pl-3">
                  <div className="h-3 w-14 bg-muted-foreground/20 rounded animate-pulse" />
                  <div className="h-3 w-8 bg-muted-foreground/20 rounded animate-pulse" />
                </div>
              )}
            </div>

            {/* Center: Network Activity */}
            <div className="flex justify-center">
              <NetworkActivityBanner variant="minimal" />
            </div>

            {/* Right: Support */}
            <div className="flex justify-end">
              <SupportDialog>
                <button className="text-xs font-bold hover:text-accent transition-colors flex items-center gap-1.5">
                  <span>SUPPORT US</span>
                  <GiReceiveMoney className="w-3.5 h-3.5" />
                </button>
              </SupportDialog>
            </div>
          </div>

          {/* Mobile Layout: 2 rows */}
          <div className="md:hidden flex flex-col gap-1 py-1">
            {/* Row 1: Live Status + ZEC Price + Support */}
            <div className="h-6 flex items-center justify-between text-xs font-bold uppercase tracking-tight">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse-live shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                  <span className="text-muted-foreground">Live</span>
                </div>
                {zecPrice ? (
                  <div className="flex items-center gap-1.5 border-l border-border/40 pl-2">
                    <span className="font-mono text-foreground">
                      ${zecPrice.usd.toFixed(2)}
                    </span>
                    <div
                      className={`flex items-center ${zecPrice.usd_24h_change >= 0 ? "text-terminal-green" : "text-red-500"}`}
                    >
                      {zecPrice.usd_24h_change >= 0 ? (
                        <TrendingUp className="w-2.5 h-2.5" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5" />
                      )}
                      <span>
                        {Math.abs(zecPrice.usd_24h_change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 border-l border-border/40 pl-2">
                    <div className="h-3 w-14 bg-muted-foreground/20 rounded animate-pulse" />
                    <div className="h-3 w-8 bg-muted-foreground/20 rounded animate-pulse" />
                  </div>
                )}
              </div>
              <div>
                <SupportDialog>
                  <button className="text-xs font-bold hover:text-accent transition-colors flex items-center gap-1.5">
                    <span>SUPPORT</span>
                    <GiReceiveMoney className="w-3.5 h-3.5" />
                  </button>
                </SupportDialog>
              </div>
            </div>

            {/* Row 2: Network Stats (Shielded/Unshielded) */}
            <div className="h-6 flex items-center justify-center w-full text-xs font-medium">
              <NetworkActivityBanner variant="minimal" />
            </div>
          </div>
        </div>
      </div>

      <header className="border-b border-white/5 bg-background/80 backdrop-blur-xl relative z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-8 h-8 transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-accent/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-lg font-bold tracking-tighter text-foreground group-hover:text-accent transition-colors">
                ZYPHERSCAN
              </span>
            </Link>
            {/* Network Badge */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 cursor-pointer hover:bg-accent/20 transition-colors">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      network === "mainnet"
                        ? "bg-terminal-green"
                        : "bg-yellow-500"
                    } animate-pulse`}
                  />
                  <span className="text-xs font-medium text-accent uppercase">
                    {network}
                  </span>
                  <ChevronDown className="w-3 h-3 text-accent opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="bg-popover border-border/20"
              >
                <DropdownMenuItem onClick={() => setNetwork("mainnet")}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-terminal-green" />
                    <span>Mainnet</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNetwork("testnet")}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    <span>Testnet</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search Bar (Header) */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <SearchBar variant="header" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  Tools <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-popover border-border/20"
              >
                {network === "mainnet" && (
                  <DropdownMenuItem onClick={() => navigate("/zecflow")}>
                    ZEC Flow
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate("/mempool")}>
                  Mempool
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/network")}>
                  Network Stats
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/blocks")}>
                  Recent Blocks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/privacy")}>
                  Privacy Stats
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/decrypt")}>
                  Decrypt Tool
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ModeToggle />

            {isConnected ? (
              <div className="flex items-center gap-4">
                {network === "mainnet" && (
                  <>
                    <Link
                      to="/dashboard"
                      className={`text-sm font-medium ${isActive("/dashboard")}`}
                    >
                      Dashboard
                    </Link>
                    <div className="h-4 w-px bg-border/30" />
                  </>
                )}
                <div className="flex items-center gap-2 pl-2">
                  <span className="text-xs font-mono text-muted-foreground bg-accent/5 px-2 py-1 rounded border border-accent/10">
                    {truncateKey(viewingKey)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDisconnect}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : network === "mainnet" ? (
              <Button
                size="sm"
                onClick={handleConnect}
                className="bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 h-9 px-4"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect
              </Button>
            ) : null}
          </nav>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-muted-foreground hover:text-foreground"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[400px] border-l border-border/20 bg-background p-0"
            >
              <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
              <div className="flex flex-col h-full bg-background">
                <div className="p-6 pt-12 border-b border-border/10">
                  <div className="flex items-center gap-2 mb-6">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                    <span className="text-xl font-bold tracking-wide text-foreground flex-1">
                      ZYPHERSCAN
                    </span>
                    <div className="md:hidden mr-2">
                      <ModeToggle />
                    </div>
                  </div>

                  {/* Network Selector Mobile */}
                  <div className="flex bg-muted/50 rounded-lg p-1 border border-border/20 mb-4">
                    <button
                      onClick={() => setNetwork("mainnet")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                        network === "mainnet"
                          ? "bg-terminal-green/10 text-terminal-green shadow-sm border border-terminal-green/20"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          network === "mainnet"
                            ? "bg-terminal-green"
                            : "bg-muted-foreground"
                        }`}
                      />
                      Mainnet
                    </button>
                    <button
                      onClick={() => setNetwork("testnet")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                        network === "testnet"
                          ? "bg-yellow-500/10 text-yellow-500 shadow-sm border border-yellow-500/20"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          network === "testnet"
                            ? "bg-yellow-500"
                            : "bg-muted-foreground"
                        }`}
                      />
                      Testnet
                    </button>
                  </div>

                  <SearchBar
                    variant="header"
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                  />
                </div>

                <ScrollArea className="flex-1 py-4">
                  <div className="px-3 space-y-1">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Tools
                    </div>
                    {network === "mainnet" && (
                      <button
                        onClick={() => {
                          navigate("/zecflow");
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-accent/5 rounded-md transition-colors text-left"
                      >
                        <Globe className="w-4 h-4 text-accent" />
                        ZEC Flow
                      </button>
                    )}
                    {network === "mainnet" && (
                      <button
                        onClick={() => {
                          navigate("/dashboard");
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-accent/5 rounded-md transition-colors text-left"
                      >
                        <LayoutDashboard className="w-4 h-4 text-accent" />
                        Dashboard
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigate("/mempool");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-accent/5 rounded-md transition-colors text-left"
                    >
                      <Activity className="w-4 h-4 text-accent" />
                      Mempool
                    </button>
                    <button
                      onClick={() => {
                        navigate("/network");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-accent/5 rounded-md transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-accent" />
                      Network Stats
                    </button>
                    <button
                      onClick={() => {
                        navigate("/blocks");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-accent/5 rounded-md transition-colors text-left"
                    >
                      <Box className="w-4 h-4 text-accent" />
                      Recent Blocks
                    </button>
                    <button
                      onClick={() => {
                        navigate("/privacy");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-accent/5 rounded-md transition-colors text-left"
                    >
                      <Shield className="w-4 h-4 text-accent" />
                      Privacy Stats
                    </button>
                    <button
                      onClick={() => {
                        navigate("/decrypt");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-accent/5 rounded-md transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-accent" />
                      Decrypt Tool
                    </button>
                  </div>
                </ScrollArea>

                <div className="p-6 border-t border-border/10 bg-muted/20">
                  {isConnected ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                        <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                          <Wallet className="w-4 h-4 text-accent" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            Connected Wallet
                          </span>
                          <span className="text-sm font-mono font-medium text-foreground">
                            {truncateKey(viewingKey)}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          handleDisconnect();
                          setIsMobileMenuOpen(false);
                        }}
                        variant="destructive"
                        className="w-full justify-start bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  ) : network === "mainnet" ? (
                    <Button
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={handleConnect}
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  ) : null}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 relative z-10">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/20 relative z-10">
        <div className="container px-6 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex items-center gap-4 justify-center w-full">
              <img src="/logo.png" alt="Logo" className="w-10 h-10" />
              <div>
                <p className="font-semibold text-lg">Zypherscan</p>
                <p className="text-sm text-muted-foreground">
                  Privacy-first blockchain explorer
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8 text-sm text-muted-foreground w-full justify-center items-center">
              <div className="flex gap-6 md:gap-8 items-center">
                <Link to="/" className="hover:text-accent transition-colors">
                  Home
                </Link>
                <Link
                  to="/blocks"
                  className="hover:text-accent transition-colors"
                >
                  Blocks
                </Link>
                <Link
                  to="/network"
                  className="hover:text-accent transition-colors"
                >
                  Network
                </Link>
                <Link
                  to="/privacy"
                  className="hover:text-accent transition-colors"
                >
                  Privacy
                </Link>
              </div>

              <div className="hidden md:block h-4 w-px bg-border/40" />

              <div className="flex gap-6 md:gap-8 items-center">
                <a
                  href="https://discord.gg/rHmDNMgpcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors flex items-center gap-1.5"
                >
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.764-.604 1.15a18.368 18.368 0 0 0-4.707 0c-.16-.386-.401-.775-.61-1.15a.077.077 0 0 0-.08-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Discord
                </a>
                <a
                  href="https://x.com/zypherscan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors flex items-center gap-1.5"
                >
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                  </svg>
                  Twitter
                </a>
                <a
                  href="https://t.me/zypherscan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors flex items-center gap-1.5"
                >
                  <FaTelegram className="w-4 h-4" />
                  Telegram
                </a>

                <SupportDialog>
                  <button className="hover:text-accent transition-colors flex items-center gap-1.5">
                    <GiReceiveMoney className="w-6 h-6" />
                    Support
                  </button>
                </SupportDialog>
              </div>
            </div>

            <div className="text-center md:text-right w-full">
              <p className="text-sm text-muted-foreground">© 2025 Zypherscan</p>
              <p className="text-xs font-mono text-muted-foreground mt-1 opacity-60">
                Built with ❤️ by Zypherscan
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
