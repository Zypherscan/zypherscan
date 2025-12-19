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
        // Special proxy for /auth/key to ensure it hits root /auth/key, not /api/auth/key
        // This handles cases where VITE_BACKEND_API might include /api
        "^/api/zypher/auth/key": {
          target: (env.VITE_BACKEND_API || "").replace(/\/api\/?$/, ""),
          changeOrigin: true,
          rewrite: () => "/auth/key",
          configure: (proxy, _options) => {
            proxy.on("proxyReq", (proxyReq, _req, _res) => {
              // Add API key if needed, though usually pub key is open
              const apiKey = env.VITE_BACKEND_API_KEY || "";
              if (apiKey) {
                proxyReq.setHeader("x-api-key", apiKey);
              }
            });
          },
        },
        "/api/zypher": {
          target: env.VITE_BACKEND_API,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/zypher/, ""),
          configure: (proxy, _options) => {
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log(
                `[Proxy] ${req.method} ${req.url} -> ${proxyReq.path}`
              );
              const apiKey = env.VITE_BACKEND_API_KEY || "";
              if (apiKey) {
                proxyReq.setHeader("x-api-key", apiKey);
              }
            });
            proxy.on("error", (err, _req, _res) => {
              console.error("[Proxy Error]", err);
            });
          },
        },
        // External API proxies
        "/coingecko": {
          target: "https://api.coingecko.com/api/v3",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/coingecko/, ""),
        },
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
