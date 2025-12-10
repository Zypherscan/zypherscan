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
import WasmTest from "./pages/WasmTest";
import WasmDiagnostics from "./pages/WasmDiagnostics";
import NotFound from "./pages/NotFound";

import { Layout } from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
            <Route path="/wasm-test" element={<WasmTest />} />
            <Route path="/wasm-diagnostics" element={<WasmDiagnostics />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
