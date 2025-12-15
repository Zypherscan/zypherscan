import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Helper to ensure URL ends with /api
  const normalizeApiUrl = (url: string) => {
    const clean = url.trim().replace(/\/$/, "");
    if (clean === "") return "";
    if (clean.endsWith("/api")) return clean;
    return `${clean}/api`;
  };

  const MAINNET_API = normalizeApiUrl(
    env.VITE_CIPHERSCAN_MAINNET_API_URL || ""
  );
  const TESTNET_API = normalizeApiUrl(
    env.VITE_CIPHERSCAN_TESTNET_API_URL || ""
  );
  const ZEBRA_API = (env.VITE_ZEBRA_RPC_URL || "").trim();

  // In development, proxy to backend server on port 8080
  const BACKEND_URL = env.VITE_BACKEND_URL || "http://localhost:8080";

  return {
    server: {
      host: "::",
      port: 3000,
      proxy: {
        // Backend API endpoints - only used in development
        // In production, Express serves both frontend and API on same port
        "/api/scan": {
          target: BACKEND_URL,
          changeOrigin: true,
        },
        "/api/health": {
          target: BACKEND_URL,
          changeOrigin: true,
        },
        "/api/debug": {
          target: BACKEND_URL,
          changeOrigin: true,
        },
        // External API proxies
        "/api-testnet": {
          target: TESTNET_API,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-testnet/, ""),
        },
        "/api": {
          target: MAINNET_API,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        "/zebra": {
          target: ZEBRA_API,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/zebra/, ""),
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      exclude: ["@aspect-build/aspect-proto"],
    },
  };
});
