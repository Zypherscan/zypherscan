import React, { createContext, useContext, useState, useEffect } from "react";

export type NetworkType = "mainnet" | "testnet";

interface NetworkContextType {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
  apiBase: string; // The base URL for API calls corresponding to the network
  zecPrice: { usd: number; change24h: number } | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [network, setNetwork] = useState<NetworkType>(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname === "testnet.zypherscan.com") return "testnet";
      if (hostname === "zypherscan.com" || hostname === "www.zypherscan.com")
        return "mainnet";
    }

    // Priority 2: Persisted selection (fallback / local dev)
    const saved = localStorage.getItem("zcash_network");
    return (saved === "testnet" ? "testnet" : "mainnet") as NetworkType;
  });

  useEffect(() => {
    localStorage.setItem("zcash_network", network);
  }, [network]);

  const handleSetNetwork = (newNetwork: NetworkType) => {
    if (newNetwork === network) return;

    // Clear Auth Data on Network Switch
    localStorage.removeItem("zcash_connected");
    localStorage.removeItem("zcash_viewing_key");
    localStorage.removeItem("zcash_birthday_height");
    localStorage.removeItem(`zcash_wallet_cache_v2_`);

    // Save new network selection
    localStorage.setItem("zcash_network", newNetwork);
    setNetwork(newNetwork);

    // Redirect Logic
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isLocal) {
      if (newNetwork === "testnet") {
        window.location.href = `https://testnet.zypherscan.com${window.location.pathname}`;
        return;
      } else {
        window.location.href = `https://zypherscan.com${window.location.pathname}`;
        return;
      }
    }

    // Default reload for local
    window.location.href = "/";
  };

  // Determine API base based on network
  // Mainnet uses /api (proxied to api.mainnet...)
  // Testnet uses /api-testnet (proxied to api.testnet...)
  const apiBase = network === "mainnet" ? "/api" : "/api-testnet";

  // Global ZEC Price State - Initialize from localStorage for instant display
  const [zecPrice, setZecPrice] = useState<{
    usd: number;
    change24h: number;
  } | null>(() => {
    // Load cached price for instant display
    try {
      const cached = localStorage.getItem("zec_price_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        // Only use cache if less than 5 minutes old
        if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          return { usd: parsed.usd, change24h: parsed.change24h };
        }
      }
    } catch {
      // Ignore cache errors
    }
    return null;
  });

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(
          "/coingecko/simple/price?ids=zcash&vs_currencies=usd&include_24hr_change=true",
        );
        if (!response.ok) return; // Silent fail

        const data = await response.json();
        if (data.zcash) {
          const priceData = {
            usd: data.zcash.usd,
            change24h: data.zcash.usd_24h_change,
          };
          setZecPrice(priceData);

          // Cache for instant display on next load
          localStorage.setItem(
            "zec_price_cache",
            JSON.stringify({
              ...priceData,
              timestamp: Date.now(),
            }),
          );
        }
      } catch (error) {
        console.error("Global price fetch failed", error);
      }
    };

    fetchPrice(); // Initial fetch
    const interval = setInterval(fetchPrice, 5000); // Poll every 1 second for real-time updates
    return () => clearInterval(interval);
  }, []);

  return (
    <NetworkContext.Provider
      value={{ network, setNetwork: handleSetNetwork, apiBase, zecPrice }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};
