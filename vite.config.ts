import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Helper to ensure URL ends with /api
  const normalizeApiUrl = (url: string) => {
    const clean = url.trim().replace(/\/$/, ""); // Remove whitespace and trailing slash
    if (clean === "") return ""; // Handle empty string case
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

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api-testnet": {
          target: TESTNET_API,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api-testnet/, ""),
        },
        "/api": {
          target: MAINNET_API,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        "/zebra": {
          target: ZEBRA_API,
          changeOrigin: true,
          secure: false,
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
