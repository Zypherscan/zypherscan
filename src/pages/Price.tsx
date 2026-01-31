import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUp,
  ArrowDown,
  Info,
  Calculator,
  TrendingUp as TrendingIcon,
  Globe,
  Shield,
  Box,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// Types
interface PriceData {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

interface CoinData {
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    fully_diluted_valuation: { usd: number };
    total_volume: { usd: number };
    high_24h: { usd: number };
    low_24h: { usd: number };
    price_change_percentage_1h_in_currency: { usd: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_14d: number;
    price_change_percentage_30d: number;
    price_change_percentage_60d: number;
    price_change_percentage_1y: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
    market_cap_rank: number;
    ath: { usd: number };
    ath_change_percentage: { usd: number };
    ath_date: { usd: string };
    atl: { usd: number };
    atl_change_percentage: { usd: number };
    atl_date: { usd: string };
  };
}

const Price = () => {
  const [timeRange, setTimeRange] = useState("1"); // days: 1, 7, 30, 365, max

  // Fetch Detailed Coin Data
  const { data: coinData, isLoading: isLoadingCoin } = useQuery<CoinData>({
    queryKey: ["zcashCoinData"],
    queryFn: async () => {
      const response = await fetch(
        "/coingecko/coins/zcash?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false",
      );
      if (!response.ok) throw new Error("Failed to fetch coin data");
      return response.json();
    },
    refetchInterval: 60000,
  });

  // Fetch Chart Data
  const { data: chartData, isLoading: isLoadingChart } = useQuery<PriceData>({
    queryKey: ["zcashChartData", timeRange],
    queryFn: async () => {
      const response = await fetch(
        `/coingecko/coins/zcash/market_chart?vs_currency=usd&days=${timeRange}`,
      );
      if (!response.ok) throw new Error("Failed to fetch chart data");
      return response.json();
    },
    refetchInterval: 300000, // 5 min
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCompactNumber = (number: number) => {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(number);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const getPercentageColor = (value: number) => {
    return value >= 0 ? "text-green-500" : "text-red-500";
  };

  const chartDataFormatted = chartData?.prices.map(([timestamp, price]) => ({
    date: timestamp,
    price,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded shadow-lg text-xs">
          <p className="text-muted-foreground">
            {new Date(label).toLocaleString()}
          </p>
          <p className="font-bold text-foreground">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const marketData = coinData?.market_data;

  // Local state for converter - MOVED ABOVE EARLY RETURN
  const [zecAmount, setZecAmount] = useState<string>("1");
  const [usdAmount, setUsdAmount] = useState<string>("");

  useEffect(() => {
    if (marketData && zecAmount) {
      const price = marketData.current_price.usd;
      setUsdAmount((parseFloat(zecAmount) * price).toFixed(2));
    }
  }, [zecAmount, marketData]);

  const handleZecChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setZecAmount(value);
      if (marketData && value) {
        setUsdAmount(
          (parseFloat(value) * marketData.current_price.usd).toFixed(2),
        );
      } else {
        setUsdAmount("");
      }
    }
  };

  const handleUsdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setUsdAmount(value);
      if (marketData && value) {
        setZecAmount(
          (parseFloat(value) / marketData.current_price.usd).toFixed(4),
        );
      } else {
        setZecAmount("");
      }
    }
  };

  if (isLoadingCoin && !coinData) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 animate-fade-in relative z-10">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 blur-[120px] -z-10 rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 blur-[120px] -z-10 rounded-full" />
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {coinData?.image ? (
              <img
                src={coinData.image.large}
                alt="Zcash Logo"
                className="w-8 h-8 md:w-10 md:h-10 rounded-full shadow-[0_0_15px_rgba(245,166,35,0.2)]"
              />
            ) : (
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent/20 animate-pulse" />
            )}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Zcash Price{" "}
              <span className="text-muted-foreground text-2xl font-normal">
                (ZEC)
              </span>
            </h1>
          </div>
          {marketData && (
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold font-mono">
                {formatCurrency(marketData.current_price.usd)}
              </span>
              <span
                className={`text-lg font-medium flex items-center ${getPercentageColor(
                  marketData.price_change_percentage_24h,
                )}`}
              >
                {marketData.price_change_percentage_24h >= 0 ? (
                  <ArrowUp className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDown className="w-4 h-4 mr-1" />
                )}
                {Math.abs(marketData.price_change_percentage_24h).toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {["1", "7", "30", "365", "max"].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
              className={
                timeRange === range ? "bg-accent text-accent-foreground" : ""
              }
            >
              {range === "1" ? "24H" : range === "max" ? "All" : `${range}D`}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section - Spans 2 cols */}
        <div className="lg:col-span-2">
          <Card className="h-[500px] border-border/40 bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Price Chart (USD)</CardTitle>
            </CardHeader>
            <CardContent className="h-[420px]">
              {isLoadingChart ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataFormatted}>
                    <defs>
                      <linearGradient
                        id="colorPrice"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f5a623"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f5a623"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(tick) => {
                        const date = new Date(tick);
                        return timeRange === "1"
                          ? date.getHours() + ":00"
                          : date.toLocaleDateString();
                      }}
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      tickFormatter={(val) => `$${val}`}
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={60}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#f5a623" // Zcash Orange
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Sub-grid below chart to fill the gap */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Converter Card */}
            <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-accent" />
                  ZEC Converter
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="zec-amount"
                      className="text-[10px] uppercase font-bold text-muted-foreground"
                    >
                      Amount ZEC
                    </Label>
                    <div className="relative">
                      <Input
                        id="zec-amount"
                        value={zecAmount}
                        onChange={handleZecChange}
                        className="bg-background/50 border-border/20 font-mono pr-12 focus-visible:ring-accent/30"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        ZEC
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="usd-amount"
                      className="text-[10px] uppercase font-bold text-muted-foreground"
                    >
                      Amount USD
                    </Label>
                    <div className="relative">
                      <Input
                        id="usd-amount"
                        value={usdAmount}
                        onChange={handleUsdChange}
                        className="bg-background/50 border-border/20 font-mono pr-12 focus-visible:ring-accent/30"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        USD
                      </div>
                    </div>
                  </div>
                </div>
                {marketData && (
                  <p className="text-[10px] text-center text-muted-foreground mt-2 italic">
                    1 ZEC = {formatCurrency(marketData.current_price.usd)} USD
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Price Statistics Recap */}
            <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingIcon className="w-4 h-4 text-accent" />
                  Price Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2.5">
                {marketData && (
                  <>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Market Rank</span>
                      <span className="font-bold bg-accent/10 px-1.5 py-0.5 rounded text-accent">
                        # {marketData.market_cap_rank}
                      </span>
                    </div>
                    <Separator className="bg-border/10" />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">
                        24h Low / High
                      </span>
                      <span className="font-mono text-[10px]">
                        {formatCurrency(marketData.low_24h.usd)} /{" "}
                        {formatCurrency(marketData.high_24h.usd)}
                      </span>
                    </div>
                    <Separator className="bg-border/10" />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">
                        Market Cap Dominance
                      </span>
                      <span className="font-mono">0.05%</span>
                    </div>
                    <Separator className="bg-border/10" />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">
                        Volume / Market Cap
                      </span>
                      <span className="font-mono">
                        {(
                          marketData.total_volume.usd /
                          marketData.market_cap.usd
                        ).toFixed(4)}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* About Zcash Card */}
          <Card className="border-border/40 bg-card/40 backdrop-blur-sm mt-6">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground/90">
                <Info className="w-5 h-5 text-accent" />
                What is Zcash?
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm text-muted-foreground leading-relaxed">
              <p className="mb-4">
                Zcash is a digital currency with strong privacy features. It
                uses zero-knowledge proofs (zk-SNARKs) to allow users to
                transact without revealing their identity, the recipient, or the
                transaction amount.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/5 border border-accent/10 text-[10px] uppercase font-bold tracking-wider">
                  <Globe className="w-3.5 h-3.5 text-accent" /> Privacy-First
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/5 border border-accent/10 text-[10px] uppercase font-bold tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-accent" /> Secure
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Stats Sidebar */}
        <div className="space-y-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Market Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {marketData && (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                    <span className="text-muted-foreground text-sm">
                      Market Cap
                    </span>
                    <span className="font-mono font-medium">
                      {formatCurrency(marketData.market_cap.usd)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                    <span className="text-muted-foreground text-sm">
                      Trading Volume (24h)
                    </span>
                    <span className="font-mono font-medium">
                      {formatCurrency(marketData.total_volume.usd)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                    <span className="text-muted-foreground text-sm">
                      Fully Diluted Valuation
                    </span>
                    <span className="font-mono font-medium">
                      {formatCurrency(marketData.fully_diluted_valuation.usd)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                    <span className="text-muted-foreground text-sm">
                      Circulating Supply
                    </span>
                    <span className="font-mono font-medium">
                      {formatCompactNumber(marketData.circulating_supply)} ZEC
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/20">
                    <span className="text-muted-foreground text-sm">
                      Total Supply
                    </span>
                    <span className="font-mono font-medium">
                      {formatCompactNumber(marketData.total_supply)} ZEC
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground text-sm">
                      Max Supply
                    </span>
                    <span className="font-mono font-medium">
                      {formatCompactNumber(marketData.max_supply)} ZEC
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Price Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 text-sm">
              {marketData && (
                <>
                  <div className="grid grid-cols-2 gap-4 py-2 border-b border-border/20">
                    <span className="text-muted-foreground">1h Change</span>
                    <span
                      className={`text-right font-medium ${getPercentageColor(marketData.price_change_percentage_1h_in_currency.usd)}`}
                    >
                      {formatPercentage(
                        marketData.price_change_percentage_1h_in_currency.usd,
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-2 border-b border-border/20">
                    <span className="text-muted-foreground">24h Change</span>
                    <span
                      className={`text-right font-medium ${getPercentageColor(marketData.price_change_percentage_24h)}`}
                    >
                      {formatPercentage(marketData.price_change_percentage_24h)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-2 border-b border-border/20">
                    <span className="text-muted-foreground">7d Change</span>
                    <span
                      className={`text-right font-medium ${getPercentageColor(marketData.price_change_percentage_7d)}`}
                    >
                      {formatPercentage(marketData.price_change_percentage_7d)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-2 border-b border-border/20">
                    <span className="text-muted-foreground">14d Change</span>
                    <span
                      className={`text-right font-medium ${getPercentageColor(marketData.price_change_percentage_14d)}`}
                    >
                      {formatPercentage(marketData.price_change_percentage_14d)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-2 border-b border-border/20">
                    <span className="text-muted-foreground">30d Change</span>
                    <span
                      className={`text-right font-medium ${getPercentageColor(marketData.price_change_percentage_30d)}`}
                    >
                      {formatPercentage(marketData.price_change_percentage_30d)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-2">
                    <span className="text-muted-foreground">1y Change</span>
                    <span
                      className={`text-right font-medium ${getPercentageColor(marketData.price_change_percentage_1y)}`}
                    >
                      {formatPercentage(marketData.price_change_percentage_1y)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historical Data & Range */}
      {marketData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Historical Price</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/20">
                <span className="text-muted-foreground text-sm">
                  All-Time High
                </span>
                <div className="text-right">
                  <div className="font-mono font-medium">
                    {formatCurrency(marketData.ath.usd)}
                  </div>
                  <div className="text-xs text-red-500">
                    {marketData.ath_change_percentage.usd.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(marketData.ath_date.usd).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground text-sm">
                  All-Time Low
                </span>
                <div className="text-right">
                  <div className="font-mono font-medium">
                    {formatCurrency(marketData.atl.usd)}
                  </div>
                  <div className="text-xs text-green-500">
                    +{marketData.atl_change_percentage.usd.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(marketData.atl_date.usd).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>24h Range</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center h-[140px] gap-2">
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>Low: {formatCurrency(marketData.low_24h.usd)}</span>
                <span>High: {formatCurrency(marketData.high_24h.usd)}</span>
              </div>
              {/* Range Bar */}
              <div className="w-full h-4 bg-secondary rounded-full relative overflow-hidden">
                <div
                  className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-80"
                  style={{
                    width: "100%",
                  }}
                />
                {/* Marker for current price */}
                <div
                  className="absolute h-6 w-1 bg-white top-1/2 transform -translate-y-1/2 shadow-lg"
                  style={{
                    left: `${Math.min(Math.max(((marketData.current_price.usd - marketData.low_24h.usd) / (marketData.high_24h.usd - marketData.low_24h.usd)) * 100, 0), 100)}%`,
                  }}
                />
              </div>
              <div className="text-center text-xs text-muted-foreground mt-2">
                Current: {formatCurrency(marketData.current_price.usd)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Price;
