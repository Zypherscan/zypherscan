import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// @ts-ignore
import { runZypherScanner } from "./zypherscan-decrypt/scanner_client.js";

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
    plugins: [
      react(),
      {
        name: "zypher-scanner-middleware",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.method === "POST" && req.url === "/scan") {
              let body = "";
              req.on("data", (chunk) => {
                body += chunk.toString();
              });

              req.on("end", async () => {
                try {
                  const params = JSON.parse(body);
                  const { uvk, birthday, action = "all", txid = null } = params;

                  if (!uvk || !birthday) {
                    res.statusCode = 400;
                    res.setHeader("Content-Type", "application/json");
                    res.end(
                      JSON.stringify({ error: "Missing UVK or Birthday" })
                    );
                    return;
                  }

                  console.log(
                    `[ViteMiddleware] Received scan request: Action=${action}, Birthday=${birthday}`
                  );

                  // Execute scanner
                  const result = await runZypherScanner(
                    uvk,
                    birthday,
                    action,
                    txid
                  );

                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify(result));
                } catch (err) {
                  console.error(
                    "[ViteMiddleware] Error processing request:",
                    err
                  );
                  res.statusCode = 500;
                  res.setHeader("Content-Type", "application/json");
                  // @ts-ignore
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }
            next();
          });
        },
      },
    ],
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
