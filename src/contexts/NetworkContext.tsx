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
    // Persist selection
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
    localStorage.removeItem(`zcash_wallet_cache_v2_`); // Might want to clear specific cache, but simplistic for now

    // Save new network selection
    localStorage.setItem("zcash_network", newNetwork);
    setNetwork(newNetwork);

    // Redirect to homepage (reloads app with clean state)
    window.location.href = "/";
  };

  // Determine API base based on network
  // Mainnet uses /api (proxied to api.mainnet...)
  // Testnet uses /api-testnet (proxied to api.testnet...)
  const apiBase = network === "mainnet" ? "/api" : "/api-testnet";

  // Global ZEC Price State (Fetched once, updated every 30s)
  const [zecPrice, setZecPrice] = useState<{
    usd: number;
    change24h: number;
  } | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        // Use the proxy endpoint to avoid CORS
        const response = await fetch(
          "/coingecko/simple/price?ids=zcash&vs_currencies=usd&include_24hr_change=true"
        );
        if (!response.ok) return; // Silent fail

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.zcash) {
            setZecPrice({
              usd: data.zcash.usd,
              change24h: data.zcash.usd_24h_change,
            });
          }
        } else {
          console.warn("Global price fetch received non-JSON response");
        }
      } catch (error) {
        console.error("Global price fetch failed", error);
      }
    };

    fetchPrice(); // Initial fetch
    const interval = setInterval(fetchPrice, 30000); // Poll every 30s
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
