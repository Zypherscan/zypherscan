import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import BlockDetails from "./pages/BlockDetails";
import TransactionDetails from "./pages/TransactionDetails";
import PrivacyDashboard from "./pages/PrivacyDashboard";
import DecryptTool from "./pages/DecryptTool";
import Mempool from "./pages/Mempool";
import NetworkStatus from "./pages/NetworkStatus";
import RecentBlocks from "./pages/RecentBlocks";
import NotFound from "./pages/NotFound";

import { Layout } from "./components/Layout";
import { NetworkProvider } from "@/contexts/NetworkContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletDataProvider } from "@/contexts/WalletDataContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <NetworkProvider>
      <AuthProvider>
        <WalletDataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/privacy" element={<PrivacyDashboard />} />
                  <Route path="/tx/:txid" element={<TransactionDetails />} />
                  <Route path="/block/:height" element={<BlockDetails />} />
                  <Route path="/decrypt" element={<DecryptTool />} />
                  <Route path="/mempool" element={<Mempool />} />
                  <Route path="/network" element={<NetworkStatus />} />
                  <Route path="/blocks" element={<RecentBlocks />} />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </TooltipProvider>
        </WalletDataProvider>
      </AuthProvider>
    </NetworkProvider>
  </QueryClientProvider>
);

export default App;
