import { useState, useEffect } from "react";
import { X, Download, Wallet } from "lucide-react";

export const InstallZucchiniBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasWallet, setHasWallet] = useState(true);

  useEffect(() => {
    // Check if zucchini wallet exists in window object
    const checkWallet = () => {
      if (typeof window !== "undefined") {
        setHasWallet(!!window.zucchini);
      }
    };

    checkWallet();

    // Optional: Listen for injection (some wallets inject asynchronously)
    window.addEventListener("load", checkWallet);
    return () => window.removeEventListener("load", checkWallet);
  }, []);

  if (!isVisible || hasWallet) return null;

  return (
    <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-background px-6 py-2.5 sm:px-3.5 sm:before:flex-1 border-b border-green-500/20 bg-green-500/5 animate-in slide-in-from-top duration-500">
      <div
        className="absolute left-[max(-7rem,calc(50%-52rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl"
        aria-hidden="true"
      >
        <div
          className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-[#22c55e] to-[#16a34a] opacity-20"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm leading-6 text-foreground flex items-center gap-2">
          <span className="flex-none rounded-full bg-green-500/10 p-1 text-green-600 dark:text-green-400">
            <Wallet className="h-4 w-4" aria-hidden="true" />
          </span>
          <strong className="font-semibold text-green-700 dark:text-green-400">
            Zucchini Wallet
          </strong>
          <span className="hidden sm:inline" aria-hidden="true">
            &middot;
          </span>
          <span className="text-muted-foreground">
            Connect with Zucchini Wallet for a privacy-first experience.
          </span>
        </p>
        <a
          href="https://chromewebstore.google.com/detail/zucchini/khaifnjdhfaadfhgbilokobnaalmimad"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-none rounded-full bg-green-600/10 px-3.5 py-1 text-sm font-semibold text-green-600 shadow-sm hover:bg-green-600/20 dark:text-green-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 flex items-center gap-2 transition-all cursor-pointer"
        >
          Install Now <Download className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="flex flex-1 justify-end">
        <button
          type="button"
          className="-m-3 p-3 focus-visible:outline-offset-[-4px] hover:bg-green-500/5 rounded-full transition-colors"
          onClick={() => setIsVisible(false)}
        >
          <span className="sr-only">Dismiss</span>
          <X className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
