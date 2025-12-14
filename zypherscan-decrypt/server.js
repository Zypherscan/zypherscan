import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { existsSync } from 'fs';
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

console.log('🔧 Initializing ZypherScan Server...');
console.log(`   Binary path: ${BINARY_PATH}`);
console.log(`   Binary exists: ${existsSync(BINARY_PATH)}`);

/**
 * Scanner handler
 */
const scanHandler = async (req, res) => {
    const { uvk, birthday, action = 'all', txid = null } = req.body;

    if (!uvk || !birthday) {
        return res.status(400).json({ error: 'Missing UVK or Birthday' });
    }

    console.log(`[Scanner] Request: Action=${action}, Birthday=${birthday}`);
    
    try {
        const result = await runZypherScanner(uvk, birthday, action, txid);
        res.json(result);
    } catch (err) {
        console.error('[Scanner] Error:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * ROUTE DEFINITIONS
 * Order is critical! More specific routes must come before wildcards
 */

// 1. Health check endpoints
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

// Debug endpoint to check configuration
app.get('/api/debug', (req, res) => {
    res.json({
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            MAINNET_API: process.env.VITE_CIPHERSCAN_MAINNET_API_URL,
            TESTNET_API: process.env.VITE_CIPHERSCAN_TESTNET_API_URL,
            ZEBRA_RPC: process.env.VITE_ZEBRA_RPC_URL,
        },
        paths: {
            binary: BINARY_PATH,
            binaryExists: existsSync(BINARY_PATH),
            dist: distPath,
            distExists: existsSync(path.join(__dirname, '..', 'dist'))
        }
    });
});

// 2. Scanner API endpoints (must come before /api/* catch-all)
app.post('/scan', scanHandler);
app.post('/api/scan', scanHandler);

// 3. Testnet proxy
app.all('/api-testnet/*', async (req, res) => {
    const baseUrl = process.env.VITE_CIPHERSCAN_TESTNET_API_URL || 'https://testnet.cipherscan.io';
    const pathWithoutPrefix = req.path.replace('/api-testnet', '');
    const targetUrl = `${baseUrl}${pathWithoutPrefix}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
    
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
        console.error('[Testnet Proxy] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Mainnet proxy (catch-all for /api/*)
app.all('/api/*', async (req, res) => {
    const baseUrl = process.env.VITE_CIPHERSCAN_MAINNET_API_URL || 'https://api.cipherscan.io';
    const pathWithoutPrefix = req.path.replace('/api', '');
    const targetUrl = `${baseUrl}${pathWithoutPrefix}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
    
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
        console.error('[Mainnet Proxy] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 5. Zebra proxy - handle both /zebra and /zebra/*
app.all('/zebra', async (req, res) => {
    const baseUrl = process.env.VITE_ZEBRA_RPC_URL || 'https://mainnet.lightwalletd.com:9067';
    const targetUrl = baseUrl;
    
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
        console.error('[Zebra Proxy] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

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
        console.error('[Zebra Proxy] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 6. Serve static files from Vite build
const distPath = path.join(__dirname, '..', 'dist');

if (existsSync(distPath)) {
    console.log(`✅ Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
} else {
    console.warn(`⚠️  Warning: dist folder not found at ${distPath}`);
}

// 7. Catch-all route (MUST BE LAST!)
app.get('*', (req, res) => {
    if (existsSync(distPath)) {
        res.sendFile(path.join(distPath, 'index.html'));
    } else {
        res.status(503).json({
            error: 'Frontend not built',
            message: 'The frontend has not been built yet. API endpoints are still available.',
            apiEndpoints: {
                health: '/api/health',
                scan: '/api/scan'
            }
        });
    }
});

/**
 * Start server
 */
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 ZypherScan Server Running`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Host: 0.0.0.0`);
    console.log(`   Scanner API: /api/scan`);
    console.log(`   Health Check: /api/health`);
    console.log(`   Binary: ${BINARY_PATH}`);
    console.log(`   Binary exists: ${existsSync(BINARY_PATH)}`);
    console.log(`   Dist folder: ${distPath}`);
    console.log(`   Dist exists: ${existsSync(distPath)}`);
    console.log(`\n✅ Server ready!\n`);
});

// Error handling
server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('\n📛 SIGTERM received, shutting down...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
