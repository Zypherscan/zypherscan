import { Card } from "@/components/ui/card";
import { DecryptedTransaction } from "@/lib/zcash-crypto";
import { formatZEC } from "@/lib/zcash-crypto";
import { Activity, TrendingUp, Calendar, Zap } from "lucide-react";

interface QuickStatsProps {
  analytics: {
    totalTransactions: number;
    weeklyTransactions: number;
    averageTransactionSize: number;
    mostActiveDay: string;
    totalFees: number;
  } | null;
  transactions: DecryptedTransaction[];
}

export function QuickStats({ analytics, transactions }: QuickStatsProps) {
  // Empty state stats
  const emptyStats = [
    {
      icon: Activity,
      label: "Total Transactions",
      value: "—",
      subtext: "Waiting for data",
      color: "text-muted-foreground",
    },
    {
      icon: TrendingUp,
      label: "Avg Transaction Size",
      value: "—",
      subtext: "No transactions",
      color: "text-muted-foreground",
    },
    {
      icon: Calendar,
      label: "Most Active Day",
      value: "—",
      subtext: "No activity",
      color: "text-muted-foreground",
    },
    {
      icon: Zap,
      label: "Total Fees Paid",
      value: "—",
      subtext: "No fees",
      color: "text-muted-foreground",
    },
  ];

  const stats = analytics
    ? [
        {
          icon: Activity,
          label: "Total Transactions",
          value: analytics.totalTransactions.toString(),
          subtext: `${analytics.weeklyTransactions} this week`,
          color: "text-accent",
        },
        {
          icon: TrendingUp,
          label: "Avg Transaction Size",
          value: formatZEC(analytics.averageTransactionSize),
          subtext: "ZEC per transaction",
          color: "text-terminal-green",
        },
        {
          icon: Calendar,
          label: "Most Active Day",
          // The string is now formatted as "Dayname, Month DD" in zcash-crypto.ts
          // We can split it or just display it.
          // If we want "Dayname" as value and "Month DD" as subtext:
          value: analytics.mostActiveDay.split(", ")[0] || "N/A",
          subtext: analytics.mostActiveDay.includes(",")
            ? analytics.mostActiveDay.split(", ").slice(1).join(", ")
            : "Based on your history",
          color: "text-purple-400",
        },
        {
          icon: Zap,
          label: "Total Fees Paid",
          value: formatZEC(analytics.totalFees),
          subtext: "ZEC in network fees",
          color: "text-yellow-400",
        },
      ]
    : emptyStats;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card
          key={i}
          className={`backdrop-blur-sm p-4 ${
            analytics
              ? "card-glow bg-card/50 border-accent/10"
              : "bg-card/30 border-border/50"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <p
            className={`text-xl font-bold font-mono mb-1 ${
              !analytics ? "text-muted-foreground" : ""
            }`}
          >
            {stat.value}
          </p>
          <p className="text-xs text-muted-foreground">{stat.subtext}</p>
        </Card>
      ))}
    </div>
  );
}
