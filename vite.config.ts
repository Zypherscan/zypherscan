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

  const MAINNET_API = normalizeApiUrl(env.VITE_MAINNET_RPC_API_URL || "");
  const TESTNET_API = normalizeApiUrl(env.VITE_TESTNET_RPC_API_URL || "");
  const ZEBRA_API = (env.VITE_ZEBRA_RPC_URL || "").trim();

  return {
    server: {
      host: "::",
      port: 3000,
      proxy: {
        // Proxy to Railway Backend directly
        // Vite server (Node.js) adds the API key, so it's not visible in browser dev tools
        "/api/zypher": {
          target: env.VITE_BACKEND_API,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/zypher/, ""),
          configure: (proxy, _options) => {
            proxy.on("proxyReq", (proxyReq, _req, _res) => {
              const apiKey = env.VITE_BACKEND_API_KEY || "";
              if (apiKey) {
                proxyReq.setHeader("x-api-key", apiKey);
              }
            });
          },
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
