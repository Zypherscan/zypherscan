import { useWalletData } from "@/hooks/useWalletData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RefreshCw, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function SyncStatusCard() {
  const { syncStatus, refresh } = useWalletData();

  const isSyncing = syncStatus.isSyncing;
  const currentHeight = syncStatus.currentHeight;
  // If 0 or undefined, and synced, fallback to network height implies we are top
  const displayHeight =
    currentHeight > 0
      ? currentHeight
      : isSyncing
      ? 0
      : syncStatus.networkHeight;

  // Status Text & Icon
  const statusText = isSyncing ? "Syncing..." : "Fully synced";
  const StatusIcon = isSyncing ? RefreshCw : CheckCircle2;
  const iconColor = isSyncing ? "text-yellow-400" : "text-green-500";
  const spinClass = isSyncing ? "animate-spin" : "";

  // Bottom Messaging
  // If syncing, show progress?
  // If synced, show "Wallet is fully synchronized up to block X"

  return (
    <Card className="p-6 bg-card/50 border-accent/10 mb-6">
      <div className="flex items-center justify-between mb-4">
        {/* Header Status */}
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${iconColor} ${spinClass}`} />
          <span className="font-semibold text-lg text-white">{statusText}</span>
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isSyncing}
          className="bg-transparent border-gray-700 hover:bg-gray-800 text-white"
        >
          {isSyncing ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2 fill-current" />
          )}
          Refresh
        </Button>
      </div>

      {/* Status Bar */}
      <div
        className={`p-3 rounded-lg border text-sm font-mono flex items-center
        ${
          isSyncing
            ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
            : "bg-green-500/10 border-green-500/20 text-green-400"
        }`}
      >
        {isSyncing ? (
          <div className="w-full">
            <div className="flex justify-between mb-1">
              <span>Syncing... {syncStatus.progress?.toFixed(1) || 0}%</span>
            </div>
            <Progress
              value={syncStatus.progress || 0}
              className="h-1 bg-yellow-500/20"
              indicatorClassName="bg-yellow-500"
            />
          </div>
        ) : (
          <span>
            Wallet is fully synchronized up to block{" "}
            {displayHeight > 0 ? displayHeight.toLocaleString() : "..."}
          </span>
        )}
      </div>
    </Card>
  );
}
