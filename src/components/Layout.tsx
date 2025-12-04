import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Home,
  BarChart3,
  PieChart,
  Unlock,
  Activity,
  Server,
  Box,
  Wallet,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

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
    navigate("/auth");
  };

  const toggleTheme = () => {
    const isLight = document.documentElement.classList.toggle("light");
    localStorage.setItem("theme", isLight ? "light" : "dark");
  };

  const isActive = (path: string) => {
    return location.pathname === path
      ? "bg-accent/10 text-accent"
      : "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 group">
                <Shield className="w-8 h-8 text-accent transition-transform group-hover:scale-110" />
                <span className="text-xl font-bold hidden sm:inline">
                  ZShield
                </span>
              </Link>
              <nav className="hidden md:flex items-center gap-1 ml-6">
                <Link to="/">
                  <Button variant="ghost" size="sm" className={isActive("/")}>
                    <Home className="w-4 h-4 mr-2" />
                    Explorer
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isActive("/dashboard")}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/privacy">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isActive("/privacy")}
                  >
                    <PieChart className="w-4 h-4 mr-2" />
                    Privacy
                  </Button>
                </Link>
                <Link to="/decrypt">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isActive("/decrypt")}
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    Decrypt
                  </Button>
                </Link>
                <Link to="/mempool">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isActive("/mempool")}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Mempool
                  </Button>
                </Link>
                <Link to="/network">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isActive("/network")}
                  >
                    <Server className="w-4 h-4 mr-2" />
                    Network
                  </Button>
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              {isConnected && (
                <div className="bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-accent/20 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
                    <span className="text-xs text-terminal-green font-medium hidden sm:inline">
                      Connected
                    </span>
                  </div>
                  <div className="w-px h-4 bg-border hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-accent" />
                    <span className="text-sm font-mono text-muted-foreground">
                      {truncateKey(viewingKey)}
                    </span>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="border-accent/50 hover:bg-accent/10 mr-2"
              >
                <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 light:hidden" />
                <Moon className="w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 hidden light:block" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  className="border-accent/50 hover:bg-accent/10"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
};
