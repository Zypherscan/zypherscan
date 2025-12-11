export default async function handler(req, res) {
  const { path = '', ...queryParams } = req.query;
  let baseUrl = process.env.VITE_ZEBRA_RPC_URL;

  if (!baseUrl) {
     return res.status(500).json({ error: 'Configuration Error: VITE_ZEBRA_RPC_URL not set' });
  }
  
  baseUrl = baseUrl.trim();
  // Zebra URL typically doesn't need /api suffix logic

  // Construct query string
  const queryString = new URLSearchParams(queryParams).toString();
  const finalUrl = `${baseUrl}/${path}${queryString ? `?${queryString}` : ''}`;

  try {
    const body = ['GET', 'HEAD'].includes(req.method) 
      ? undefined 
      : (typeof req.body === 'object' ? JSON.stringify(req.body) : req.body);

    const response = await fetch(finalUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
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
