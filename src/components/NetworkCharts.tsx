import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Block } from "@/hooks/useZcashAPI";

interface NetworkChartsProps {
  blocks: Block[];
}

export const NetworkCharts = ({ blocks }: NetworkChartsProps) => {
  const [activeTab, setActiveTab] = useState("times");

  // Process data for charts
  const chartData = useMemo(() => {
    if (!blocks || blocks.length < 2) return [];

    // Sort by height ascending
    const sorted = [...blocks].sort((a, b) => a.height - b.height);

    // If we have fewer than 2 blocks, we can't calculate time diffs well
    if (sorted.length < 2) return [];

    return sorted
      .map((block, i) => {
        let blockTime = 0;
        if (i > 0) {
          const prev = sorted[i - 1];
          const current = new Date(block.timestamp).getTime();
          const previous = new Date(prev.timestamp).getTime();
          blockTime = (current - previous) / 1000;
          // Cap outliers/clock skew for chart readability
          if (blockTime < 0) blockTime = 0;
        }

        return {
          height: block.height,
          hash: block.hash,
          time: new Date(block.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          blockTime, // Seconds since last block
          txCount: block.tx_count,
          size: block.size || 0,
        };
      })
      .slice(1); // Remove first element as it has no valid blockTime diff
  }, [blocks]);

  const avgBlockTime = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    const total = chartData.reduce((acc, curr) => acc + curr.blockTime, 0);
    return Math.round(total / chartData.length);
  }, [chartData]);

  if (!blocks || blocks.length === 0) {
    return null;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm font-bold mb-1">Block #{data.height}</p>
          <p className="text-xs text-muted-foreground mb-2">{data.time}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }} // chart colors
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-mono text-foreground font-medium">
                {entry.name === "Block Time"
                  ? `${entry.value.toFixed(1)}s`
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-1 lg:col-span-2 border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Network Activity (Last {blocks.length} Blocks)</span>
            {activeTab === "times" && (
              <span className="text-sm font-normal text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                Avg: {avgBlockTime}s
                <span className="ml-1 text-xs opacity-70">(Target: 75s)</span>
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="times"
          className="w-full"
          onValueChange={setActiveTab}
        >
          <TabsList className="bg-muted/20 border border-white/5 mb-6">
            <TabsTrigger value="times">Block Times</TabsTrigger>
            <TabsTrigger value="txs">Transactions Per Block</TabsTrigger>
          </TabsList>

          <div className="h-[300px] w-full mt-4">
            <TabsContent value="times" className="h-full mt-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted/20"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="height"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(val) => val.toString().slice(-3)} // Show last 3 digits
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    domain={[0, "auto"]}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 2 }}
                  />
                  <ReferenceLine
                    y={75}
                    stroke="#22c55e"
                    strokeDasharray="3 3"
                    opacity={0.5}
                    label={{
                      value: "Target 75s",
                      position: "insideTopRight",
                      fill: "#22c55e",
                      fontSize: 10,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="blockTime"
                    name="Block Time"
                    stroke="#eab308"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#eab308" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="txs" className="h-full mt-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted/20"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="height"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(val) => val.toString().slice(-3)}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                  <Bar
                    dataKey="txCount"
                    name="Tx Count"
                    fill="#3b82f6"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};
