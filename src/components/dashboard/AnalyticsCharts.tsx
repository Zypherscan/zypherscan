import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";
import { formatZEC } from "@/lib/zcash-crypto";

interface AnalyticsChartsProps {
  analytics: {
    dailyVolume: { date: string; incoming: number; outgoing: number }[];
    totalReceived: number;
    totalSent: number;
  } | null;
}

export function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  if (!analytics) {
    return (
      <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10 p-6 h-80 flex items-center justify-center">
        <p className="text-muted-foreground">No analytics data available</p>
      </Card>
    );
  }

  // Transform data for charts
  const chartData = analytics.dailyVolume.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    incoming: d.incoming / 100000000, // Convert to ZEC
    outgoing: d.outgoing / 100000000,
    net: (d.incoming - d.outgoing) / 100000000,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1f2e] border border-accent/20 rounded-lg p-3 shadow-xl">
          <p className="font-medium mb-2 text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(4)} ZEC
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="card-glow bg-card/50 backdrop-blur-sm border-accent/10">
      <Tabs defaultValue="volume" className="w-full">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              Transaction Volume
            </h2>
            <p className="text-sm text-muted-foreground">
              Last 30 days activity
            </p>
          </div>
          <TabsList className="bg-secondary">
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="flow">Net Flow</TabsTrigger>
          </TabsList>
        </div>

        <div className="p-6 pt-4">
          <TabsContent value="volume" className="mt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="incomingGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--terminal-green))"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--terminal-green))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="outgoingGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(0, 72%, 51%)"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(0, 72%, 51%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                    tickFormatter={(value) => `${value.toFixed(1)}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="incoming"
                    name="Incoming"
                    stroke="hsl(var(--terminal-green))"
                    strokeWidth={2}
                    fill="url(#incomingGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="outgoing"
                    name="Outgoing"
                    stroke="hsl(0, 72%, 51%)"
                    strokeWidth={2}
                    fill="url(#outgoingGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="flow" className="mt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="netFlowGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--accent))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--accent))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                    tickFormatter={(value) => `${value.toFixed(2)}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Area
                    type="monotone"
                    dataKey="net"
                    name="Net Flow"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    fill="url(#netFlowGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 p-6 pt-0">
          <div className="bg-terminal-green/10 rounded-lg p-4 border border-terminal-green/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-terminal-green" />
              <span className="text-sm text-muted-foreground">
                Total Received
              </span>
            </div>
            <p className="text-lg font-bold font-mono text-terminal-green">
              +{formatZEC(analytics.totalReceived)} ZEC
            </p>
          </div>
          <div className="bg-red-400/10 rounded-lg p-4 border border-red-400/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
              <span className="text-sm text-muted-foreground">Total Sent</span>
            </div>
            <p className="text-lg font-bold font-mono text-red-400">
              -{formatZEC(analytics.totalSent)} ZEC
            </p>
          </div>
        </div>
      </Tabs>
    </Card>
  );
}
