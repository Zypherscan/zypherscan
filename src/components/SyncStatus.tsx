import { useState } from "react";
import { useSync } from "@/hooks/useSync";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  CloudOff,
  Play,
  Pause,
} from "lucide-react";

interface SyncStatusProps {
  variant?: "compact" | "full";
  showActions?: boolean;
}

export const SyncStatus = ({
  variant = "compact",
  showActions = true,
}: SyncStatusProps) => {
  const { syncProgress, isLoading, startSync, stopSync, retrySync } = useSync();

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round(
      (seconds % 3600) / 60
    )}m`;
  };

  const getStatusIcon = () => {
    if (!syncProgress)
      return <CloudOff className="w-4 h-4 text-muted-foreground" />;

    switch (syncProgress.status) {
      case "syncing":
      case "scanning":
        return <Loader2 className="w-4 h-4 text-accent animate-spin" />;
      case "complete":
        return <CheckCircle2 className="w-4 h-4 text-terminal-green" />;
      case "error":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <RefreshCw className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    if (!syncProgress) return "Not synced";

    switch (syncProgress.status) {
      case "syncing":
        return `Syncing... ${syncProgress.percentage.toFixed(1)}%`;
      case "scanning":
        return "Scanning for transactions...";
      case "complete":
        return "Fully synced";
      case "error":
        return syncProgress.error || "Sync error";
      default:
        return "Ready to sync";
    }
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm text-muted-foreground">{getStatusText()}</span>
        {showActions && (
          <>
            {syncProgress?.status === "syncing" ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={stopSync}
              >
                <Pause className="w-3 h-3" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={startSync}
                disabled={isLoading}
              >
                <Play className="w-3 h-3" />
              </Button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-accent/10">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          {showActions && (
            <div className="flex items-center gap-2">
              {syncProgress?.status === "syncing" ? (
                <Button variant="outline" size="sm" onClick={stopSync}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              ) : syncProgress?.status === "error" ? (
                <Button variant="outline" size="sm" onClick={retrySync}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startSync}
                  disabled={isLoading}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {syncProgress?.status === "complete"
                    ? "Refresh"
                    : "Start Sync"}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {syncProgress &&
          (syncProgress.status === "syncing" ||
            syncProgress.status === "scanning") && (
            <>
              <Progress value={syncProgress.percentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Block {syncProgress.currentHeight.toLocaleString()} /{" "}
                  {syncProgress.targetHeight.toLocaleString()}
                </span>
                <span>{syncProgress.blocksPerSecond.toFixed(0)} blocks/s</span>
                <span>
                  ~{formatTime(syncProgress.estimatedTimeRemaining)} remaining
                </span>
              </div>
            </>
          )}

        {/* Error message */}
        {syncProgress?.status === "error" && syncProgress.error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-destructive">{syncProgress.error}</p>
          </div>
        )}

        {/* Complete message */}
        {syncProgress?.status === "complete" && (
          <div className="p-3 rounded-lg bg-terminal-green/10 border border-terminal-green/30">
            <p className="text-sm text-terminal-green">
              Wallet is fully synchronized up to block{" "}
              {syncProgress.currentHeight.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SyncStatus;
