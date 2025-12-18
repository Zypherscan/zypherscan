/// <reference types="vite/client" />

interface ZucchiniWallet {
  request: (args: { method: string; params?: any }) => Promise<any>;
}

interface Window {
  zucchini?: ZucchiniWallet;
}
