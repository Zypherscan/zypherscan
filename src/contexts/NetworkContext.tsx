import React, { createContext, useContext, useState, useEffect } from "react";

export type NetworkType = "mainnet" | "testnet";

interface NetworkContextType {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
  apiBase: string; // The base URL for API calls corresponding to the network
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
    localStorage.setItem("zcash_network", newNetwork);
    setNetwork(newNetwork);
    window.location.reload();
  };

  // Determine API base based on network
  // Mainnet uses /api (proxied to api.mainnet...)
  // Testnet uses /api-testnet (proxied to api.testnet...)
  const apiBase = network === "mainnet" ? "/api" : "/api-testnet";

  return (
    <NetworkContext.Provider
      value={{ network, setNetwork: handleSetNetwork, apiBase }}
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
