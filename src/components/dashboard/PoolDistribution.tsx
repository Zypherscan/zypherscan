import { Card } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Layers } from "lucide-react";

interface PoolDistributionProps {
  analytics: {
    poolDistribution: {
      sapling: number;
      orchard: number;
    };
    txTypes: {
      incoming: number;
      outgoing: number;
      internal: number;
    };
  } | null;
}

export function PoolDistribution({ analytics }: PoolDistributionProps) {
  if (!analytics) {
    return (
      <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10 p-6 h-80 flex items-center justify-center">
        <p className="text-muted-foreground">No distribution data available</p>
      </Card>
    );
  }

  const poolData = [
    {
      name: "Orchard",
      value: analytics.poolDistribution.orchard,
      color: "#a855f7",
    },
    {
      name: "Sapling",
      value: analytics.poolDistribution.sapling,
      color: "#3b82f6",
    },
  ].filter((d) => d.value > 0);

  const typeData = [
    {
      name: "Incoming",
      value: analytics.txTypes.incoming,
      color: "hsl(142, 71%, 45%)",
    },
    {
      name: "Outgoing",
      value: analytics.txTypes.outgoing,
      color: "hsl(0, 72%, 51%)",
    },
    {
      name: "Internal",
      value: analytics.txTypes.internal,
      color: "hsl(217, 91%, 60%)",
    },
  ].filter((d) => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value} transactions (
            {(
              (payload[0].value /
                (payload[0].name.includes("Orchard") ||
                payload[0].name.includes("Sapling")
                  ? analytics.poolDistribution.orchard +
                    analytics.poolDistribution.sapling
                  : analytics.txTypes.incoming +
                    analytics.txTypes.outgoing +
                    analytics.txTypes.internal)) *
              100
            ).toFixed(1)}
            %)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent < 0.05) return null; // Don't show labels for small slices
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent" />
          Distribution
        </h2>
        <p className="text-sm text-muted-foreground">Pool & Type breakdown</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Pool Distribution */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            By Pool
          </h3>
          <div className="h-32">
            {poolData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={poolData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {poolData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No pool data
              </div>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {poolData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Type Distribution */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            By Type
          </h3>
          <div className="h-32">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No type data
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {typeData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
