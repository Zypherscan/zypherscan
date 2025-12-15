import { useAuthContext } from "@/contexts/AuthContext";

export const useAuth = () => {
  const {
    isConnected,
    viewingKey,
    isLoading,
    login,
    disconnect,
    getBirthdayHeight,
  } = useAuthContext();

  // Helper for compatibility if needed, though mostly we just pass through
  const getViewingKey = () => viewingKey;

  return {
    isConnected,
    viewingKey,
    loading: isLoading, // map isLoading to loading to match previous interface
    login,
    disconnect,
    getViewingKey,
    getBirthdayHeight,
  };
};
