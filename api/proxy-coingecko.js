export default async function handler(req, res) {
  const { path = '', ...queryParams } = req.query;
  const targetBase = "https://api.coingecko.com/api/v3";
  
  // Construct query string
  // Note: Vercel's req.query includes the rewrite param "path". 
  // We need to pass the REST of the query params to CoinGecko.
  // The "path" itself is the route segments (e.g. simple/price).
  
  const queryString = new URLSearchParams(queryParams).toString();
  const finalUrl = `${targetBase}/${path}${queryString ? `?${queryString}` : ''}`;

  try {
    const fetchOptions = {
        method: req.method,
        headers: {
            'Accept': 'application/json',
            // Explicitly set Host? No, fetch usually handles it.
            // Do NOT forward client Origin/Referer to avoid CoinGecko blocking Vercel's shared IPs or domains if they are blacklisted.
        }
    };

    const response = await fetch(finalUrl, fetchOptions);

    const contentType = response.headers.get('content-type');
    
    // We can just pipe the text/buffer back
    const data = await response.text();

    res.status(response.status);
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    // Forward cache headers if useful, or set our own
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    
    res.send(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
}
