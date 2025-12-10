import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import {
  Shield,
  Home,
  BarChart3,
  Unlock,
  Wallet,
  LogOut,
  Search,
  Menu,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { isConnected, viewingKey, disconnect } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
              <Shield className="w-7 h-7 text-accent" />
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
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
              <div className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
              <span className="text-xs font-medium text-accent">MAINNET</span>
            </div>
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
              <Link to="/dashboard">
                <Button
                  size="sm"
                  className="bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 h-9 px-4"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Toggle (simplified) */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/20">
        <div className="container px-6 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="bg-accent/10 p-2 rounded-lg">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-lg">Zypherscan</p>
                <p className="text-sm text-muted-foreground">
                  Privacy-first blockchain explorer
                </p>
              </div>
            </div>

            <div className="flex gap-8 text-sm text-muted-foreground">
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

            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground">© 2025 Zypherscan</p>
              <p className="text-xs font-mono text-muted-foreground mt-1 opacity-60">
                Built with the cypherpunk ethos
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
