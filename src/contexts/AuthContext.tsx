import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface WalletState {
  isConnected: boolean;
  viewingKey: string | null;
  birthdayHeight: number | null;
}

interface AuthContextType {
  isConnected: boolean;
  viewingKey: string | null;
  isLoading: boolean;
  login: (key: string, birthdayHeight?: number) => void;
  disconnect: () => void;
  getBirthdayHeight: () => number | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    viewingKey: null,
    birthdayHeight: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing connection on mount
    const connected = localStorage.getItem("zcash_connected") === "true";
    const viewingKey = localStorage.getItem("zcash_viewing_key");
    const birthdayHeightStr = localStorage.getItem("zcash_birthday_height");
    const birthdayHeight = birthdayHeightStr
      ? parseInt(birthdayHeightStr)
      : null;

    setWallet({
      isConnected: connected && !!viewingKey,
      viewingKey: connected ? viewingKey : null,
      birthdayHeight,
    });
    setIsLoading(false);
  }, []);

  const login = useCallback((key: string, birthdayHeight?: number) => {
    localStorage.setItem("zcash_connected", "true");
    localStorage.setItem("zcash_viewing_key", key);
    if (birthdayHeight) {
      localStorage.setItem("zcash_birthday_height", birthdayHeight.toString());
    } else {
      localStorage.removeItem("zcash_birthday_height");
    }

    setWallet({
      isConnected: true,
      viewingKey: key,
      birthdayHeight: birthdayHeight || null,
    });
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem("zcash_connected");
    localStorage.removeItem("zcash_viewing_key");
    localStorage.removeItem("zcash_birthday_height"); // Also clear birthday height

    setWallet({
      isConnected: false,
      viewingKey: null,
      birthdayHeight: null,
    });
  }, []);

  const getBirthdayHeight = useCallback(() => {
    return wallet.birthdayHeight;
  }, [wallet.birthdayHeight]);

  return (
    <AuthContext.Provider
      value={{
        isConnected: wallet.isConnected,
        viewingKey: wallet.viewingKey,
        isLoading,
        login,
        disconnect,
        getBirthdayHeight,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
