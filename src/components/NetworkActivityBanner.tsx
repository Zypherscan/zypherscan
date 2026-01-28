import { useState } from "react";
import { useShieldingActivity } from "@/hooks/useShieldingActivity";
import { formatZEC } from "@/lib/zcash-crypto";
import { X, Activity, Shield, ArrowRightLeft } from "lucide-react";

export interface NetworkActivityBannerProps {
  variant?: "default" | "minimal";
}

export const NetworkActivityBanner = ({
  variant = "default",
}: NetworkActivityBannerProps) => {
  const {
    shieldedAmount,
    unshieldedAmount,
    hasActivity,
    loading,
    blockHeight,
  } = useShieldingActivity();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || loading) return null;
  if (!hasActivity) return null;

  if (variant === "minimal") {
    return (
      <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] md:text-xs h-full">
        <div className="flex items-center gap-1 sm:gap-1.5 border-r border-border/40 pr-2 sm:pr-4 h-full py-0.5">
          <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent" />
          <span className="font-bold text-foreground hidden sm:inline uppercase tracking-tight whitespace-nowrap">
            NETWORK ACTIVITY
          </span>
          <span className="text-muted-foreground font-mono italic">
            #{blockHeight}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 h-full">
          <div className="flex items-center gap-1 sm:gap-2 border-r border-border/40 pr-2 sm:pr-4 h-full py-0.5">
            <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-terminal-green" />
            <span className="text-terminal-green font-mono font-bold leading-none">
              {formatZEC(shieldedAmount)}
            </span>
            <span className="text-muted-foreground font-bold uppercase text-[9px] sm:text-[10px]">
              SHIELDED
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 h-full py-0.5">
            <ArrowRightLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent" />
            <span className="text-accent font-mono font-bold leading-none">
              {formatZEC(unshieldedAmount)}
            </span>
            <span className="text-muted-foreground font-bold uppercase text-[9px] sm:text-[10px]">
              UNSHIELDED
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-background px-6 py-2.5 sm:px-3.5 sm:before:flex-1 border-b">
      <div
        className="absolute left-[max(-7rem,calc(50%-52rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl"
        aria-hidden="true"
      >
        <div
          className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-[#ff80b5] to-[#9089fc] opacity-20"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm leading-6 text-foreground flex items-center gap-2">
          <span className="flex-none rounded-full bg-primary/10 p-1 text-primary">
            <Activity className="h-4 w-4" aria-hidden="true" />
          </span>
          <strong className="font-semibold">Network Activity</strong>
          <span className="hidden sm:inline" aria-hidden="true">
            &middot;
          </span>
          <span className="text-muted-foreground">
            {blockHeight ? `Block #${blockHeight}` : "Recent"}
          </span>
        </p>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
            <Shield className="w-3.5 h-3.5" />
            <span className="font-medium">{formatZEC(shieldedAmount)} ZEC</span>
            <span className="opacity-80 hidden sm:inline">Shielded</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="font-medium">
              {formatZEC(unshieldedAmount)} ZEC
            </span>
            <span className="opacity-80 hidden sm:inline">Unshielded</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 justify-end">
        <button
          type="button"
          className="-m-3 p-3 focus-visible:outline-offset-[-4px]"
          onClick={() => setIsVisible(false)}
        >
          <span className="sr-only">Dismiss</span>
          <X className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
