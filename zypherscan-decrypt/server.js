const http = require('http');
const { runZypherScanner } = require('./scanner_client.js');

const PORT = 3001;

const server = http.createServer((req, res) => {
    // Enable CORS for all origins (local dev)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', message: 'ZypherScan Native Server Running' }));
        return;
    }

    if (req.method === 'POST' && req.url === '/scan') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const params = JSON.parse(body);
                const { uvk, birthday, action = 'all', txid = null } = params;

                if (!uvk || !birthday) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing UVK or Birthday' }));
                    return;
                }

                console.log(`[Server] Received scan request: Action=${action}, Birthday=${birthday}`);
                
                // Execute scanner
                const result = await runZypherScanner(uvk, birthday, action, txid);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (err) {
                console.error('[Server] Error processing request:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, () => {
    console.log(`[Server] ZypherScan Native Server listening on http://localhost:${PORT}`);
    console.log(`[Server] Make sure to build the binary using 'cargo build --release' first.`);
});
