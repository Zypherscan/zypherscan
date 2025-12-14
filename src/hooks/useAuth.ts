import { useState, useEffect, useCallback } from "react";

interface WalletState {
  isConnected: boolean;
  viewingKey: string | null;
}

export const useAuth = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    viewingKey: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing connection
    const connected = localStorage.getItem("zcash_connected") === "true";
    const viewingKey = localStorage.getItem("zcash_viewing_key");

    setWallet({
      isConnected: connected && !!viewingKey,
      viewingKey: connected ? viewingKey : null,
    });
    setLoading(false);
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem("zcash_connected");
    localStorage.removeItem("zcash_viewing_key");
    setWallet({
      isConnected: false,
      viewingKey: null,
    });
  }, []);

  const getViewingKey = useCallback(() => {
    return localStorage.getItem("zcash_viewing_key");
  }, []);

  const getBirthdayHeight = useCallback(() => {
    const height = localStorage.getItem("zcash_birthday_height");
    return height ? parseInt(height) : null;
  }, []);

  return {
    isConnected: wallet.isConnected,
    viewingKey: wallet.viewingKey,
    loading,
    disconnect,
    getViewingKey,
    getBirthdayHeight,
  };
};
