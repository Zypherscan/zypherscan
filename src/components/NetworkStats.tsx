import { Card } from "@/components/ui/card";
import { Activity, TrendingUp, Zap, Users } from "lucide-react";

const stats = [
  {
    label: "Block Height",
    value: "2,345,678",
    icon: Activity,
    change: "+0.2%",
  },
  {
    label: "Hash Rate",
    value: "8.5 GH/s",
    icon: Zap,
    change: "+5.3%",
  },
  {
    label: "Shielded Pool",
    value: "18.2M ZEC",
    icon: Users,
    change: "+1.8%",
  },
  {
    label: "Avg Block Time",
    value: "75s",
    icon: TrendingUp,
    change: "-2.1%",
  },
];

export const NetworkStats = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card 
          key={stat.label}
          className="card-glow bg-card/50 backdrop-blur-sm p-6 border-accent/10"
        >
          <div className="flex items-center justify-between mb-2">
            <stat.icon className="w-5 h-5 text-accent" />
            <span className={`text-xs font-semibold ${
              stat.change.startsWith('+') ? 'text-terminal-green' : 'text-destructive'
            }`}>
              {stat.change}
            </span>
          </div>
          <p className="text-2xl font-bold mb-1 font-mono">{stat.value}</p>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
        </Card>
      ))}
    </div>
  );
};
