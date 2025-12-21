import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

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
const createProxyHandler = (targetBaseUrl, options = {}) => async (req, res) => {
    if (!targetBaseUrl) {
        console.error(`Target URL not configured for ${req.baseUrl}`);
        // If it's an API call, return JSON error. If it's navigation, might break, but this is an API proxy.
        // Returning 502 Bad Gateway is appropriate for missing upstream config.
        return res.status(502).json({ error: 'Upstream configuration missing' });
    }

    // req.url in app.use middleware is the path relative to the mount point
    // e.g., if mounted at /zebra, request /zebra/foo -> req.url = /foo
    // Ensure targetBaseUrl doesn't have trailing slash to avoid double slashes
    const cleanTarget = targetBaseUrl.replace(/\/$/, "");
    const targetUrl = `${cleanTarget}${req.url}`;
    
    try {
        const fetch = (await import('node-fetch')).default;
        
        const headers = { ...req.headers };
        // Update host header
        try {
            headers['host'] = new URL(cleanTarget).host;
        } catch (e) {
            // Ignore URL parse error if target is weird, but it shouldn't be
        }
        
        if (options.apiKey) {
            headers['x-api-key'] = options.apiKey;
        }

        const fetchOptions = {
            method: req.method,
            headers: headers,
        };

        // Forward body if not GET/HEAD
        if (!['GET', 'HEAD'].includes(req.method)) {
             // Since we used express.json(), req.body is an object.
             // We need to stringify it back to JSON.
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, fetchOptions);
        
        // Forward status
        res.status(response.status);

        // Forward headers
        response.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });

        // Forward body
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));

    } catch (error) {
        console.error(`[Proxy] Error proxying to ${targetUrl}:`, error);
        res.status(500).json({ error: 'Proxy request failed' });
    }
};

// --- Proxy Routes ---

// 1. Zypher Backend
app.use('/api/zypher', createProxyHandler(process.env.VITE_BACKEND_API, { 
    apiKey: process.env.VITE_BACKEND_API_KEY 
}));

// 2. Testnet API
const TESTNET_API = normalizeApiUrl(process.env.VITE_TESTNET_RPC_API_URL);
app.use('/api-testnet', createProxyHandler(TESTNET_API));

// 3. Zebra API
const ZEBRA_API = (process.env.VITE_ZEBRA_RPC_URL || "").trim();
app.use('/zebra', createProxyHandler(ZEBRA_API));

// 4. Mainnet API (Must be after /api/zypher to avoid catching it if /api logic was broad, but /api/zypher is explicit)
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
