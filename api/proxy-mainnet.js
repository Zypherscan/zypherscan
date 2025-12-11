export default async function handler(req, res) {
  const { path = '', ...queryParams } = req.query;
  const baseUrl = process.env.VITE_CIPHERSCAN_MAINNET_API_URL;

  if (!baseUrl) {
    return res.status(500).json({ error: 'Configuration Error: VITE_CIPHERSCAN_MAINNET_API_URL not set' });
  }

  // Helper to ensure URL ends with /api (matching vite.config.ts logic)
  const normalizeApiUrl = (url) => {
    const clean = url.trim().replace(/\/$/, ""); 
    if (clean === "") return "";
    if (clean.endsWith("/api")) return clean;
    return `${clean}/api`;
  };

  const targetBase = normalizeApiUrl(baseUrl);
  
  // Construct query string
  const queryString = new URLSearchParams(queryParams).toString();
  const finalUrl = `${targetBase}/${path}${queryString ? `?${queryString}` : ''}`;

  try {
    const body = ['GET', 'HEAD'].includes(req.method) 
      ? undefined 
      : (typeof req.body === 'object' ? JSON.stringify(req.body) : req.body);

    const response = await fetch(finalUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        // Pass Authorization if present
        ...(req.headers['authorization'] ? { 'Authorization': req.headers['authorization'] } : {}),
      },
      body,
    });

    const contentType = response.headers.get('content-type');
    const data = await response.text();

    res.status(response.status);
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    res.send(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
}
