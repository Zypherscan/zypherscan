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
} from "lucide-react";
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

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { isConnected, viewingKey, disconnect } = useAuth();
  const { network, setNetwork } = useNetwork();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const truncateKey = (key: string | null) => {
    if (!key) return "Connected";
    return `${key.slice(0, 8)}...${key.slice(-4)}`;
  };

  const handleDisconnect = () => {
    disconnect();
    navigate("/");
  };

  const isActive = (path: string) => {
    return location.pathname === path
      ? "text-accent"
      : "text-muted-foreground hover:text-foreground";
  };

  return (
    <div className="min-h-screen bg-[#0a0e13] text-foreground font-sans flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/20 bg-[#0a0e13]/95 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Logo" className="w-7 h-7" />
              <div className="flex flex-col leading-none">
                <span className="text-lg font-bold tracking-wide text-foreground">
                  ZYPHERSCAN
                </span>
                {/* <span className="text-[10px] text-muted-foreground tracking-wider font-medium">
                  EXPLORER
                </span> */}
              </div>
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
                className="bg-[#12171d] border-border/20"
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
                className="bg-[#12171d] border-border/20"
              >
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

            {isConnected ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium ${isActive("/dashboard")}`}
                >
                  Dashboard
                </Link>
                <div className="h-4 w-px bg-border/30" />
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
            ) : (
              <Link to="/auth">
                <Button
                  size="sm"
                  className="bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 h-9 px-4"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              </Link>
            )}
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
              className="w-[300px] sm:w-[400px] border-l border-border/20 bg-[#0a0e13] p-0"
            >
              <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
              <div className="flex flex-col h-full bg-[#0a0e13]">
                <div className="p-6 border-b border-border/10">
                  <div className="flex items-center gap-2 mb-6">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                    <span className="text-xl font-bold tracking-wide text-foreground">
                      ZYPHERSCAN
                    </span>
                  </div>

                  {/* Network Selector Mobile */}
                  <div className="flex bg-[#12171d] rounded-lg p-1 border border-border/20 mb-4">
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

                <div className="p-6 border-t border-border/10 bg-[#12171d]/50">
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
                  ) : (
                    <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                        <Wallet className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/20">
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

            <div className="flex gap-8 text-sm text-muted-foreground w-full justify-center">
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
