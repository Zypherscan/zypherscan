export default async function handler(req, res) {
  // Origin validation - only allow requests from zypherscan.com
  const allowedOrigins = [
    "https://zypherscan.com",
    "https://www.zypherscan.com",
    "http://localhost:3000",
    "http://localhost:5173",
  ];

  const origin = req.headers.origin || req.headers.referer || "";
  const isAllowed =
    allowedOrigins.some((allowed) => origin.startsWith(allowed)) ||
    process.env.NODE_ENV === "development";

  if (!isAllowed) {
    return res.status(403).json({ error: "Forbidden: Invalid origin" });
  }

  const { path = "", ...queryParams } = req.query;
  const baseUrl = process.env.VITE_BACKEND_API;

  if (!baseUrl) {
    return res
      .status(500)
      .json({ error: "Configuration Error: VITE_BACKEND_API not set" });
  }

  // Helper to ensure URL doesn't have double slashes
  const cleanBase = baseUrl.trim().replace(/\/$/, "");

  // Construct query string
  const queryString = new URLSearchParams(queryParams).toString();
  const finalUrl = `${cleanBase}/${path}${queryString ? `?${queryString}` : ""}`;

  try {
    const body = ["GET", "HEAD"].includes(req.method)
      ? undefined
      : typeof req.body === "object"
        ? JSON.stringify(req.body)
        : req.body;

    const headers = {
      "Content-Type": req.headers["content-type"] || "application/json",
      ...(req.headers["authorization"]
        ? { Authorization: req.headers["authorization"] }
        : {}),
    };

    // Add API Key
    const apiKey = process.env.VITE_BACKEND_API_KEY;
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    const response = await fetch(finalUrl, {
      method: req.method,
      headers,
      body,
    });

    const contentType = response.headers.get("content-type");
    const data = await response.text(); // Use text() to handle both JSON and non-JSON (like raw strings) safely

    res.status(response.status);
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }
    // Forward other headers if relevant?
    // Usually CORS is handled by Vercel or Express, but strictly specific headers might be needed.
    // The previous proxy files didn't forward everything, so sticking to consistent pattern.

    res.send(data);
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
}
