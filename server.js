import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Helper to ensure URL ends with /api (matches vite.config.ts logic)
const normalizeApiUrl = (url) => {
    if (!url) return "";
    const clean = url.trim().replace(/\/$/, "");
    if (clean === "") return "";
    if (clean.endsWith("/api")) return clean;
    return `${clean}/api`;
};

// Generic Proxy Handler
// Generic Proxy Handler
const createProxyHandler = (targetBaseUrl, options = {}) => async (req, res) => {
    if (!targetBaseUrl) {
        console.error(`Target URL not configured for ${req.baseUrl}`);
        return res.status(502).json({ error: 'Upstream configuration missing' });
    }

    const cleanTarget = targetBaseUrl.replace(/\/$/, "");
    const targetUrl = `${cleanTarget}${req.url}`;
    
    try {
        const headers = { ...req.headers };

        // Remove headers that might cause issues with upstream APIs
        delete headers['content-length'];
        delete headers['origin'];
        delete headers['referer'];
        delete headers['host']; // We set this explicitly below

        // Set Host header
        try {
            headers['host'] = new URL(cleanTarget).host;
        } catch (e) {
            // Should not happen with valid URL
        }
        
        if (options.apiKey) {
            headers['x-api-key'] = options.apiKey;
        }

        const fetchOptions = {
            method: req.method,
            headers: headers,
        };

        if (!['GET', 'HEAD'].includes(req.method)) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, fetchOptions);
        
        // Forward status
        res.status(response.status);

        // Forward headers
        response.headers.forEach((value, key) => {
             // Avoid setting content-encoding/length to let Node handle it or because we buffer
            if (key !== 'content-encoding' && key !== 'content-length') {
                res.setHeader(key, value);
            }
        });

        // Forward body
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));

    } catch (error) {
        console.error(`[Proxy] Error proxying to ${targetUrl}:`, error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Proxy request failed' });
        }
    }
};

// --- Proxy Routes ---

// 1. Zypher Backend
// Special handling for auth routes to ensure they hit /auth/... at root, not /api/api/auth/...
const BACKEND_ROOT = (process.env.VITE_BACKEND_API || "").replace(/\/api\/?$/, "");
app.use('/api/zypher/auth', createProxyHandler(`${BACKEND_ROOT}/auth`, {
    apiKey: process.env.VITE_BACKEND_API_KEY
}));

app.use('/api/zypher', createProxyHandler(process.env.VITE_BACKEND_API, { 
    apiKey: process.env.VITE_BACKEND_API_KEY 
}));

// 2. Testnet API
const TESTNET_API = normalizeApiUrl(process.env.VITE_TESTNET_RPC_API_URL);
app.use('/api-testnet', createProxyHandler(TESTNET_API));

// 3. Zebra API
const ZEBRA_API = (process.env.VITE_ZEBRA_RPC_URL || "").trim();
app.use('/zebra', createProxyHandler(ZEBRA_API));

// 4. CoinGecko Proxy
const COINGECKO_API = "https://api.coingecko.com/api/v3";
app.use('/coingecko', createProxyHandler(COINGECKO_API));

// 5. Mainnet API (Must be after /api/zypher to avoid catching it if /api logic was broad, but /api/zypher is explicit)
const MAINNET_API = normalizeApiUrl(process.env.VITE_MAINNET_RPC_API_URL);
app.use('/api', createProxyHandler(MAINNET_API));


// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Proxies configured:`);
    console.log(`  /api/zypher  -> ${process.env.VITE_BACKEND_API}`);
    console.log(`  /api-testnet -> ${TESTNET_API}`);
    console.log(`  /zebra       -> ${ZEBRA_API}`);
    console.log(`  /api         -> ${MAINNET_API}`);
});
