import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies (for other endpoints if needed)
app.use(express.json());

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy endpoint for ZypherScan Backend
app.all('/api/zypher/*', async (req, res) => {
    const baseUrl = process.env.VITE_BACKEND_API;
    if (!baseUrl) {
        console.error('VITE_BACKEND_API is not configured');
        return res.status(500).json({ error: 'Backend configuration error' });
    }

    // Strip /api/zypher prefix
    const pathWithoutPrefix = req.path.replace('/api/zypher', '');
    const targetUrl = `${baseUrl}${pathWithoutPrefix}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
    
    // console.log(`[Proxy] ${req.method} ${req.path} -> ${targetUrl}`);
    
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                ...req.headers,
                'host': new URL(baseUrl).host, // Update host header
                'x-api-key': process.env.VITE_BACKEND_API_KEY || '',
            },
            // Don't separate body for GET/HEAD, but pass it otherwise
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
        });
        
        // Forward status code
        res.status(response.status);

        // Forward headers
        response.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });

        // Forward body
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));

    } catch (error) {
        console.error('[Proxy] Error:', error);
        res.status(500).json({ error: 'Proxy request failed' });
    }
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Proxying /api/zypher to ${process.env.VITE_BACKEND_API}`);
});
