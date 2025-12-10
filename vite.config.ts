import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "https://api.mainnet.cipherscan.app",
        changeOrigin: true,
        secure: false,
      },
      "/zebra": {
        target: "https://zebra.up.railway.app",
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
}));
