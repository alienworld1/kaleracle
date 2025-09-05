'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface PriceData {
  timestamp: number;
  price: number;
  date: string;
  time: string;
}

interface DashboardProps {
  asset?: string;
  timeframe?: '1H' | '24H' | '7D' | '30D';
}

const Dashboard: React.FC<DashboardProps> = ({
  asset = 'EUR/USD',
  timeframe = '24H',
}) => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);

  // Mock data generation - In production, this would fetch from Reflector oracle
  const generateMockData = useCallback(
    (points: number, basePrice: number): PriceData[] => {
      const data: PriceData[] = [];
      const now = Date.now();
      const interval =
        timeframe === '1H'
          ? 60000
          : timeframe === '24H'
            ? 3600000
            : timeframe === '7D'
              ? 3600000 * 24
              : 3600000 * 24 * 7; // 30D

      for (let i = points; i >= 0; i--) {
        const timestamp = now - i * interval;
        const volatility = 0.02; // 2% volatility
        const change = (Math.random() - 0.5) * volatility;
        const price = basePrice * (1 + change * (Math.random() > 0.5 ? 1 : -1));

        data.push({
          timestamp,
          price: parseFloat(price.toFixed(6)),
          date: new Date(timestamp).toLocaleDateString(),
          time: new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
      }
      return data;
    },
    [timeframe],
  );

  const getBasePrice = (assetSymbol: string): number => {
    const basePrices: { [key: string]: number } = {
      'EUR/USD': 1.0856,
      'BTC/USD': 43250.75,
      'ETH/USD': 2635.4,
      'XLM/USD': 0.1245,
    };
    return basePrices[assetSymbol] || 1.0;
  };

  const getDataPoints = (tf: string): number => {
    switch (tf) {
      case '1H':
        return 60;
      case '24H':
        return 24;
      case '7D':
        return 168;
      case '30D':
        return 720;
      default:
        return 24;
    }
  };

  useEffect(() => {
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const basePrice = getBasePrice(asset);
      const points = getDataPoints(timeframe);
      const mockData = generateMockData(points, basePrice);

      setPriceData(mockData);

      if (mockData.length > 0) {
        const latest = mockData[mockData.length - 1];
        const previous = mockData[0];

        setCurrentPrice(latest.price);
        setPriceChange(latest.price - previous.price);
        setPriceChangePercent(
          ((latest.price - previous.price) / previous.price) * 100,
        );
      }

      setIsLoading(false);
    }, 1000);
  }, [asset, timeframe]);

  const formatPrice = (price: number): string => {
    if (asset.includes('BTC') || asset.includes('ETH')) {
      return price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return price.toFixed(6);
  };

  const formatTooltipValue = (value: number): string => {
    return formatPrice(value);
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; payload: PriceData }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">
            {formatTooltipValue(payload[0].value)}
          </p>
          <p className="text-gray-400 text-sm">
            {data.date} {data.time}
          </p>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const basePrice = getBasePrice(asset);
      const points = getDataPoints(timeframe);
      const mockData = generateMockData(points, basePrice);

      setPriceData(mockData);

      if (mockData.length > 0) {
        const latest = mockData[mockData.length - 1];
        const previous = mockData[0];

        setCurrentPrice(latest.price);
        setPriceChange(latest.price - previous.price);
        setPriceChangePercent(
          ((latest.price - previous.price) / previous.price) * 100,
        );
      }

      setIsLoading(false);
    }, 1000);
  }, [asset, timeframe, generateMockData]);

  if (isLoading) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4 w-32"></div>
          <div className="h-4 bg-white/10 rounded mb-6 w-24"></div>
          <div className="h-64 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">{asset}</h3>
          <p className="text-2xl font-bold text-white">
            {formatPrice(currentPrice)}
          </p>
          <div className="flex items-center mt-1">
            <span
              className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {priceChange >= 0 ? '+' : ''}
              {formatPrice(priceChange)}({priceChangePercent >= 0 ? '+' : ''}
              {priceChangePercent.toFixed(2)}%)
            </span>
            <span className="ml-2 text-gray-400 text-sm">{timeframe}</span>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <span className="text-green-400 text-sm font-medium">LIVE</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={priceData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ff3366" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              dataKey="time"
              stroke="rgba(255,255,255,0.6)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.6)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatPrice}
              domain={['dataMin', 'dataMax']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#ff3366"
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: '#ff3366',
                stroke: '#ffffff',
                strokeWidth: 2,
                filter: 'drop-shadow(0 0 6px rgba(255, 51, 102, 0.8))',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/10">
        <div>
          <p className="text-gray-400 text-sm">24h High</p>
          <p className="text-white font-medium">
            {formatPrice(Math.max(...priceData.map(d => d.price)))}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">24h Low</p>
          <p className="text-white font-medium">
            {formatPrice(Math.min(...priceData.map(d => d.price)))}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Data Points</p>
          <p className="text-white font-medium">{priceData.length}</p>
        </div>
      </div>

      {/* Oracle Info */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-blue-400 text-sm font-medium">
              Reflector Oracle
            </span>
          </div>
          <span className="text-gray-400 text-xs">Stellar Testnet</span>
        </div>
        <p className="text-gray-400 text-xs mt-1">
          Price data sourced from Reflector&apos;s decentralized oracle network
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
