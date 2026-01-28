export default async function handler(req, res) {
  // Origin validation - only allow requests from zypherscan.com
  const allowedOrigins = [
    "https://zypherscan.com",
    "https://testnet.zypherscan.com",
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
  let baseUrl = process.env.VITE_ZEBRA_RPC_URL;

  if (!baseUrl) {
    return res
      .status(500)
      .json({ error: "Configuration Error: VITE_ZEBRA_RPC_URL not set" });
  }

  baseUrl = baseUrl.trim();
  // Zebra URL typically doesn't need /api suffix logic

  // Construct query string
  const queryString = new URLSearchParams(queryParams).toString();
  const finalUrl = `${baseUrl}/${path}${queryString ? `?${queryString}` : ""}`;

  try {
    const body = ["GET", "HEAD"].includes(req.method)
      ? undefined
      : typeof req.body === "object"
        ? JSON.stringify(req.body)
        : req.body;

    const response = await fetch(finalUrl, {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        ...(req.headers["authorization"]
          ? { Authorization: req.headers["authorization"] }
          : {}),
      },
      body,
    });

    const contentType = response.headers.get("content-type");
    const data = await response.text();

    res.status(response.status);
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }
    res.send(data);
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
}
