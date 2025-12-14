import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { runZypherScanner } from './scanner_client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Path to the compiled Rust binary
const BINARY_PATH = path.join(__dirname, 'target', 'release', 'zypherscan-decrypt');

/**
 * Scanner API endpoints
 * POST /scan and POST /api/scan (both work)
 */
const scanHandler = async (req, res) => {
    const { uvk, birthday, action = 'all', txid = null } = req.body;

    if (!uvk || !birthday) {
        return res.status(400).json({ error: 'Missing UVK or Birthday' });
    }

    console.log(`[Server] Received scan request: Action=${action}, Birthday=${birthday}`);
    
    try {
        const result = await runZypherScanner(uvk, birthday, action, txid);
        res.json(result);
    } catch (err) {
        console.error('[Server] Error processing request:', err);
        res.status(500).json({ error: err.message });
    }
};

app.post('/scan', scanHandler);
app.post('/api/scan', scanHandler);

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
    const fs = await import('fs');
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        binaryPath: BINARY_PATH,
        binaryExists: fs.existsSync(BINARY_PATH)
    });
});
app.get('/api/health', async (req, res) => {
    const fs = await import('fs');
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        binaryPath: BINARY_PATH,
        binaryExists: fs.existsSync(BINARY_PATH)
    });
});

/**
 * API Proxies (for production deployment)
 * Order matters! More specific routes must come first
 */

// Scanner API - must come before /api/* catch-all
app.post('/api/scan', scanHandler);

// Testnet proxy - /api-testnet/*
app.all('/api-testnet/*', async (req, res) => {
    const baseUrl = process.env.VITE_CIPHERSCAN_TESTNET_API_URL || 'https://testnet.cipherscan.io';
    const pathWithoutPrefix = req.path.replace('/api-testnet', '');
    const targetUrl = `${baseUrl}/api${pathWithoutPrefix}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
    
    console.log(`[Testnet Proxy] ${req.method} ${req.path} -> ${targetUrl}`);
    
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': req.headers['content-type'] || 'application/json',
                ...(req.headers['authorization'] ? { 'Authorization': req.headers['authorization'] } : {}),
            },
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
        });
        
        const data = await response.text();
        res.status(response.status).send(data);
    } catch (error) {
        console.error('Testnet Proxy Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mainnet proxy - /api/* (catch-all for Cipherscan API)
// This must come after /api/scan to avoid conflicts
app.all('/api/*', async (req, res) => {
    const baseUrl = process.env.VITE_CIPHERSCAN_MAINNET_API_URL || 'https://api.cipherscan.io';
    const pathWithoutPrefix = req.path.replace('/api', '');
    const targetUrl = `${baseUrl}/api${pathWithoutPrefix}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
    
    console.log(`[Mainnet Proxy] ${req.method} ${req.path} -> ${targetUrl}`);
    
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': req.headers['content-type'] || 'application/json',
                ...(req.headers['authorization'] ? { 'Authorization': req.headers['authorization'] } : {}),
            },
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
        });
        
        const data = await response.text();
        res.status(response.status).send(data);
    } catch (error) {
        console.error('Mainnet Proxy Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Zebra proxy - /zebra/*
app.all('/zebra/*', async (req, res) => {
    const baseUrl = process.env.VITE_ZEBRA_RPC_URL || 'https://mainnet.lightwalletd.com:9067';
    const pathWithoutPrefix = req.path.replace('/zebra', '');
    const targetUrl = `${baseUrl}${pathWithoutPrefix}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
    
    console.log(`[Zebra Proxy] ${req.method} ${req.path} -> ${targetUrl}`);
    
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': req.headers['content-type'] || 'application/json',
                ...(req.headers['authorization'] ? { 'Authorization': req.headers['authorization'] } : {}),
            },
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
        });
        
        const data = await response.text();
        res.status(response.status).send(data);
    } catch (error) {
        console.error('Zebra Proxy Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Serve static files from Vite build (for production)
 */
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

/**
 * Catch-all route to serve React app (SPA routing)
 */
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

/**
 * Start server
 */
app.listen(PORT, () => {
    console.log(`🚀 ZypherScan Server Running`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Frontend: http://localhost:${PORT}`);
    console.log(`   Scanner API: http://localhost:${PORT}/scan`);
    console.log(`   Health Check: http://localhost:${PORT}/health`);
    console.log(`   Binary: ${BINARY_PATH}`);
    console.log(`\nMake sure to build the binary using 'cargo build --release' first.`);
});

