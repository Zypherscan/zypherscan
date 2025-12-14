import { Card } from "@/components/ui/card";
import { WalletBalance, formatZEC } from "@/lib/zcash-crypto";
import { Wallet, Shield, Clock, Layers } from "lucide-react";

interface BalanceCardProps {
  balance: WalletBalance;
}

export function BalanceCard({ balance }: BalanceCardProps) {
  const isEmpty = balance.total === 0 && balance.shielded === 0;

  if (isEmpty) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance - Empty */}
        <Card className="bg-card/30 backdrop-blur-sm p-6 border-border/50">
          <div className="flex items-center justify-between mb-4">
            <Wallet className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium px-2 py-1 bg-secondary rounded-full">
              Total
            </span>
          </div>
          <p className="text-3xl font-bold font-mono mb-1 text-muted-foreground">
            —
          </p>
          <p className="text-sm text-muted-foreground">No data available</p>
        </Card>

        {/* Shielded Balance - Empty */}
        <Card className="bg-card/30 backdrop-blur-sm p-6 border-border/50">
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">
              Shielded
            </span>
          </div>
          <p className="text-2xl font-bold font-mono mb-1 text-muted-foreground">
            —
          </p>
          <p className="text-sm text-muted-foreground">Pending integration</p>
        </Card>

        {/* Pool Breakdown - Empty */}
        <Card className="bg-card/30 backdrop-blur-sm p-6 border-border/50">
          <div className="flex items-center justify-between mb-4">
            <Layers className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">
              Pools
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Orchard</span>
              <span className="font-mono text-sm text-muted-foreground">—</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Sapling</span>
              <span className="font-mono text-sm text-muted-foreground">—</span>
            </div>
          </div>
        </Card>

        {/* Pending - Empty */}
        <Card className="bg-card/30 backdrop-blur-sm p-6 border-border/50">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">
              Pending
            </span>
          </div>
          <p className="text-2xl font-bold font-mono mb-1 text-muted-foreground">
            —
          </p>
          <p className="text-sm text-muted-foreground">Waiting for sync</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Balance */}
      <Card className="card-glow bg-gradient-to-br from-accent/20 via-card to-card p-6 border-accent/30">
        <div className="flex items-center justify-between mb-4">
          <Wallet className="w-6 h-6 text-accent" />
          <span className="text-xs text-accent font-medium px-2 py-1 bg-accent/20 rounded-full">
            Total
          </span>
        </div>
        <p className="text-3xl font-bold font-mono mb-1">
          {formatZEC(balance.total)}
        </p>
        <p className="text-sm text-muted-foreground">ZEC Balance</p>
      </Card>

      {/* Shielded Balance */}
      <Card className="card-glow bg-card/50 backdrop-blur-sm p-6 border-accent/10">
        <div className="flex items-center justify-between mb-4">
          <Shield className="w-6 h-6 text-terminal-green" />
          <span className="text-xs text-terminal-green font-medium">
            Shielded
          </span>
        </div>
        <p className="text-2xl font-bold font-mono mb-1">
          {formatZEC(balance.shielded)}
        </p>
        <p className="text-sm text-muted-foreground">ZEC in shielded pools</p>
      </Card>

      {/* Pool Breakdown */}
      <Card className="card-glow bg-card/50 backdrop-blur-sm p-6 border-accent/10">
        <div className="flex items-center justify-between mb-4">
          <Layers className="w-6 h-6 text-purple-400" />
          <span className="text-xs text-purple-400 font-medium">Pools</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Orchard</span>
            <span className="font-mono text-sm">
              {formatZEC(balance.orchard)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Sapling</span>
            <span className="font-mono text-sm">
              {formatZEC(balance.sapling)}
            </span>
          </div>
        </div>
      </Card>

      {/* Pending */}
      <Card className="card-glow bg-card/50 backdrop-blur-sm p-6 border-accent/10">
        <div className="flex items-center justify-between mb-4">
          <Clock className="w-6 h-6 text-yellow-400" />
          <span className="text-xs text-yellow-400 font-medium">Pending</span>
        </div>
        <p className="text-2xl font-bold font-mono mb-1">
          {formatZEC(balance.pending)}
        </p>
        <p className="text-sm text-muted-foreground">Awaiting confirmation</p>
      </Card>
    </div>
  );
}
